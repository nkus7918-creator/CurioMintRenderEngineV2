import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  name: "curiomint-render-engine",

  level: process.env.LOG_LEVEL || "info",

  timestamp: pino.stdTimeFunctions.isoTime,

  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "authorization",
      "cookie",
    ],
    censor: "[REDACTED]",
  },
});