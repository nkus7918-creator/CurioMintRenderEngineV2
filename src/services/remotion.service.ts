import path from "path";

import { bundle } from "@remotion/bundler";

import {
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";

import { env } from "../config/env";
import { logger } from "../shared/logger";

import type { RenderPreset } from "../types/job";

import type { RenderType, TemplateDefinition } from "../types/template";

const documentaryEntryPoint = path.resolve(
  "./src/remotion/documentary-index.ts",
);

const shortsEntryPoint = path.resolve("./src/remotion/index.ts");

const thumbnailEntryPoint = path.resolve("./src/remotion/thumbnail-index.ts");

const publicDir = path.resolve("./public");

const bundlePromises = new Map<string, Promise<string>>();

export type RenderArtifactResult = {
  output: string;

  outputFileName: string;

  templateId: string;

  compositionId: string;

  renderType: RenderType;

  renderPreset: RenderPreset;

  finalEligible: boolean;

  width: number;

  height: number;

  fps: number;

  durationInFrames: number;

  durationInSeconds: number;
};

export const invalidateRemotionBundle = (): void => {
  bundlePromises.clear();
};

const getEntryPoint = (template: TemplateDefinition): string => {
  if (template.renderType === "still") {
    return thumbnailEntryPoint;
  }

  if (template.id === "curiomint-documentary") {
    return documentaryEntryPoint;
  }

  return shortsEntryPoint;
};

const getServeUrl = (template: TemplateDefinition): Promise<string> => {
  const entryPoint = getEntryPoint(template);

  const cachedPromise = bundlePromises.get(entryPoint);

  if (cachedPromise) {
    return cachedPromise;
  }

  const newBundlePromise = bundle({
    entryPoint,
    publicDir,
  }).catch((error) => {
    bundlePromises.delete(entryPoint);

    throw error;
  });

  bundlePromises.set(entryPoint, newBundlePromise);

  return newBundlePromise;
};

const getRenderPreset = (props: Record<string, unknown>): RenderPreset =>
  props.renderPreset === "preview" ? "preview" : "final";

const createArtifactResult = ({
  output,
  outputFileName,
  template,
  renderPreset,
  width,
  height,
  fps,
  durationInFrames,
}: {
  output: string;
  outputFileName: string;
  template: TemplateDefinition;
  renderPreset: RenderPreset;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}): RenderArtifactResult => {
  /*
   * YouTube video yüklemeye yalnızca:
   *
   * - video render
   * - final preset
   * - template'in doğal final çözünürlüğü
   *
   * uygunsa izin verilir.
   */
  const finalEligible =
    template.renderType === "video" &&
    renderPreset === "final" &&
    width === template.width &&
    height === template.height;

  return {
    output,

    outputFileName,

    templateId: template.id,

    compositionId: template.compositionId,

    renderType: template.renderType,

    renderPreset,

    finalEligible,

    width,

    height,

    fps,

    durationInFrames,

    durationInSeconds: durationInFrames / fps,
  };
};

export async function renderVideo(
  jobId: string,
  template: TemplateDefinition,
  props: Record<string, unknown>,
  onProgress?: (progress: number) => void,
): Promise<RenderArtifactResult> {
  const renderLogger = logger.child({
    jobId,
    templateId: template.id,
    compositionId: template.compositionId,
    renderType: template.renderType,
    component: "remotion",
  });

  try {
    const renderPreset = getRenderPreset(props);

    const selectedEntryPoint = getEntryPoint(template);

    const bundleStartedAt = Date.now();

    renderLogger.info(
      {
        event: "remotion.bundle.started",

        entryPoint: selectedEntryPoint,

        renderType: template.renderType,
      },
      "Remotion bundle requested",
    );

    onProgress?.(10);

    const bundleLocation = await getServeUrl(template);

    renderLogger.info(
      {
        event: "remotion.bundle.completed",

        durationMs: Date.now() - bundleStartedAt,

        bundleLocation,

        entryPoint: selectedEntryPoint,

        renderType: template.renderType,
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

        renderType: template.renderType,
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
      template.renderType === "video" && renderPreset === "preview"
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

        renderType: template.renderType,
      },
      "Remotion composition selected",
    );

    onProgress?.(35);

    const outputExtension = template.renderType === "still" ? "png" : "mp4";

    const outputFileName = `${jobId}-${renderPreset}.${outputExtension}`;

    const output = path.join(env.outputDir, outputFileName);

    const renderStartedAt = Date.now();

    if (template.renderType === "still") {
      renderLogger.info(
        {
          event: "remotion.still.started",

          output,

          outputFileName,

          imageFormat: "png",

          renderPreset,
        },
        "Remotion still render started",
      );

      await renderStill({
        composition,

        serveUrl: bundleLocation,

        output,

        inputProps: props,

        imageFormat: "png",

        timeoutInMilliseconds,
      });

      onProgress?.(100);

      const artifact = createArtifactResult({
        output,

        outputFileName,

        template,

        renderPreset,

        width: composition.width,

        height: composition.height,

        fps: composition.fps,

        durationInFrames: composition.durationInFrames,
      });

      renderLogger.info(
        {
          event: "remotion.still.completed",

          durationMs: Date.now() - renderStartedAt,

          ...artifact,
        },
        "Remotion still render completed",
      );

      return artifact;
    }

    const concurrency =
      renderPreset === "preview"
        ? env.renderConcurrencyPreview
        : env.renderConcurrencyFinal;

    const crf = renderPreset === "preview" ? 30 : 22;

    renderLogger.info(
      {
        event: "remotion.media.started",

        output,

        outputFileName,

        codec: "h264",

        concurrency,

        crf,

        renderPreset,
      },
      "Remotion media render started",
    );

    renderLogger.info(
      {
        event: "render.input.summary",

        chapters: Array.isArray(props.chapters) ? props.chapters.length : 0,

        durationInSeconds: composition.durationInFrames / composition.fps,
      },
      "Render summary",
    );

    await renderMedia({
      composition,

      serveUrl: bundleLocation,

      codec: "h264",

      outputLocation: output,

      inputProps: props,

      concurrency,

      crf,

      x264Preset: "veryfast",

      pixelFormat: "yuv420p",

      timeoutInMilliseconds,

      mediaCacheSizeInBytes: 512 * 1024 * 1024,

      offthreadVideoCacheSizeInBytes: 128 * 1024 * 1024,

      chromiumOptions: {
        gl: "angle",
      },

      onProgress: ({ progress }) => {
        const percentage = Math.min(99, Math.round(35 + progress * 64));

        onProgress?.(percentage);
      },
    });

    onProgress?.(100);

    const artifact = createArtifactResult({
      output,

      outputFileName,

      template,

      renderPreset,

      width: composition.width,

      height: composition.height,

      fps: composition.fps,

      durationInFrames: composition.durationInFrames,
    });

    renderLogger.info(
      {
        event: "remotion.media.completed",

        durationMs: Date.now() - renderStartedAt,

        ...artifact,
      },
      "Remotion media render completed",
    );

    return artifact;
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
