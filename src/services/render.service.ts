import { randomUUID } from "crypto";
import { RenderRequest } from "../types/render";
import { createJob } from "./job.service";
import { enqueueRenderJob } from "../jobs/queue";
import { getTemplate } from "./template.service";

export async function createRenderJob(data: RenderRequest) {
  const template = getTemplate(data.templateId);

  if (!template) {
    throw new Error(`Template '${data.templateId}' not found`);
  }

  const jobId = randomUUID();

  createJob({
    id: jobId,
    status: "queued",
    progress: 0,
    createdAt: new Date(),
  });

  enqueueRenderJob(jobId, template, data.props);

  return {
    success: true,
    jobId,
    status: "queued",
    progress: 0,
  };
}