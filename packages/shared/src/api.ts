import { z } from "zod";

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    [key: string]: unknown;
  };
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const HealthCheckResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  services: z.record(
    z.object({
      status: z.enum(["up", "down", "unconfigured"]),
      latencyMs: z.number().optional(),
      message: z.string().optional(),
    })
  ),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
