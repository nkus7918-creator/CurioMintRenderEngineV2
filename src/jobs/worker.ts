import { TemplateDefinition } from "../types/template";
import { renderVideo } from "../services/remotion.service";
import { updateJob } from "../services/job.service";
import { logger } from "../shared/logger";

export async function processRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
) {
  const startedAt = Date.now();

  const jobLogger = logger.child({
    jobId,
    templateId: template.id,
    component: "render-worker",
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
    });

    const output = await renderVideo(
      jobId,
      template,
      props,
      (progress) => {
        updateJob(jobId, {
          status: "rendering",
          progress,
        });

        const progressBucket = Math.floor(progress / 10) * 10;

        if (
          progressBucket >= 10 &&
          progressBucket < 100 &&
          progressBucket > lastLoggedProgress
        ) {
          lastLoggedProgress = progressBucket;

          jobLogger.info(
            {
              event: "job.progress",
              progress: progressBucket,
            },
            "Render job progress",
          );
        }
      },
    );

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      output,
    });

    jobLogger.info(
      {
        event: "job.completed",
        progress: 100,
        durationMs: Date.now() - startedAt,
        output,
      },
      "Render job completed",
    );
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    jobLogger.error(
      {
        event: "job.failed",
        durationMs: Date.now() - startedAt,
        err: error,
      },
      "Render job failed",
    );
  }
}