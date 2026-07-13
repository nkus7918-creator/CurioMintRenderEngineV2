import express from "express";
import cors from "cors";
import fs from "fs";
import { randomUUID } from "crypto";
import pinoHttp from "pino-http";

import renderRouter from "./routes/render";
import jobRouter from "./routes/job";
import { env } from "./config/env";
import { logger } from "./shared/logger";

fs.mkdirSync(env.outputDir, {
  recursive: true,
});

const app = express();

app.use(
  pinoHttp({
    logger,

    genReqId: (req, res) => {
      const incomingRequestId = req.headers["x-request-id"];

      const requestId =
        typeof incomingRequestId === "string" && incomingRequestId.trim()
          ? incomingRequestId
          : randomUUID();

      res.setHeader("x-request-id", requestId);

      return requestId;
    },

    autoLogging: {
      ignore: (req) => req.url === "/health",
    },
  }),
);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.use("/render", renderRouter);
app.use("/jobs", jobRouter);

app.listen(env.port, "0.0.0.0", () => {
  logger.info(
    {
      event: "server.started",
      port: env.port,
      environment: env.nodeEnv,
      outputDir: env.outputDir,
    },
    "Render Engine server started",
  );
});