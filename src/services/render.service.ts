import { randomUUID } from "crypto";

import {
  assertRenderQueueCapacity,
  enqueueRenderJob,
} from "../jobs/queue";

import type { RenderRequest } from "../types/render";

import { createJob } from "./job.service";
import { getTemplate } from "./template.service";

export async function createRenderJob(
  data: RenderRequest,
) {
  const template = getTemplate(
    data.templateId,
  );

  if (!template) {
    throw new Error(
      `Template '${data.templateId}' not found`,
    );
  }

  /*
   * Job kaydını oluşturmadan önce kuyruk kapasitesini
   * kontrol ediyoruz. Böylece kuyruk dolu olduğunda
   * RAM'de sahte bir "queued" job kalmıyor.
   */
  assertRenderQueueCapacity();

  const jobId = randomUUID();

  createJob({
    id: jobId,
    status: "queued",
    progress: 0,
    createdAt: new Date(),
  });

  console.log("===== RENDER PROPS =====");
  console.dir(data.props, {
    depth: null,
  });
  console.log("========================");

  enqueueRenderJob(
    jobId,
    template,
    data.props,
  );

  return {
    success: true,
    jobId,
    status: "queued",
    progress: 0,
  };
}