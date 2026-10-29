import { type Request, type Response, type NextFunction } from "express";
import { AppError, ErrorCode, formatLogEntry, type ApiErrorResponse } from "@signal/shared";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  if (err instanceof AppError) {
    if (!err.isOperational) {
      console.error(
        formatLogEntry(
          "api",
          "error",
          `Operational error occurred: ${err.message}`,
          { requestId, code: err.code, details: err.details },
          err
        )
      );
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(err.statusCode).json(payload);
    return;
  }

  // Handle generic / unexpected errors
  const standardError = err instanceof Error ? err : new Error(String(err));
  console.error(
    formatLogEntry(
      "api",
      "fatal",
      `Unhandled internal server error: ${standardError.message}`,
      { requestId },
      standardError
    )
  );

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "An unexpected internal server error occurred",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(500).json(payload);
}
