import {
  cacheRemoteMedia,
} from "../services/media-cache.service";

import {
  updateJob,
} from "../services/job.service";

import {
  renderVideo,
} from "../services/remotion.service";

import { logger } from "../shared/logger";

import type {
  TemplateDefinition,
} from "../types/template";

export async function processRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
) {
  const startedAtDate =
    new Date();

  const startedAt =
    startedAtDate.getTime();

  const jobLogger =
    logger.child({
      jobId,
      templateId:
        template.id,
      component:
        "render-worker",
    });

  let lastLoggedProgress = 0;

  try {
    jobLogger.info(
      {
        event: "job.started",
      },
      "Render job started",
    );

    updateJob(jobId, {
      status: "rendering",
      progress: 1,
      startedAt:
        startedAtDate,
      finalEligible: false,
    });

    updateJob(jobId, {
      status: "rendering",
      progress: 3,
    });

    const cacheResult =
      await cacheRemoteMedia(
        props,
        jobId,
      );

    jobLogger.info(
      {
        event:
          "job.media-cache.ready",

        downloadedCount:
          cacheResult.downloadedCount,

        cacheHitCount:
          cacheResult.cacheHitCount,

        failedCount:
          cacheResult.failedCount,
      },
      "Render media cache prepared",
    );

    updateJob(jobId, {
      status: "rendering",
      progress: 8,
    });

    const artifact =
      await renderVideo(
        jobId,
        template,
        cacheResult.props,
        (progress) => {
          updateJob(jobId, {
            status: "rendering",
            progress,
          });

          const progressBucket =
            Math.floor(
              progress / 10,
            ) * 10;

          if (
            progressBucket >= 10 &&
            progressBucket < 100 &&
            progressBucket >
              lastLoggedProgress
          ) {
            lastLoggedProgress =
              progressBucket;

            jobLogger.info(
              {
                event:
                  "job.progress",

                progress:
                  progressBucket,
              },
              "Render job progress",
            );
          }
        },
      );

    updateJob(jobId, {
      status: "completed",

      progress: 100,

      output:
        artifact.output,

      outputFileName:
        artifact.outputFileName,

      compositionId:
        artifact.compositionId,

      renderType:
        artifact.renderType,

      renderPreset:
        artifact.renderPreset,

      finalEligible:
        artifact.finalEligible,

      width:
        artifact.width,

      height:
        artifact.height,

      fps:
        artifact.fps,

      durationInFrames:
        artifact.durationInFrames,

      durationInSeconds:
        artifact.durationInSeconds,

      completedAt:
        new Date(),

      renderTimeMs:
        Date.now() -
        startedAt,
    });

    jobLogger.info(
      {
        event:
          "job.completed",

        progress: 100,

        durationMs:
          Date.now() -
          startedAt,

        output:
          artifact.output,

        outputFileName:
          artifact.outputFileName,

        renderPreset:
          artifact.renderPreset,

        finalEligible:
          artifact.finalEligible,

        width:
          artifact.width,

        height:
          artifact.height,
      },
      "Render job completed",
    );
  } catch (error) {
    updateJob(jobId, {
      status: "failed",

      progress: 100,

      finalEligible: false,

      error:
        error instanceof Error
          ? error.message
          : "Unknown error",

      completedAt:
        new Date(),

      renderTimeMs:
        Date.now() -
        startedAt,
    });

    jobLogger.error(
      {
        event: "job.failed",

        durationMs:
          Date.now() -
          startedAt,

        err: error,
      },
      "Render job failed",
    );
  }
}