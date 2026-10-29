import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers[REQUEST_ID_HEADER];
  const requestId = typeof incomingId === "string" && incomingId.length > 0 ? incomingId : randomUUID();
  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
