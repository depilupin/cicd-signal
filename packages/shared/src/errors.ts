import { z } from "zod";

export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INSUFFICIENT_ENTITLEMENTS: "INSUFFICIENT_ENTITLEMENTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SCAN_LIMIT_EXCEEDED: "SCAN_LIMIT_EXCEEDED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(options: {
    message: string;
    statusCode: number;
    code: ErrorCodeType;
    details?: ErrorDetails;
    isOperational?: boolean;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;

    if (options.cause) {
      this.cause = options.cause;
    }
    if ("captureStackTrace" in Error && typeof (Error as { captureStackTrace?: unknown }).captureStackTrace === "function") {
      (Error as { captureStackTrace: (target: object, constructorOpt?: unknown) => void }).captureStackTrace(
        this,
        this.constructor
      );
    }
  }

  static badRequest(message: string, details?: ErrorDetails): AppError {
    return new AppError({ message, statusCode: 400, code: ErrorCode.BAD_REQUEST, details });
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError({ message, statusCode: 401, code: ErrorCode.UNAUTHORIZED });
  }

  static forbidden(message = "Access denied"): AppError {
    return new AppError({ message, statusCode: 403, code: ErrorCode.FORBIDDEN });
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError({ message, statusCode: 404, code: ErrorCode.NOT_FOUND });
  }

  static conflict(message: string, details?: ErrorDetails): AppError {
    return new AppError({ message, statusCode: 409, code: ErrorCode.CONFLICT, details });
  }

  static validation(message = "Validation failed", details?: ErrorDetails): AppError {
    return new AppError({ message, statusCode: 422, code: ErrorCode.VALIDATION_ERROR, details });
  }

  static rateLimited(message = "Rate limit exceeded. Please try again later."): AppError {
    return new AppError({ message, statusCode: 429, code: ErrorCode.RATE_LIMITED });
  }

  static internal(message = "An unexpected internal error occurred", cause?: unknown): AppError {
    return new AppError({
      message,
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      isOperational: false,
      cause,
    });
  }

  static external(message: string, details?: ErrorDetails): AppError {
    return new AppError({
      message,
      statusCode: 502,
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      details,
    });
  }
}

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    requestId: z.string().optional(),
    timestamp: z.string(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
