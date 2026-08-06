import { env } from "../config/env";
import { logger } from "../shared/logger";
import type { TemplateDefinition } from "../types/template";

import { processRenderJob } from "./worker";

type RenderQueueItem = {
  jobId: string;
  template: TemplateDefinition;
  props: Record<string, unknown>;
};

export type RenderQueueSnapshot = {
  activeJobId: string | null;
  pendingJobIds: string[];
  pendingCount: number;
  maxPendingJobs: number;
  isAtCapacity: boolean;
};

const pendingJobs: RenderQueueItem[] = [];

let activeJobId: string | null = null;
let queueDrainScheduled = false;

export class RenderQueueFullError extends Error {
  constructor(maxPendingJobs: number) {
    super(
      `Render queue is full. Maximum pending job count is ${maxPendingJobs}.`,
    );

    this.name = "RenderQueueFullError";
  }
}

export class RenderJobAlreadyQueuedError extends Error {
  constructor(jobId: string) {
    super(
      `Render job "${jobId}" is already active or queued.`,
    );

    this.name = "RenderJobAlreadyQueuedError";
  }
}

export function getRenderQueueSnapshot(): RenderQueueSnapshot {
  return {
    activeJobId,
    pendingJobIds: pendingJobs.map(
      (job) => job.jobId,
    ),
    pendingCount: pendingJobs.length,
    maxPendingJobs: env.maxRenderQueueSize,
    isAtCapacity:
      pendingJobs.length >=
      env.maxRenderQueueSize,
  };
}

export function assertRenderQueueCapacity(): void {
  if (
    pendingJobs.length >=
    env.maxRenderQueueSize
  ) {
    throw new RenderQueueFullError(
      env.maxRenderQueueSize,
    );
  }
}

function scheduleQueueDrain(): void {
  if (
    queueDrainScheduled ||
    activeJobId !== null ||
    pendingJobs.length === 0
  ) {
    return;
  }

  queueDrainScheduled = true;

  setImmediate(() => {
    queueDrainScheduled = false;

    void processNextJob();
  });
}

async function processNextJob(): Promise<void> {
  if (activeJobId !== null) {
    return;
  }

  const nextJob = pendingJobs.shift();

  if (!nextJob) {
    return;
  }

  activeJobId = nextJob.jobId;

  logger.info(
    {
      event: "job.dequeued",
      jobId: nextJob.jobId,
      templateId: nextJob.template.id,
      pendingCount: pendingJobs.length,
      component: "render-queue",
    },
    "Render job removed from queue and started",
  );

  try {
    await processRenderJob(
      nextJob.jobId,
      nextJob.template,
      nextJob.props,
    );
  } catch (error) {
    /*
     * processRenderJob normal render hatalarını kendi
     * içinde yakalar. Bu catch yalnızca beklenmeyen bir
     * worker hatasında kuyruğun kilitlenmesini önler.
     */
    logger.error(
      {
        event: "job.worker.unhandled-error",
        jobId: nextJob.jobId,
        err: error,
        component: "render-queue",
      },
      "Unexpected render worker error",
    );
  } finally {
    const finishedJobId = activeJobId;

    activeJobId = null;

    logger.info(
      {
        event: "job.slot.released",
        jobId: finishedJobId,
        pendingCount: pendingJobs.length,
        component: "render-queue",
      },
      "Render queue slot released",
    );

    scheduleQueueDrain();
  }
}

export function enqueueRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
): void {
  const alreadyQueued =
    activeJobId === jobId ||
    pendingJobs.some(
      (job) => job.jobId === jobId,
    );

  if (alreadyQueued) {
    throw new RenderJobAlreadyQueuedError(
      jobId,
    );
  }

  assertRenderQueueCapacity();

  pendingJobs.push({
    jobId,
    template,
    props,
  });

  logger.info(
    {
      event: "job.queued",
      jobId,
      templateId: template.id,
      activeJobId,
      pendingCount: pendingJobs.length,
      maxPendingJobs:
        env.maxRenderQueueSize,
      component: "render-queue",
    },
    "Render job queued",
  );

  scheduleQueueDrain();
}