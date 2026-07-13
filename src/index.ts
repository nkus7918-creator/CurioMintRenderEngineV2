import express from "express";
import cors from "cors";
import fs from "fs";

import renderRouter from "./routes/render";
import jobRouter from "./routes/job";
import { env } from "./config/env";

fs.mkdirSync(env.outputDir, {
  recursive: true,
});

const app = express();

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
  console.log(`🚀 Server running on http://localhost:${env.port}`);
  console.log(`🌍 Environment: ${env.nodeEnv}`);
  console.log(`📁 Output directory: ${env.outputDir}`);
});