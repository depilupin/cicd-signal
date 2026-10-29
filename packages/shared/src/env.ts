import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

export function loadMonorepoEnv(startDir: string = process.cwd()): string | null {
  let curr = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(curr, ".env");
    if (fs.existsSync(candidate)) {
      if (typeof process.loadEnvFile === "function") {
        try {
          process.loadEnvFile(candidate);
          return candidate;
        } catch {
          // Ignore if already loaded or parsing error
        }
      }
      break;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return null;
}

export const NodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

export const ApiEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/signal?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_SECRET: z.string().min(16).default("dev-session-secret-change-in-production-min-32-chars"),
  COOKIE_SECRET: z.string().min(16).default("dev-cookie-secret-change-in-production-min-32-chars"),
  
  // GitHub App
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_CLIENT_ID: z.string().optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default("http://localhost:4000/api/v1/auth/google/callback"),

  // Billing Provider (Stripe / Razorpay)
  BILLING_PROVIDER: z.enum(["stripe", "razorpay"]).default("stripe"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTH: z.string().optional(),
  STRIPE_PRICE_ID_QUARTER: z.string().optional(),
  STRIPE_PRICE_ID_YEAR: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Resend Email Communications
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Signal Security <billing@threadsecurity.in>"),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const WorkerEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/signal?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  SCAN_MAX_FILES_PER_REPO: z.coerce.number().int().default(100),
  SCAN_MAX_WORKFLOW_BYTES: z.coerce.number().int().default(500000),
  WORKER_CONCURRENCY: z.coerce.number().int().default(5),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
