import { env } from "../config/env";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import { TemplateDefinition } from "../types/template";
import { logger } from "../shared/logger";

const entryPoint = path.resolve("./src/remotion/index.ts");
const publicDir = path.resolve("./public");

let bundlePromise: Promise<string> | null = null;

export const invalidateRemotionBundle = () => {
  bundlePromise = null;
};

const getServeUrl = (): Promise<string> => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint,
      publicDir,
    }).catch((error) => {
      bundlePromise = null;
      throw error;
    });
  }

  return bundlePromise;
};

type RenderPreset = "preview" | "final";

const getRenderPreset = (props: Record<string, unknown>): RenderPreset => {
  return props.renderPreset === "preview" ? "preview" : "final";
};

export async function renderVideo(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
  onProgress?: (progress: number) => void,
) {
  const renderLogger = logger.child({
    jobId,
    templateId: template.id,
    component: "remotion",
  });

  try {
    const renderPreset = getRenderPreset(props);

    const bundleStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.bundle.started",
        entryPoint,
      },
      "Remotion bundle requested",
    );

    onProgress?.(10);

    const bundleLocation = await getServeUrl();

    renderLogger.info(
      {
        event: "remotion.bundle.completed",
        durationMs: Date.now() - bundleStartedAt,
        bundleLocation,
      },
      "Remotion bundle ready",
    );

    onProgress?.(25);

    const compositionStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.composition.started",
        compositionId: template.compositionId,
        renderPreset,
      },
      "Remotion composition selection started",
    );

    const timeoutInMilliseconds = 180_000;

    const baseComposition = await selectComposition({
      serveUrl: bundleLocation,
      id: template.compositionId,
      inputProps: props,
      timeoutInMilliseconds,
    });

    const composition =
      renderPreset === "preview"
        ? {
            ...baseComposition,
            width: 1280,
            height: 720,
          }
        : baseComposition;

    renderLogger.info(
      {
        event: "remotion.composition.selected",
        compositionId: composition.id,
        durationMs: Date.now() - compositionStartedAt,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        renderPreset,
      },
      "Remotion composition selected",
    );

    onProgress?.(35);

    const output = path.join(env.outputDir, `${jobId}.mp4`);

    const mediaStartedAt = Date.now();

    const concurrency = renderPreset === "preview" ? 1 : 2;

    const crf = renderPreset === "preview" ? 30 : 22;

    renderLogger.info(
      {
        event: "remotion.render.started",
        output,
        codec: "h264",
        concurrency,
        crf,
        renderPreset,
      },
      "Remotion media render started",
    );

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: output,
      inputProps: props,
      concurrency,
      crf,
      pixelFormat: "yuv420p",
      timeoutInMilliseconds,

      onProgress: ({ progress }) => {
        const percentage = Math.min(99, Math.round(35 + progress * 64));

        onProgress?.(percentage);
      },
    });

    onProgress?.(100);

    renderLogger.info(
      {
        event: "remotion.render.completed",
        durationMs: Date.now() - mediaStartedAt,
        output,
        renderPreset,
      },
      "Remotion media render completed",
    );

    return output;
  } catch (error) {
    renderLogger.error(
      {
        event: "remotion.render.failed",
        err: error,
      },
      "Remotion render failed",
    );

    throw error;
  }
}
