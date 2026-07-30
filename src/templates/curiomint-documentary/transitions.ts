import {
    Easing,
    interpolate,
  } from "remotion";
  
  import type {
    SectionTimelineItem,
  } from "./timeline";
  
  const DEFAULT_TRANSITION_DURATION_IN_FRAMES = 12;
  
  const TRANSITION_EASING = Easing.bezier(
    0.42,
    0,
    0.58,
    1,
  );
  
  const clampTransitionDuration = ({
    requestedDuration,
    sectionDuration,
  }: {
    requestedDuration: number;
    sectionDuration: number;
  }) => {
    return Math.max(
      0,
      Math.min(
        requestedDuration,
        Math.floor(sectionDuration / 2),
      ),
    );
  };
  
  export const getSectionTransitionOpacity = ({
    frame,
    timelineItem,
    transitionDurationInFrames =
      DEFAULT_TRANSITION_DURATION_IN_FRAMES,
  }: {
    frame: number;
    timelineItem: SectionTimelineItem;
    transitionDurationInFrames?: number;
  }) => {
    const duration = clampTransitionDuration({
      requestedDuration:
        transitionDurationInFrames,
      sectionDuration:
        timelineItem.durationInFrames,
    });
  
    if (duration === 0) {
      return 1;
    }
  
    const localFrame =
      frame - timelineItem.startFrame;
  
    const fadeInOpacity = interpolate(
      localFrame,
      [0, duration],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: TRANSITION_EASING,
      },
    );
  
    const fadeOutStartFrame =
      timelineItem.durationInFrames - duration;
  
    const fadeOutOpacity = interpolate(
      localFrame,
      [
        fadeOutStartFrame,
        timelineItem.durationInFrames - 1,
      ],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: TRANSITION_EASING,
      },
    );
  
    return Math.min(
      fadeInOpacity,
      fadeOutOpacity,
    );
  };