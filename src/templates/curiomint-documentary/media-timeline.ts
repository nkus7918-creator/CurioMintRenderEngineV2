import type { MediaItem } from "./types";

export type MediaTimelineItem = {
  media: MediaItem;
  index: number;
  startFrame: number;
  durationInFrames: number;
  endFrame: number;
};

export type MediaTimeline = {
  items: MediaTimelineItem[];
  totalDurationInFrames: number;
};

const secondsToFrames = (
  durationInSeconds: number | undefined,
  fps: number,
) => {
  if (
    typeof durationInSeconds !== "number" ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds <= 0
  ) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(durationInSeconds * fps),
  );
};

export const createMediaTimeline = ({
  media,
  fps,
  sectionDurationInSeconds,
}: {
  media: MediaItem[];
  fps: number;
  sectionDurationInSeconds: number;
}): MediaTimeline => {
  const sectionDurationInFrames =
    secondsToFrames(sectionDurationInSeconds, fps);

  if (media.length === 0) {
    return {
      items: [],
      totalDurationInFrames: 0,
    };
  }

  const explicitDurationInFrames = media.reduce(
    (total, item) =>
      total +
      secondsToFrames(
        item.durationInSeconds,
        fps,
      ),
    0,
  );

  const itemsWithoutDuration = media.filter(
    (item) =>
      typeof item.durationInSeconds !== "number" ||
      item.durationInSeconds <= 0,
  );

  const remainingDurationInFrames = Math.max(
    0,
    sectionDurationInFrames -
      explicitDurationInFrames,
  );

  const automaticDurationInFrames =
    itemsWithoutDuration.length > 0
      ? Math.floor(
          remainingDurationInFrames /
            itemsWithoutDuration.length,
        )
      : 0;

  let cursor = 0;

  const items = media.map(
    (item, index): MediaTimelineItem => {
      const requestedDurationInFrames =
        secondsToFrames(
          item.durationInSeconds,
          fps,
        ) || automaticDurationInFrames;

      const remainingFrames = Math.max(
        0,
        sectionDurationInFrames - cursor,
      );

      const durationInFrames = Math.min(
        requestedDurationInFrames,
        remainingFrames,
      );

      const startFrame = cursor;
      const endFrame =
        startFrame + durationInFrames;

      cursor = endFrame;

      return {
        media: item,
        index,
        startFrame,
        durationInFrames,
        endFrame,
      };
    },
  );

  return {
    items,
    totalDurationInFrames: cursor,
  };
};

export const getActiveMediaTimelineItem = (
  timeline: MediaTimeline,
  frame: number,
) => {
  return timeline.items.find(
    (item) =>
      frame >= item.startFrame &&
      frame < item.endFrame,
  );
};