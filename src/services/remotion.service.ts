import { env } from "../config/env";
import path from "path";
import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

import type { TemplateDefinition } from "../types/template";
import { logger } from "../shared/logger";

const documentaryEntryPoint = path.resolve(
  "./src/remotion/documentary-index.ts",
);

const shortsEntryPoint = path.resolve(
  "./src/remotion/index.ts",
);

const thumbnailEntryPoint = path.resolve(
  "./src/remotion/thumbnail-index.ts",
);

const publicDir = path.resolve("./public");

/*
 * Documentary, Shorts ve Thumbnail birbirinden
 * farklı Remotion entry point kullanıyor.
 *
 * Her entry point kendi bundle cache'ine sahip olmalı.
 * Aksi halde Documentary render, daha önce hazırlanmış
 * Shorts bundle'ını yanlışlıkla kullanabilir.
 */
const bundlePromises = new Map<
  string,
  Promise<string>
>();

export const invalidateRemotionBundle = () => {
  bundlePromises.clear();
};

const getEntryPoint = (
  template: TemplateDefinition,
): string => {
  if (template.renderType === "still") {
    return thumbnailEntryPoint;
  }

  if (
    template.id ===
    "curiomint-documentary"
  ) {
    return documentaryEntryPoint;
  }

  return shortsEntryPoint;
};

const getServeUrl = (
  template: TemplateDefinition,
): Promise<string> => {
  const entryPoint =
    getEntryPoint(template);

  const cachedPromise =
    bundlePromises.get(entryPoint);

  if (cachedPromise) {
    return cachedPromise;
  }

  const newBundlePromise = bundle({
    entryPoint,
    publicDir,
  }).catch((error) => {
    /*
     * Bundle başarısız olursa bozuk promise
     * cache içinde bırakılmamalı.
     */
    bundlePromises.delete(
      entryPoint,
    );

    throw error;
  });

  bundlePromises.set(
    entryPoint,
    newBundlePromise,
  );

  return newBundlePromise;
};

type RenderPreset =
  | "preview"
  | "final";

const getRenderPreset = (
  props: Record<string, unknown>,
): RenderPreset => {
  return props.renderPreset === "preview"
    ? "preview"
    : "final";
};

export async function renderVideo(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
  onProgress?: (
    progress: number,
  ) => void,
) {
  const renderLogger =
    logger.child({
      jobId,
      templateId: template.id,
      compositionId:
        template.compositionId,
      renderType:
        template.renderType,
      component: "remotion",
    });

  try {
    const renderPreset =
      getRenderPreset(props);

    const selectedEntryPoint =
      getEntryPoint(template);

    const bundleStartedAt =
      Date.now();

    renderLogger.info(
      {
        event:
          "remotion.bundle.started",

        entryPoint:
          selectedEntryPoint,

        renderType:
          template.renderType,
      },
      "Remotion bundle requested",
    );

    onProgress?.(10);

    const bundleLocation =
      await getServeUrl(template);

    renderLogger.info(
      {
        event:
          "remotion.bundle.completed",

        durationMs:
          Date.now() -
          bundleStartedAt,

        bundleLocation,

        entryPoint:
          selectedEntryPoint,

        renderType:
          template.renderType,
      },
      "Remotion bundle ready",
    );

    onProgress?.(25);

    const compositionStartedAt =
      Date.now();

    renderLogger.info(
      {
        event:
          "remotion.composition.started",

        compositionId:
          template.compositionId,

        renderPreset,

        renderType:
          template.renderType,
      },
      "Remotion composition selection started",
    );

    const timeoutInMilliseconds =
      180_000;

    const baseComposition =
      await selectComposition({
        serveUrl:
          bundleLocation,

        id:
          template.compositionId,

        inputProps:
          props,

        timeoutInMilliseconds,
      });

    /*
     * Preview çözünürlük düşürme yalnızca
     * video template'lerinde uygulanır.
     *
     * Thumbnail her zaman kendi composition
     * ölçüsü olan 1280x720 ile render edilir.
     */
    const composition =
      template.renderType ===
        "video" &&
      renderPreset ===
        "preview"
        ? {
            ...baseComposition,
            width: 1280,
            height: 720,
          }
        : baseComposition;

    renderLogger.info(
      {
        event:
          "remotion.composition.selected",

        compositionId:
          composition.id,

        durationMs:
          Date.now() -
          compositionStartedAt,

        width:
          composition.width,

        height:
          composition.height,

        fps:
          composition.fps,

        durationInFrames:
          composition.durationInFrames,

        renderPreset,

        renderType:
          template.renderType,
      },
      "Remotion composition selected",
    );

    onProgress?.(35);

    const outputExtension =
      template.renderType ===
      "still"
        ? "png"
        : "mp4";

    const output = path.join(
      env.outputDir,
      `${jobId}.${outputExtension}`,
    );

    const renderStartedAt =
      Date.now();

    /*
     * STILL / THUMBNAIL RENDER
     */
    if (
      template.renderType ===
      "still"
    ) {
      renderLogger.info(
        {
          event:
            "remotion.still.started",

          output,

          imageFormat:
            "png",
        },
        "Remotion still render started",
      );

      await renderStill({
        composition,

        serveUrl:
          bundleLocation,

        output,

        inputProps:
          props,

        imageFormat:
          "png",

        timeoutInMilliseconds,
      });

      onProgress?.(100);

      renderLogger.info(
        {
          event:
            "remotion.still.completed",

          durationMs:
            Date.now() -
            renderStartedAt,

          output,
        },
        "Remotion still render completed",
      );

      return output;
    }

    /*
     * VIDEO RENDER
     */
    const concurrency =
      renderPreset === "preview"
        ? 1
        : 2;

    const crf =
      renderPreset === "preview"
        ? 30
        : 22;

    renderLogger.info(
      {
        event:
          "remotion.media.started",

        output,

        codec:
          "h264",

        concurrency,

        crf,

        renderPreset,
      },
      "Remotion media render started",
    );

    await renderMedia({
      composition,

      serveUrl:
        bundleLocation,

      codec:
        "h264",

      outputLocation:
        output,

      inputProps:
        props,

      concurrency,

      crf,

      pixelFormat:
        "yuv420p",

      timeoutInMilliseconds,

      onProgress: ({
        progress,
      }) => {
        const percentage =
          Math.min(
            99,
            Math.round(
              35 +
                progress *
                  64,
            ),
          );

        onProgress?.(
          percentage,
        );
      },
    });

    onProgress?.(100);

    renderLogger.info(
      {
        event:
          "remotion.media.completed",

        durationMs:
          Date.now() -
          renderStartedAt,

        output,

        renderPreset,
      },
      "Remotion media render completed",
    );

    return output;
  } catch (error) {
    renderLogger.error(
      {
        event:
          "remotion.render.failed",

        err:
          error,
      },
      "Remotion render failed",
    );

    throw error;
  }
}