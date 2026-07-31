import { interpolate } from "remotion";

import type { MediaTimelineItem } from "./mediaTimeline";
import type {
  TransitionType,
} from "./transitions/types";

export type ResolvedMediaTransition = {
  type: TransitionType;
  durationInFrames: number;
};

type ResolveMediaTransitionInput = {
  currentItem: MediaTimelineItem;
  fps: number;
  defaultDurationInSeconds?: number;
};

export const resolveMediaTransition = ({
  currentItem,
  fps,
  defaultDurationInSeconds = 0.4,
}: ResolveMediaTransitionInput): ResolvedMediaTransition => {
  const transition = currentItem.media.transition;

  const type = transition?.type ?? "crossfade";

  if (type === "none") {
    return {
      type,
      durationInFrames: 0,
    };
  }

  const durationInSeconds =
    transition?.durationInSeconds ??
    defaultDurationInSeconds;

  const requestedDurationInFrames = Math.max(
    1,
    Math.ceil(durationInSeconds * fps),
  );

  const durationInFrames = Math.min(
    requestedDurationInFrames,
    currentItem.durationInFrames,
  );

  return {
    type,
    durationInFrames,
  };
};

type GetMediaTransitionProgressInput = {
  sectionFrame: number;
  currentItem: MediaTimelineItem;
  transitionDurationInFrames: number;
};

export const getMediaTransitionProgress = ({
  sectionFrame,
  currentItem,
  transitionDurationInFrames,
}: GetMediaTransitionProgressInput): number => {
  if (transitionDurationInFrames <= 0) {
    return 0;
  }

  const transitionStartFrame = Math.max(
    currentItem.startFrame,
    currentItem.endFrame -
      transitionDurationInFrames,
  );

  return interpolate(
    sectionFrame,
    [
      transitionStartFrame,
      currentItem.endFrame,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
};

type GetMediaTransitionOpacityInput = {
  progress: number;
  type: TransitionType;
};

export const getCurrentMediaOpacity = ({
  progress,
  type,
}: GetMediaTransitionOpacityInput): number => {
  if (type === "none") {
    return 1;
  }

  return 1 - progress;
};

export const getNextMediaOpacity = ({
  progress,
  type,
}: GetMediaTransitionOpacityInput): number => {
  if (type === "none") {
    return 0;
  }

  return progress;
};