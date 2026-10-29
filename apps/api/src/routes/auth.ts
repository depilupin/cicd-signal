import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { AppError, createSuccessResponse, formatLogEntry } from "@signal/shared";
import { prisma } from "@signal/database";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendWelcomeEmail } from "../services/email.js";

export const authRouter = Router();

const SESSION_COOKIE = "signal_session";
const OAUTH_STATE_COOKIE = "signal_oauth_state";
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export async function createSession(userId: string, req: Request, res: Response) {
  const rawSessionToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawSessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    },
  });

  res.cookie(SESSION_COOKIE, rawSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
  });

  return { rawSessionToken, expiresAt };
}

/**
 * 1. GET /auth/google — Initiate Google OAuth 2.0 flow
 */
authRouter.get("/google", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/v1/auth/google/callback";

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    throw AppError.badRequest("Google OAuth credentials are not configured on this server");
  }

  // Generate cryptographic state for CSRF protection
  const state = crypto.randomBytes(24).toString("hex");

  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.redirect(authUrl);
});

/**
 * 2. GET /auth/google/callback — Google OAuth code exchange
 */
authRouter.get("/google/callback", asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const savedState = req.cookies[OAUTH_STATE_COOKIE];
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  res.clearCookie(OAUTH_STATE_COOKIE);

  if (!state || !savedState || state !== savedState) {
    console.error(
      formatLogEntry("api", "warn", "Google OAuth state mismatch or missing", {
        receivedState: typeof state === "string" ? state.slice(0, 8) : undefined,
      })
    );
    res.redirect(`${frontendUrl}/?auth_error=state_mismatch`);
    return;
  }

  if (typeof code !== "string") {
    res.redirect(`${frontendUrl}/?auth_error=missing_code`);
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/v1/auth/google/callback";

  if (!clientId || !clientSecret) {
    res.redirect(`${frontendUrl}/?auth_error=server_configuration`);
    return;
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error(
        formatLogEntry("api", "error", `Google token exchange failed: ${errText}`, {
          status: tokenResponse.status,
        })
      );
      res.redirect(`${frontendUrl}/?auth_error=token_exchange_failed`);
      return;
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; id_token: string };

    // Fetch user profile from Google UserInfo
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      res.redirect(`${frontendUrl}/?auth_error=profile_fetch_failed`);
      return;
    }

    const profile = (await profileResponse.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      verified_email?: boolean;
    };

    if (!profile.email) {
      res.redirect(`${frontendUrl}/?auth_error=no_email_returned`);
      return;
    }

    // Upsert User in PostgreSQL
    const user = await prisma.user.upsert({
      where: { email: profile.email.toLowerCase() },
      update: {
        googleId: profile.id,
        name: profile.name || undefined,
        avatarUrl: profile.picture || undefined,
        emailVerified: true,
      },
      create: {
        email: profile.email.toLowerCase(),
        googleId: profile.id,
        name: profile.name,
        avatarUrl: profile.picture,
        emailVerified: true,
      },
    });

    // Create session
    await createSession(user.id, req, res);

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "AUTH_LOGIN_GOOGLE",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: { email: user.email },
      },
    });

    console.log(
      formatLogEntry("api", "info", `User authenticated successfully via Google: ${user.email}`, {
        userId: user.id,
      })
    );

    const isNewUser = Date.now() - user.createdAt.getTime() < 10000;
    if (isNewUser) {
      sendWelcomeEmail({
        to: user.email,
        name: user.name || user.email.split("@")[0],
      }).catch((err) => {
        console.error(
          formatLogEntry("api", "warn", "Non-blocking failure sending welcome email to Google user", {
            error: String(err),
          })
        );
      });
    }

    // Lead directly to dedicated pricing page upon successful sign-in
    res.redirect(`${frontendUrl}/pricing?auth=google_success`);
  } catch (error) {
    console.error(
      formatLogEntry(
        "api",
        "error",
        "Unhandled error during Google OAuth callback",
        undefined,
        error instanceof Error ? error : new Error(String(error))
      )
    );
    res.redirect(`${frontendUrl}/?auth_error=server_error`);
  }
}));

/**
 * 3. POST /auth/signup — Register with email & password
 */
authRouter.post("/signup", asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw AppError.badRequest("A valid email address is required");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters long");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = typeof name === "string" && name.trim() ? name.trim() : cleanEmail.split("@")[0];

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  let user;
  if (existing) {
    if (existing.passwordHash) {
      throw AppError.badRequest("An account with this email already exists. Please sign in.");
    }
    // Existing OAuth user linking password credentials
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: hashPassword(password),
        name: existing.name || cleanName,
        emailVerified: true,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        passwordHash: hashPassword(password),
        emailVerified: true,
      },
    });
  }

  await createSession(user.id, req, res);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "AUTH_SIGNUP_EMAIL",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { email: user.email },
    },
  });

  // Dispatch researcher welcome email asynchronously via Resend
  sendWelcomeEmail({
    to: user.email,
    name: user.name || user.email.split("@")[0],
  }).catch((err) => {
    console.error(formatLogEntry("api", "warn", "Non-blocking failure sending welcome email", { error: String(err) }));
  });

  res.status(201).json(
    createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      redirectTo: "/pricing",
      message: "Account created successfully",
    })
  );
}));

/**
 * 4. POST /auth/login — Authenticate with email & password
 */
authRouter.post("/login", asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    throw AppError.badRequest("Email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || !user.passwordHash) {
    throw AppError.badRequest("Invalid email or password");
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw AppError.badRequest("Invalid email or password");
  }

  await createSession(user.id, req, res);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "AUTH_LOGIN_EMAIL",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { email: user.email },
    },
  });

  res.status(200).json(
    createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      redirectTo: "/pricing",
      message: "Signed in successfully",
    })
  );
}));

/**
 * 5. GET /auth/me — Return currently authenticated user profile
 */
authRouter.get("/me", asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[SESSION_COOKIE];

  if (!token) {
    throw AppError.unauthorized("No active session");
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    res.clearCookie(SESSION_COOKIE);
    throw AppError.unauthorized("Session expired or revoked");
  }

  res.status(200).json(
    createSuccessResponse({
      user: session.user,
      expiresAt: session.expiresAt.toISOString(),
    })
  );
}));

/**
 * 6. POST /auth/logout — Revoke session and clear cookie
 */
authRouter.post("/logout", asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[SESSION_COOKIE];

  if (token) {
    const tokenHash = hashToken(token);
    try {
      await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore if session not found
    }
  }

  res.clearCookie(SESSION_COOKIE);
  res.status(200).json(createSuccessResponse({ message: "Logged out successfully" }));
}));
