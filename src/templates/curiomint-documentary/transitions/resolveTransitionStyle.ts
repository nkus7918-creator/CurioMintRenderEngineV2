import type { CSSProperties } from "react";

import { getFadeOpacity } from "./fade";
import type { TransitionConfig } from "./types";

type ResolveTransitionStyleProps = {
  frame: number;
  durationInFrames: number;
  fps: number;
  transition?: TransitionConfig;
};

export const resolveTransitionStyle = ({
  frame,
  durationInFrames,
  fps,
  transition,
}: ResolveTransitionStyleProps): CSSProperties => {
  const opacity = getFadeOpacity({
    frame,
    durationInFrames,
    fps,
    transition,
  });

  return {
    opacity,
  };
};