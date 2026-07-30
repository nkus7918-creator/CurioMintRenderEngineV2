import type { CSSProperties } from "react";

import { getFadeOpacity } from "./fade";
import { getSlideTranslateX } from "./slide";
import { resolveTransition } from "./resolveTransition";
import type { TransitionConfig } from "./types";

type GetTransitionStyleProps = {
  frame: number;
  durationInFrames: number;
  fps: number;
  transition?: TransitionConfig;
};

export const getTransitionStyle = ({
  frame,
  durationInFrames,
  fps,
  transition,
}: GetTransitionStyleProps): CSSProperties => {
  const resolvedTransition = resolveTransition(transition);

  const opacity = getFadeOpacity({
    frame,
    durationInFrames,
    fps,
    transition: resolvedTransition,
  });

  const translateX = getSlideTranslateX({
    frame,
    durationInFrames,
    fps,
    transition: resolvedTransition,
  });

  return {
    opacity,
    transform: `translateX(${translateX}px)`,
  };
};