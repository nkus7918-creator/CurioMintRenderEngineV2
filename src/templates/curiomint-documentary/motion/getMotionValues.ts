import { interpolate } from "remotion";

import { resolveCameraMotion } from "./resolveCameraMotion";
import type { CameraMotionConfig } from "./types";

type GetMotionValuesProps = {
  frame: number;
  durationInFrames: number;
  motion?: CameraMotionConfig;
};

export const getMotionValues = ({
  frame,
  durationInFrames,
  motion,
}: GetMotionValuesProps) => {
  const safeDuration = Math.max(1, durationInFrames);
  const endFrame = Math.max(1, safeDuration - 1);

  const camera = resolveCameraMotion(motion);

  return {
    scale: interpolate(
      frame,
      [0, endFrame],
      [camera.startScale, camera.endScale],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),

    translateX: interpolate(
      frame,
      [0, endFrame],
      [camera.startX, camera.endX],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),

    translateY: interpolate(
      frame,
      [0, endFrame],
      [camera.startY, camera.endY],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  };
};