import { PrismaClient } from "@prisma/client";
import { loadMonorepoEnv } from "@signal/shared";

loadMonorepoEnv();

declare global {
  // eslint-disable-next-line no-var
  var __signalPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__signalPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__signalPrisma = prisma;
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Database probe failed",
    };
  }
}

export * from "@prisma/client";
