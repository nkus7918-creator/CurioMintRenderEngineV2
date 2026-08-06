import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import pinoHttp from "pino-http";

import renderRouter from "./routes/render";
import jobRouter from "./routes/job";
import { env } from "./config/env";
import { logger } from "./shared/logger";
import { getRenderQueueSnapshot } from "./jobs/queue";

const mediaCacheDir = path.resolve("/app/media-cache");

fs.mkdirSync(env.outputDir, {
  recursive: true,
});

fs.mkdirSync(mediaCacheDir, {
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
      ignore: (req) =>
        req.url === "/health" || req.url.startsWith("/media-cache/"),
    },
  }),
);

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  }),
);

app.use(
  "/media-cache",
  express.static(mediaCacheDir, {
    fallthrough: false,
    immutable: true,
    maxAge: "30d",

    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");

      res.setHeader("Accept-Ranges", "bytes");
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    mediaCacheDir,
    renderQueue: getRenderQueueSnapshot(),
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
      mediaCacheDir,
    },
    "Render Engine server started",
  );
});
