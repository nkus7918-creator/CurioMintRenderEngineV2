import {
  Video,
} from "@remotion/media";

import {
  staticFile,
} from "remotion";

import type {
  MediaItem,
} from "../types";

import {
  getMotionValues,
} from "../motion/getMotionValues";

import {
  getTransitionValues,
} from "../transitions/getTransitionValues";

import {
  composeTransform,
} from "../transform/composeTransform";

import {
  useTheme,
} from "../themes/ThemeContext";

import {
  resolveVideoPlayback,
} from "../videoPlayback";

type VideoRendererProps = {
  media: MediaItem;

  fps: number;

  frame: number;

  durationInFrames: number;
};

const isRemoteUrl = (
  url: string,
): boolean =>
  url.startsWith("https://") ||
  url.startsWith("http://");

const resolveVideoSource = (
  url: string,
): string => {
  const normalizedUrl =
    String(url ?? "").trim();

  if (!normalizedUrl) {
    throw new Error(
      "VideoRenderer: media URL is missing.",
    );
  }

  if (
    isRemoteUrl(normalizedUrl)
  ) {
    return normalizedUrl;
  }

  const publicRelativePath =
    normalizedUrl
      .replace(/^\/+/, "")
      .replace(/^public\//, "");

  return staticFile(
    publicRelativePath,
  );
};

export const VideoRenderer = ({
  media,
  fps,
  frame,
  durationInFrames,
}: VideoRendererProps) => {
  const theme = useTheme();

  const safeDuration =
    Math.max(
      1,
      durationInFrames,
    );

  const playback =
    resolveVideoPlayback({
      media,

      fps,

      durationInFrames:
        safeDuration,
    });

  const motionValues =
    getMotionValues({
      frame,

      durationInFrames:
        safeDuration,

      motion:
        media.motion ?? {
          preset:
            theme.motion
              .defaultCameraPreset,

          intensity:
            theme.motion
              .defaultIntensity,
        },

      seed:
        media.id ?? media.url,
    });

  const transitionValues =
    getTransitionValues({
      frame,

      durationInFrames:
        safeDuration,

      fps,

      transition:
        media.transition,
    });

  const resolvedSource =
    resolveVideoSource(
      media.url,
    );

  return (
    <Video
      name={`Video: ${media.id}`}
      src={resolvedSource}
      trimBefore={
        playback
          .trimBeforeInFrames
      }
      trimAfter={
        playback
          .trimAfterInFrames
      }
      durationInFrames={
        safeDuration
      }
      loop={
        playback.shouldLoop
      }
      muted={
        media.muted ?? true
      }
      objectFit="cover"
      onError={(error) => {
        console.error(
          `VideoRenderer failed: ${media.id}`,
          error.message,
        );

        return "fallback";
      }}
      style={{
        width: "100%",

        height: "100%",

        borderRadius:
          theme.media
            .borderRadius,

        opacity:
          transitionValues
            .opacity,

        transform:
          composeTransform({
            translateX:
              motionValues
                .translateX +
              transitionValues
                .translateX,

            translateY:
              motionValues
                .translateY +
              transitionValues
                .translateY,

            scale:
              motionValues.scale *
              transitionValues.scale,

            rotation:
              motionValues
                .rotation,
          }),
      }}
    />
  );
};
