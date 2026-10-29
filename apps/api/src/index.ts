import { formatLogEntry, loadMonorepoEnv } from "@signal/shared";

loadMonorepoEnv();

import { createApp } from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const HOST = process.env.HOST || "0.0.0.0";
const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(
    formatLogEntry("api", "info", `Signal API server listening on port ${PORT}`, {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || "development",
    })
  );
});

function gracefulShutdown(signal: string) {
  console.log(formatLogEntry("api", "info", `Received ${signal}, initiating graceful shutdown...`));
  server.close(() => {
    console.log(formatLogEntry("api", "info", "HTTP server closed cleanly."));
    process.exit(0);
  });

  setTimeout(() => {
    console.error(formatLogEntry("api", "error", "Forced shutdown after 10s timeout."));
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
