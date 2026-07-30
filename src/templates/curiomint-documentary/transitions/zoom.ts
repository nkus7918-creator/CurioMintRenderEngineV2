import { interpolate } from "remotion";

import type { TransitionConfig } from "./types";

type GetZoomScaleProps = {
  frame: number;
  durationInFrames: number;
  fps: number;
  transition: TransitionConfig;
};

export const getZoomScale = ({
  frame,
  durationInFrames,
  fps,
  transition,
}: GetZoomScaleProps) => {
  if (transition.type !== "zoom") {
    return 1;
  }

  const transitionDuration = Math.max(
    1,
    Math.round(
      (transition.durationInSeconds ?? 0.5) * fps,
    ),
  );

  if (frame < transitionDuration) {
    return interpolate(
      frame,
      [0, transitionDuration],
      [1.08, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  if (frame > durationInFrames - transitionDuration) {
    return interpolate(
      frame,
      [
        durationInFrames - transitionDuration,
        durationInFrames,
      ],
      [1, 1.08],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  return 1;
};