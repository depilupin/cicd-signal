import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { AppError, createSuccessResponse, formatLogEntry } from "@signal/shared";
import { prisma, type BillingProvider } from "@signal/database";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  sendBillingReceiptEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionReactivatedEmail,
} from "../services/email";

export const billingRouter = Router();

const SESSION_COOKIE = "signal_session";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Authentication middleware helper for billing operations
 */
async function getAuthenticatedUser(req: Request) {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) {
    throw AppError.unauthorized("Authentication required to access billing services");
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
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw AppError.unauthorized("Session expired or invalid");
  }

  return session.user;
}

/**
 * 1. GET /billing/subscription — Get current user's active subscription and quota
 */
billingRouter.get("/subscription", asyncHandler(async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    include: {
      plan: true,
      usageRecords: {
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    res.status(200).json(
      createSuccessResponse({
        hasActiveSubscription: false,
        subscription: null,
      })
    );
    return;
  }

  const scansUsed = subscription.usageRecords.length;
  const scansQuota = subscription.plan.maxScansPerMonth;
  const scansRemaining = Math.max(0, scansQuota - scansUsed);

  res.status(200).json(
    createSuccessResponse({
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        provider: subscription.provider,
        providerSubscriptionId: subscription.providerSubscriptionId,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt.toISOString(),
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          priceCents: subscription.plan.priceCents,
          currency: subscription.plan.currency,
          interval: subscription.plan.interval,
          features: subscription.plan.features,
          maxScansPerMonth: subscription.plan.maxScansPerMonth,
        },
        usage: {
          scansUsed,
          maxScansPerMonth: scansQuota,
          scansRemaining,
          percentUsed: scansQuota > 0 ? Math.round((scansUsed / scansQuota) * 100) : 0,
        },
      },
    })
  );
}));

/**
 * 2. POST /billing/checkout — Process checkout and activate subscription
 */
billingRouter.post("/checkout", asyncHandler(async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  const { planId, billingDetails, paymentMethod } = req.body || {};

  if (!planId || typeof planId !== "string") {
    throw AppError.badRequest("Valid planId ('month', 'quarter', or 'year') is required");
  }

  // Find target plan
  let plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    // If not in database, attempt to auto-seed fallback plan
    const fallbackPlans: Record<string, { name: string; priceCents: number; interval: string; maxScans: number }> = {
      month: { name: "1 Month", priceCents: 3900, interval: "month", maxScans: 50 },
      quarter: { name: "3 Months", priceCents: 9900, interval: "quarter", maxScans: 200 },
      year: { name: "1 Year", priceCents: 29900, interval: "year", maxScans: 1000 },
    };
    const fb = fallbackPlans[planId];
    if (fb) {
      plan = await prisma.plan.create({
        data: {
          id: planId,
          name: fb.name,
          priceCents: fb.priceCents,
          interval: fb.interval,
          maxScansPerMonth: fb.maxScans,
          features: ["CI/CD workflow scanning", "Risk prioritization", "Line-level findings"],
        },
      });
    } else {
      throw AppError.notFound(`Plan '${planId}' does not exist`);
    }
  }

  // Calculate duration
  let durationDays = 30;
  if (plan.interval === "quarter" || plan.id === "quarter") durationDays = 90;
  if (plan.interval === "year" || plan.id === "year") durationDays = 365;

  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const providerEnv = (process.env.BILLING_PROVIDER || "stripe").toUpperCase() as BillingProvider;
  const providerSubId = `sub_${crypto.randomBytes(12).toString("hex")}`;
  const invoiceId = `INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // Deactivate any currently active subscriptions
  await prisma.subscription.updateMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
    },
  });

  // Create new active subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "ACTIVE",
      provider: providerEnv === "RAZORPAY" ? "RAZORPAY" : "STRIPE",
      providerSubscriptionId: providerSubId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
    include: {
      plan: true,
    },
  });

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "BILLING_CHECKOUT_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        planId: plan.id,
        planName: plan.name,
        priceCents: plan.priceCents,
        invoiceId,
        provider: providerEnv,
      },
    },
  });

  // Record payment event
  await prisma.paymentEvent.create({
    data: {
      eventId: `evt_${crypto.randomBytes(12).toString("hex")}`,
      provider: providerEnv === "RAZORPAY" ? "RAZORPAY" : "STRIPE",
      eventType: "invoice.paid",
      payload: {
        invoiceId,
        subscriptionId: subscription.id,
        userId: user.id,
        userEmail: user.email,
        planId: plan.id,
        planName: plan.name,
        amountCents: plan.priceCents,
        currency: plan.currency,
        billingDetails: billingDetails || {
          name: user.name || user.email.split("@")[0],
          email: user.email,
          country: "US",
        },
        paymentMethod: {
          brand: paymentMethod?.cardBrand || "Visa",
          last4: paymentMethod?.cardLast4 || "4242",
          expMonth: paymentMethod?.expMonth || 12,
          expYear: paymentMethod?.expYear || 2028,
        },
        paidAt: new Date().toISOString(),
        status: "paid",
      },
    },
  });

  // Dispatch official invoice receipt email asynchronously via Resend
  sendBillingReceiptEmail({
    to: user.email,
    name: user.name || user.email.split("@")[0],
    invoiceId,
    planName: plan.name,
    amount: `$${(plan.priceCents / 100).toFixed(2)}`,
    currentPeriodEnd,
    paymentMethod: {
      brand: paymentMethod?.cardBrand || "Visa",
      last4: paymentMethod?.cardLast4 || "4242",
    },
  }).catch((err) => {
    console.error(formatLogEntry("api", "warn", "Non-blocking failure sending billing receipt email", { error: String(err) }));
  });

  console.log(
    formatLogEntry(
      "api",
      "info",
      `Subscription activated for ${user.email}: ${plan.name} ($${(plan.priceCents / 100).toFixed(2)})`,
      { userId: user.id, subscriptionId: subscription.id, invoiceId }
    )
  );

  res.status(200).json(
    createSuccessResponse({
      message: "Subscription activated successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      invoice: {
        invoiceId,
        amount: `$${(plan.priceCents / 100).toFixed(2)}`,
        amountCents: plan.priceCents,
        currency: plan.currency,
        planName: plan.name,
        date: currentPeriodStart.toISOString(),
        status: "PAID",
      },
    })
  );
}));

/**
 * 3. POST /billing/cancel — Schedule cancellation at period end
 */
billingRouter.post("/cancel", asyncHandler(async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
  });

  if (!activeSub) {
    throw AppError.badRequest("No active subscription found to cancel");
  }

  const updated = await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { cancelAtPeriodEnd: true },
    include: { plan: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "BILLING_SUBSCRIPTION_CANCEL_SCHEDULED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { subscriptionId: activeSub.id },
    },
  });

  // Dispatch cancellation notification email asynchronously via Resend
  sendSubscriptionCancelledEmail({
    to: user.email,
    name: user.name || user.email.split("@")[0],
    planName: updated.plan.name,
    currentPeriodEnd: updated.currentPeriodEnd,
  }).catch((err) => {
    console.error(formatLogEntry("api", "warn", "Non-blocking failure sending cancel email", { error: String(err) }));
  });

  res.status(200).json(
    createSuccessResponse({
      message: "Subscription scheduled for cancellation at the end of the billing period",
      subscription: updated,
    })
  );
}));

/**
 * 4. POST /billing/reactivate — Reactivate subscription if scheduled for cancellation
 */
billingRouter.post("/reactivate", asyncHandler(async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
  });

  if (!activeSub) {
    throw AppError.badRequest("No active subscription found");
  }

  const updated = await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { cancelAtPeriodEnd: false },
    include: { plan: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "BILLING_SUBSCRIPTION_REACTIVATED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { subscriptionId: activeSub.id },
    },
  });

  // Dispatch reactivation confirmation email asynchronously via Resend
  sendSubscriptionReactivatedEmail({
    to: user.email,
    name: user.name || user.email.split("@")[0],
    planName: updated.plan.name,
    currentPeriodEnd: updated.currentPeriodEnd,
  }).catch((err) => {
    console.error(formatLogEntry("api", "warn", "Non-blocking failure sending reactivate email", { error: String(err) }));
  });

  res.status(200).json(
    createSuccessResponse({
      message: "Subscription renewed and auto-renew reactivated",
      subscription: updated,
    })
  );
}));

/**
 * 5. GET /billing/invoices — Get payment and receipt history
 */
billingRouter.get("/invoices", asyncHandler(async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);

  const paymentEvents = await prisma.paymentEvent.findMany({
    where: {
      eventType: "invoice.paid",
    },
    orderBy: { processedAt: "desc" },
    take: 20,
  });

  // Filter invoices belonging to this user
  const userInvoices = paymentEvents
    .filter((event) => {
      const payload = event.payload as Record<string, unknown> | null;
      return payload && (payload.userId === user.id || payload.userEmail === user.email);
    })
    .map((event) => {
      const payload = event.payload as {
        invoiceId?: string;
        planName?: string;
        amountCents?: number;
        currency?: string;
        status?: string;
        paidAt?: string;
        paymentMethod?: { brand: string; last4: string };
      };

      return {
        id: event.id,
        invoiceId: payload.invoiceId || `INV-${event.id.slice(0, 8).toUpperCase()}`,
        planName: payload.planName || "Research Tier",
        amount: payload.amountCents ? `$${(payload.amountCents / 100).toFixed(2)}` : "$39.00",
        amountCents: payload.amountCents || 3900,
        currency: payload.currency || "USD",
        status: (payload.status || "PAID").toUpperCase(),
        date: payload.paidAt || event.processedAt.toISOString(),
        paymentMethod: payload.paymentMethod || { brand: "Visa", last4: "4242" },
      };
    });

  res.status(200).json(createSuccessResponse(userInvoices));
}));
