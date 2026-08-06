import "dotenv/config";
import path from "path";

type NodeEnvironment =
  | "development"
  | "test"
  | "production";

const parsePort = (
  value: string | undefined,
): number => {
  const port = Number(value ?? "3001");

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
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
  const parsedValue = Number(
    value ?? String(fallback),
  );

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    throw new Error(
      `Invalid ${variableName} value: "${value}". ${variableName} must be a positive integer.`,
    );
  }

  return parsedValue;
};

const parseNodeEnvironment = (
  value: string | undefined,
): NodeEnvironment => {
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

const outputDirectoryName =
  process.env.OUTPUT_DIR?.trim() || "outputs";

export const env = Object.freeze({
  nodeEnv: parseNodeEnvironment(
    process.env.NODE_ENV,
  ),

  port: parsePort(process.env.PORT),

  outputDir: path.resolve(
    process.cwd(),
    outputDirectoryName,
  ),

  maxRenderQueueSize: parsePositiveInteger(
    process.env.MAX_RENDER_QUEUE_SIZE,
    10,
    "MAX_RENDER_QUEUE_SIZE",
  ),

  isDevelopment:
    process.env.NODE_ENV !== "production",

  isProduction:
    process.env.NODE_ENV === "production",

  isTest:
    process.env.NODE_ENV === "test",
});