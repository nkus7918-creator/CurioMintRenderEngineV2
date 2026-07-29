import type { DocumentarySection } from "./types";

export type SectionTimelineItem = {
  section: DocumentarySection;
  index: number;
  startFrame: number;
  durationInFrames: number;
  endFrame: number;
};

export type DocumentaryTimeline = {
  introDurationInFrames: number;
  sections: SectionTimelineItem[];
  outroStartFrame: number;
  outroDurationInFrames: number;
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

  return Math.max(1, Math.ceil(durationInSeconds * fps));
};

export const createDocumentaryTimeline = ({
  sections,
  fps,
  introDurationInSeconds = 0,
  outroDurationInSeconds = 0,
}: {
  sections: DocumentarySection[];
  fps: number;
  introDurationInSeconds?: number;
  outroDurationInSeconds?: number;
}): DocumentaryTimeline => {
  const introDurationInFrames = secondsToFrames(
    introDurationInSeconds,
    fps,
  );

  const outroDurationInFrames = secondsToFrames(
    outroDurationInSeconds,
    fps,
  );

  let cursor = introDurationInFrames;

  const sectionTimeline = sections.map(
    (section, index): SectionTimelineItem => {
      const durationInFrames = secondsToFrames(
        section.durationInSeconds,
        fps,
      );

      const startFrame = cursor;
      const endFrame = startFrame + durationInFrames;

      cursor = endFrame;

      return {
        section,
        index,
        startFrame,
        durationInFrames,
        endFrame,
      };
    },
  );

  const outroStartFrame = cursor;

  return {
    introDurationInFrames,
    sections: sectionTimeline,
    outroStartFrame,
    outroDurationInFrames,
    totalDurationInFrames:
      outroStartFrame + outroDurationInFrames,
  };
};

export const getActiveTimelineSection = (
  timeline: DocumentaryTimeline,
  frame: number,
) => {
  return timeline.sections.find(
    (item) =>
      frame >= item.startFrame &&
      frame < item.endFrame,
  );
};