import { formatLogEntry } from "@signal/shared";
import { BUILTIN_RULES } from "@signal/scanner-rules";

console.log(
  formatLogEntry("worker", "info", "Signal scanner worker initialized", {
    registeredRulesCount: BUILTIN_RULES.length,
    nodeEnv: process.env.NODE_ENV || "development",
  })
);

function shutdown(signal: string) {
  console.log(formatLogEntry("worker", "info", `Received ${signal}, worker shutting down cleanly.`));
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
