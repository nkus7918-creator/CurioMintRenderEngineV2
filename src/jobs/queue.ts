import { TemplateDefinition } from "../types/template";
import { logger } from "../shared/logger";
import { processRenderJob } from "./worker";

export function enqueueRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
) {
  logger.info(
    {
      event: "job.queued",
      jobId,
      templateId: template.id,
      component: "render-queue",
    },
    "Render job queued",
  );

  setImmediate(() => {
    processRenderJob(jobId, template, props);
  });
}