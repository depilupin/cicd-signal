import { Router, type Request, type Response } from "express";
import { createSuccessResponse, type HealthCheckResponse } from "@signal/shared";
import { checkDatabaseHealth } from "@signal/database";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json(
    createSuccessResponse({
      name: "Signal CI/CD Vulnerability Scanner API",
      status: "online",
      version: "0.1.0",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      endpoints: {
        health: "/healthz",
        ready: "/readyz",
        plans: "/api/v1/plans",
        auth: "/api/v1/auth",
        billing: "/api/v1/billing",
      },
    })
  );
});

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.redirect("/healthz");
});

healthRouter.get("/healthz", (_req: Request, res: Response) => {
  const health: HealthCheckResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    services: {
      api: { status: "up" },
    },
  };
  res.status(200).json(createSuccessResponse(health));
});

healthRouter.get("/readyz", asyncHandler(async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();

  const isHealthy = dbHealth.connected;
  const status = isHealthy ? "ok" : "degraded";

  const readiness: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    services: {
      api: { status: "up" },
      database: {
        status: dbHealth.connected ? "up" : "down",
        latencyMs: dbHealth.latencyMs,
        message: dbHealth.error,
      },
      redis: {
        status: process.env.REDIS_URL ? "up" : "unconfigured",
        message: "Configured via Upstash TLS",
      },
    },
  };

  res.status(isHealthy ? 200 : 503).json(createSuccessResponse(readiness));
}));

