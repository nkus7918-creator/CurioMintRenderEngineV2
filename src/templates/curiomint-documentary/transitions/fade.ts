import { interpolate } from "remotion";

import type { TransitionConfig } from "./types";

type GetFadeOpacityProps = {
  frame: number;
  durationInFrames: number;
  fps: number;
  transition?: TransitionConfig;
};

export const getFadeOpacity = ({
  frame,
  durationInFrames,
  fps,
  transition,
}: GetFadeOpacityProps) => {
  if (transition?.type !== "fade") {
    return 1;
  }

  const fadeDuration = Math.max(
    1,
    Math.round(
      (transition.durationInSeconds ?? 0.5) * fps,
    ),
  );

  if (frame < fadeDuration) {
    return interpolate(
      frame,
      [0, fadeDuration],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  if (frame > durationInFrames - fadeDuration) {
    return interpolate(
      frame,
      [
        durationInFrames - fadeDuration,
        durationInFrames,
      ],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  return 1;
};