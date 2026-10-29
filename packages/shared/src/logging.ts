export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  scanId?: string;
  repositoryId?: string;
  installationId?: number;
  ruleId?: string;
  [key: string]: unknown;
}

export interface StructuredLogRecord {
  level: LogLevel;
  timestamp: string;
  service: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /client[_-]?secret/i,
];

export function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Redact Bearer tokens
    if (obj.startsWith("Bearer ") && obj.length > 15) {
      return "Bearer [REDACTED]";
    }
    // Redact standard GitHub Personal Access Tokens & Installation tokens
    if (/^(ghp_|ghs_|gho_|ghu_|ghr_)[a-zA-Z0-9_]{20,}/.test(obj)) {
      return "[REDACTED_GH_TOKEN]";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return redacted;
  }

  return obj;
}

export function formatLogEntry(
  service: string,
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): string {
  const record: StructuredLogRecord = {
    service,
    level,
    timestamp: new Date().toISOString(),
    message,
  };

  if (context && Object.keys(context).length > 0) {
    record.context = redactSensitiveData(context) as LogContext;
  }

  if (error) {
    record.error = {
      name: error.name,
      message: error.message,
      stack:
        typeof process !== "undefined" && process?.env?.NODE_ENV !== "production"
          ? error.stack
          : undefined,
    };
  }

  return JSON.stringify(record);
}
