import { TemplateDefinition } from "../types/template";
import { processRenderJob } from "./worker";

export function enqueueRenderJob(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>
) {
  setImmediate(() => {
    processRenderJob(jobId, template, props);
  });
}