import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { plansRouter } from "./routes/plans";
import { authRouter } from "./routes/auth";
import { billingRouter } from "./routes/billing";
import { AppError } from "@signal/shared";

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);

  // Health and observability routes
  app.use("/", healthRouter);

  // Public API routes
  app.use("/api/v1", plansRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/billing", billingRouter);

  // 404 handler
  app.use((_req, _res, next) => {
    next(AppError.notFound("API route not found"));
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}
