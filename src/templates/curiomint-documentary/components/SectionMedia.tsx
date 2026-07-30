import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createMediaTimeline,
  getActiveMediaTimelineItem,
} from "../media-timeline";

import type { DocumentarySection } from "../types";

import { MediaRenderer } from "./MediaRenderer";

type SectionMediaProps = {
  section?: DocumentarySection;
  sectionStartFrame?: number;
};

export const SectionMedia = ({
  section,
  sectionStartFrame = 0,
}: SectionMediaProps) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sectionFrame = Math.max(
    0,
    globalFrame - sectionStartFrame,
  );

  const mediaTimeline = createMediaTimeline({
    media: section?.media ?? [],
    fps,
    sectionDurationInSeconds:
      section?.durationInSeconds ?? 0,
  });

  const activeMediaTimelineItem =
    getActiveMediaTimelineItem(
      mediaTimeline,
      sectionFrame,
    );

  const media = activeMediaTimelineItem?.media;

  const mediaFrame = Math.max(
    0,
    sectionFrame -
    (activeMediaTimelineItem?.startFrame ?? 0),
  );

  if (!section) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 34,
          opacity: 0.5,
        }}
      >
        Aktif bölüm bulunamadı
      </AbsoluteFill>
    );
  }

  if (!media) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 34,
          opacity: 0.5,
        }}
      >
        Bu bölümde medya bulunmuyor
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#111",
      }}
    >
      <MediaRenderer
        media={media}
        fps={fps}
        frame={mediaFrame}
      />
    </AbsoluteFill>
  );
};