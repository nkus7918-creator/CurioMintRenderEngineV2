import { env } from "../config/env";
import path from "path";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";

import { TemplateDefinition } from "../types/template";
import { logger } from "../shared/logger";

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

  const entryPoint = path.resolve("./src/remotion/index.ts");

  try {
    const bundleStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.bundle.started",
        entryPoint,
      },
      "Remotion bundle started",
    );

    onProgress?.(10);

    const bundleLocation = await bundle({
      entryPoint,
    });

    renderLogger.info(
      {
        event: "remotion.bundle.completed",
        durationMs: Date.now() - bundleStartedAt,
        bundleLocation,
      },
      "Remotion bundle completed",
    );

    onProgress?.(25);

    const compositionStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.composition.started",
        compositionId: template.compositionId,
      },
      "Remotion composition selection started",
    );

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: template.compositionId,
      inputProps: props,
    });

    renderLogger.info(
      {
        event: "remotion.composition.selected",
        compositionId: composition.id,
        durationMs: Date.now() - compositionStartedAt,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
      },
      "Remotion composition selected",
    );

    onProgress?.(35);

    const output = path.join(env.outputDir, `${jobId}.mp4`);
    const mediaStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.render.started",
        output,
        codec: "h264",
      },
      "Remotion media render started",
    );

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: output,
      inputProps: props,
      concurrency: 1,

      onProgress: ({ progress }) => {
        // Remotion 0–1 verir.
        // Biz render aşamasını %35–99 arasına yayıyoruz.
        const percentage = Math.min(
          99,
          Math.round(35 + progress * 64),
        );

        onProgress?.(percentage);
      },
    });

    onProgress?.(100);

    renderLogger.info(
      {
        event: "remotion.render.completed",
        durationMs: Date.now() - mediaStartedAt,
        output,
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