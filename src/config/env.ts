import "dotenv/config";
import path from "path";

type NodeEnvironment = "development" | "test" | "production";

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? "3001");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT value: "${value}". PORT must be an integer between 1 and 65535.`,
    );
  }

  return port;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  variableName: string,
): number => {
  const parsedValue = Number(value ?? String(fallback));

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(
      `Invalid ${variableName} value: "${value}". ${variableName} must be a positive integer.`,
    );
  }

  return parsedValue;
};

const parseNodeEnvironment = (value: string | undefined): NodeEnvironment => {
  const environment = value ?? "development";

  if (
    environment !== "development" &&
    environment !== "test" &&
    environment !== "production"
  ) {
    throw new Error(
      `Invalid NODE_ENV value: "${environment}". Expected development, test or production.`,
    );
  }

  return environment;
};

const outputDirectoryName = process.env.OUTPUT_DIR?.trim() || "outputs";

const outputDir = path.resolve(process.cwd(), outputDirectoryName);

const configuredJobDirectory = process.env.JOB_DIR?.trim();

const jobDir = configuredJobDirectory
  ? path.resolve(process.cwd(), configuredJobDirectory)
  : path.join(outputDir, "jobs");

export const env = Object.freeze({
  nodeEnv: parseNodeEnvironment(process.env.NODE_ENV),

  port: parsePort(process.env.PORT),

  outputDir,

  jobDir,

  maxRenderQueueSize: parsePositiveInteger(
    process.env.MAX_RENDER_QUEUE_SIZE,
    10,
    "MAX_RENDER_QUEUE_SIZE",
  ),

  renderConcurrencyPreview: parsePositiveInteger(
    process.env.RENDER_CONCURRENCY_PREVIEW,
    2,
    "RENDER_CONCURRENCY_PREVIEW",
  ),

  renderConcurrencyFinal: parsePositiveInteger(
    process.env.RENDER_CONCURRENCY_FINAL,
    1,
    "RENDER_CONCURRENCY_FINAL",
  ),

  isDevelopment: process.env.NODE_ENV !== "production",

  isProduction: process.env.NODE_ENV === "production",

  isTest: process.env.NODE_ENV === "test",
});
