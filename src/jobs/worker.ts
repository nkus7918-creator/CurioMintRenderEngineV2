import { TemplateDefinition } from "../types/template";
import { renderVideo } from "../services/remotion.service";
import { updateJob } from "../services/job.service";

export async function processRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>
) {
  try {
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
      }
    );

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      output,
    });
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      error: error instanceof Error
        ? error.message
        : "Unknown error",
    });
  }
}