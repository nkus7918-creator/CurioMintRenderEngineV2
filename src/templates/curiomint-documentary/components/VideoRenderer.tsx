import { Video } from "@remotion/media";
import { staticFile } from "remotion";

import type { MediaItem } from "../types";

import { getMotionValues } from "../motion/getMotionValues";
import { getTransitionValues } from "../transitions/getTransitionValues";
import { composeTransform } from "../transform/composeTransform";
import { useTheme } from "../themes/ThemeContext";
import { createColorFilter } from "../helpers/color-grading";

type VideoRendererProps = {
  media: MediaItem;
  fps: number;
  frame: number;
  durationInFrames: number;
};

const isRemoteUrl = (url: string): boolean => {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
};

const resolveVideoSource = (
  url: string,
): string => {
  const normalizedUrl = String(url ?? "").trim();

  if (!normalizedUrl) {
    throw new Error(
      "VideoRenderer: media URL is missing.",
    );
  }

  if (isRemoteUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  /*
   * Cache servisi public/ klasörüne göre:
   *
   * cache/media/example.mp4
   *
   * formatında bir yol gönderiyor.
   */
  const publicRelativePath = normalizedUrl
    .replace(/^\/+/, "")
    .replace(/^public\//, "");

  return staticFile(publicRelativePath);
};

export const VideoRenderer = ({
  media,
  fps,
  frame,
  durationInFrames,
}: VideoRendererProps) => {
  const theme = useTheme();

  const trimBefore = Math.max(
    0,
    Math.round(
      (media.startFromSeconds ?? 0) * fps,
    ),
  );

  const trimAfter =
    media.durationInSeconds !== undefined
      ? trimBefore +
        Math.max(
          1,
          Math.round(
            media.durationInSeconds * fps,
          ),
        )
      : undefined;

  const safeDuration = Math.max(
    1,
    durationInFrames,
  );

  const motionValues = getMotionValues({
    frame,
    durationInFrames: safeDuration,

    motion: media.motion ?? {
      preset:
        theme.motion.defaultCameraPreset,

      intensity:
        theme.motion.defaultIntensity,
    },

    seed: media.id ?? media.url,
  });

  const transitionValues =
    getTransitionValues({
      frame,
      durationInFrames: safeDuration,
      fps,
      transition: media.transition,
    });

  const resolvedSource =
    resolveVideoSource(media.url);

  return (
    <Video
      src={resolvedSource}
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      muted={media.muted ?? true}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",

        borderRadius:
          theme.media.borderRadius,

        filter: createColorFilter(
          theme.colorGrading,
        ),

        opacity:
          transitionValues.opacity,

        transform: composeTransform({
          translateX:
            motionValues.translateX +
            transitionValues.translateX,

          translateY:
            motionValues.translateY +
            transitionValues.translateY,

          scale:
            motionValues.scale *
            transitionValues.scale,

          rotation:
            motionValues.rotation,
        }),
      }}
    />
  );
};