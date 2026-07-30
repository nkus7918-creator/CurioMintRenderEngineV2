import { interpolate } from "remotion";

import type { TransitionConfig } from "./types";

type GetSlideTranslateXProps = {
  frame: number;
  durationInFrames: number;
  fps: number;
  transition: TransitionConfig;
};

export const getSlideTranslateX = ({
  frame,
  durationInFrames,
  fps,
  transition,
}: GetSlideTranslateXProps) => {
  if (
    transition.type !== "slideLeft" &&
    transition.type !== "slideRight"
  ) {
    return 0;
  }

  const transitionDuration = Math.max(
    1,
    Math.round(
      (transition.durationInSeconds ?? 0.5) * fps,
    ),
  );

  const direction =
    transition.type === "slideLeft" ? 1 : -1;

  if (frame < transitionDuration) {
    return interpolate(
      frame,
      [0, transitionDuration],
      [120 * direction, 0],
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
      [0, -120 * direction],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  return 0;
};