import fs from "fs";
import path from "path";

import { env } from "../config/env";
import { logger } from "../shared/logger";

import type { JobStatus, RenderJob, RenderPreset } from "../types/job";

const JOB_MANIFEST_VERSION = 1;

const jobs = new Map<string, RenderJob>();

const validJobStatuses: readonly JobStatus[] = [
  "queued",
  "rendering",
  "completed",
  "failed",
  "interrupted",
];

const validRenderPresets: readonly RenderPreset[] = ["preview", "final"];

export type JobStoreStartupSummary = {
  jobDirectory: string;
  restoredCount: number;
  interruptedCount: number;
  invalidManifestCount: number;
};

export type JobStoreSnapshot = {
  jobDirectory: string;
  totalCount: number;
  statusCounts: Record<JobStatus, number>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readRequiredString = (
  record: Record<string, unknown>,
  key: string,
): string => {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid or missing "${key}"`);
  }

  return value;
};

const readOptionalString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid "${key}"`);
  }

  return value;
};

const readRequiredNumber = (
  record: Record<string, unknown>,
  key: string,
): number => {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid or missing "${key}"`);
  }

  return value;
};

const readOptionalNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid "${key}"`);
  }

  return value;
};
const readOptionalBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean | undefined => {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`Invalid "${key}"`);
  }

  return value;
};

const parseDate = (value: unknown, key: string): Date => {
  if (typeof value !== "string") {
    throw new Error(`Invalid or missing "${key}"`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date in "${key}"`);
  }

  return date;
};

const parseOptionalDate = (value: unknown, key: string): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return parseDate(value, key);
};

const ensureJobDirectory = (): void => {
  fs.mkdirSync(env.jobDir, {
    recursive: true,
  });
};

const getJobManifestPath = (jobId: string): string =>
  path.join(env.jobDir, `${jobId}.json`);

const serializeJob = (job: RenderJob): Record<string, unknown> => ({
  version: JOB_MANIFEST_VERSION,

  ...job,

  createdAt: job.createdAt.toISOString(),

  updatedAt: job.updatedAt.toISOString(),

  startedAt: job.startedAt?.toISOString(),

  completedAt: job.completedAt?.toISOString(),
});

const deserializeJob = (value: unknown): RenderJob => {
  if (!isRecord(value)) {
    throw new Error("Job manifest must contain an object");
  }

  if (value.version !== JOB_MANIFEST_VERSION) {
    throw new Error(
      `Unsupported job manifest version: ${String(value.version)}`,
    );
  }

  const statusValue = readRequiredString(value, "status");

  if (!validJobStatuses.includes(statusValue as JobStatus)) {
    throw new Error(`Invalid job status: "${statusValue}"`);
  }

  const renderPresetValue = readRequiredString(value, "renderPreset");

  if (!validRenderPresets.includes(renderPresetValue as RenderPreset)) {
    throw new Error(`Invalid render preset: "${renderPresetValue}"`);
  }

  return {
    id: readRequiredString(value, "id"),

    templateId: readRequiredString(value, "templateId"),

    compositionId:
      readOptionalString(value, "compositionId") ??
      readRequiredString(value, "templateId"),

    renderType:
      readOptionalString(value, "renderType") === "still" ? "still" : "video",

    renderPreset: renderPresetValue as RenderPreset,

    status: statusValue as JobStatus,

    progress: readRequiredNumber(value, "progress"),

    output: readOptionalString(value, "output"),

    outputFileName: readOptionalString(value, "outputFileName"),

    inputHash: readOptionalString(value, "inputHash"),

    finalEligible: readOptionalBoolean(value, "finalEligible") ?? false,

    width: readOptionalNumber(value, "width"),

    height: readOptionalNumber(value, "height"),

    fps: readOptionalNumber(value, "fps"),

    durationInFrames: readOptionalNumber(value, "durationInFrames"),

    durationInSeconds: readOptionalNumber(value, "durationInSeconds"),

    error: readOptionalString(value, "error"),

    createdAt: parseDate(value.createdAt, "createdAt"),

    updatedAt: parseDate(value.updatedAt, "updatedAt"),

    startedAt: parseOptionalDate(value.startedAt, "startedAt"),

    completedAt: parseOptionalDate(value.completedAt, "completedAt"),

    renderTimeMs: readOptionalNumber(value, "renderTimeMs"),
  };
};

const writeJobManifest = (job: RenderJob): boolean => {
  ensureJobDirectory();

  const manifestPath = getJobManifestPath(job.id);

  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;

  try {
    fs.writeFileSync(
      temporaryPath,
      JSON.stringify(serializeJob(job), null, 2),
      "utf8",
    );

    /*
     * Windows üzerinde var olan hedefin
     * üzerine rename işlemi tutarsız
     * davranabildiği için hedef önce
     * kaldırılıyor.
     */
    fs.rmSync(manifestPath, {
      force: true,
    });

    fs.renameSync(temporaryPath, manifestPath);

    return true;
  } catch (error) {
    fs.rmSync(temporaryPath, {
      force: true,
    });

    logger.error(
      {
        event: "job.manifest.write-failed",

        jobId: job.id,

        manifestPath,

        err: error,

        component: "job-store",
      },
      "Job manifest could not be written",
    );

    return false;
  }
};

export function initializeJobStore(): JobStoreStartupSummary {
  ensureJobDirectory();

  jobs.clear();

  let restoredCount = 0;
  let interruptedCount = 0;
  let invalidManifestCount = 0;

  const manifestFiles = fs
    .readdirSync(env.jobDir)
    .filter((fileName) => fileName.endsWith(".json"));

  for (const fileName of manifestFiles) {
    const manifestPath = path.join(env.jobDir, fileName);

    try {
      const rawManifest = fs.readFileSync(manifestPath, "utf8");

      const restoredJob = deserializeJob(JSON.parse(rawManifest));

      let jobToStore = restoredJob;

      if (
        restoredJob.status === "queued" ||
        restoredJob.status === "rendering"
      ) {
        const interruptedAt = new Date();

        jobToStore = {
          ...restoredJob,

          status: "interrupted",

          error: "Render engine restarted before this job completed.",

          updatedAt: interruptedAt,

          completedAt: interruptedAt,
        };

        interruptedCount += 1;
      }

      jobs.set(jobToStore.id, jobToStore);

      if (jobToStore !== restoredJob) {
        writeJobManifest(jobToStore);
      }

      restoredCount += 1;
    } catch (error) {
      invalidManifestCount += 1;

      logger.warn(
        {
          event: "job.manifest.invalid",

          manifestPath,

          err: error,

          component: "job-store",
        },
        "Invalid job manifest ignored",
      );
    }
  }

  const summary = {
    jobDirectory: env.jobDir,
    restoredCount,
    interruptedCount,
    invalidManifestCount,
  };

  logger.info(
    {
      event: "job.store.initialized",

      ...summary,

      component: "job-store",
    },
    "Persistent job store initialized",
  );

  return summary;
}

export function createJob(job: RenderJob): void {
  if (jobs.has(job.id)) {
    throw new Error(`Job "${job.id}" already exists`);
  }

  jobs.set(job.id, job);

  const persisted = writeJobManifest(job);

  if (!persisted) {
    jobs.delete(job.id);

    throw new Error(`Job "${job.id}" could not be persisted`);
  }
}

export function getJob(jobId: string): RenderJob | undefined {
  return jobs.get(jobId);
}

export function updateJob(
  jobId: string,
  updates: Partial<RenderJob>,
): RenderJob | undefined {
  const job = jobs.get(jobId);

  if (!job) {
    logger.warn(
      {
        event: "job.update.not-found",

        jobId,

        component: "job-store",
      },
      "Job update ignored because job was not found",
    );

    return undefined;
  }

  const updatedJob: RenderJob = {
    ...job,

    ...updates,

    updatedAt: updates.updatedAt ?? new Date(),
  };

  jobs.set(jobId, updatedJob);

  writeJobManifest(updatedJob);

  return updatedJob;
}

export function getJobStoreSnapshot(): JobStoreSnapshot {
  const statusCounts: Record<JobStatus, number> = {
    queued: 0,
    rendering: 0,
    completed: 0,
    failed: 0,
    interrupted: 0,
  };

  for (const job of jobs.values()) {
    statusCounts[job.status] += 1;
  }

  return {
    jobDirectory: env.jobDir,
    totalCount: jobs.size,
    statusCounts,
  };
}
