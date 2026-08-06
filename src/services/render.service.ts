import { createHash, randomUUID } from "crypto";

import { assertRenderQueueCapacity, enqueueRenderJob } from "../jobs/queue";

import type { RenderPreset } from "../types/job";

import type { RenderRequest } from "../types/render";

import { createJob } from "./job.service";
import { getTemplate } from "./template.service";

const resolveRenderPreset = (props: Record<string, unknown>): RenderPreset =>
  props.renderPreset === "preview" ? "preview" : "final";

const createInputHash = (
  schemaVersion: string,
  templateId: string,
  props: Record<string, unknown>,
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        schemaVersion,
        templateId,
        props,
      }),
    )
    .digest("hex");

export async function createRenderJob(data: RenderRequest) {
  const template = getTemplate(data.templateId);

  if (!template) {
    throw new Error(`Template '${data.templateId}' not found`);
  }

  assertRenderQueueCapacity();

  const jobId = randomUUID();

  const createdAt = new Date();

  const rawProps = data.props as unknown as Record<string, unknown>;

  const renderPreset = resolveRenderPreset(rawProps);

  /*
   * Render preset tek yerde normalize edilir.
   * Job metadata ve gerÃ§ek Remotion render'Ä±
   * aynÄ± deÄŸeri kullanÄ±r.
   */
  const normalizedProps: Record<string, unknown> = {
    ...rawProps,
    renderPreset,
  };

  const inputHash = createInputHash(
    data.schemaVersion,
    template.id,
    normalizedProps,
  );

  createJob({
    id: jobId,

    templateId: template.id,

    schemaVersion: data.schemaVersion,

    compositionId: template.compositionId,

    renderType: template.renderType,

    renderPreset,

    status: "queued",

    progress: 0,

    inputHash,

    /*
     * Render tamamlanana kadar hiÃ§bir
     * artifact final kabul edilmez.
     */
    finalEligible: false,

    createdAt,

    updatedAt: createdAt,
  });

  console.log("===== RENDER PROPS =====");

  console.dir(normalizedProps, {
    depth: null,
  });

  console.log("========================");

  enqueueRenderJob(jobId, template, normalizedProps);

  return {
    success: true,
    jobId,
    schemaVersion: data.schemaVersion,
    status: "queued",
    progress: 0,
    renderPreset,
    finalEligible: false,
  };
}
