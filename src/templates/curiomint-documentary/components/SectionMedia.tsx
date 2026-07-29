import {
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

  if (!section) {
    return (
      <div
        style={{
          fontSize: 34,
          opacity: 0.5,
        }}
      >
        Aktif bölüm bulunamadı
      </div>
    );
  }

  if (!media) {
    return (
      <div
        style={{
          fontSize: 34,
          opacity: 0.5,
        }}
      >
        Bu bölümde medya bulunmuyor
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          width: 1200,
          height: 620,
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: "#111",
        }}
      >
        <MediaRenderer
          media={media}
          fps={fps}
        />
      </div>

      <div
        style={{
          marginTop: 20,
          fontSize: 22,
          opacity: 0.45,
          textAlign: "center",
        }}
      >
        Global frame: {globalFrame}
        {" · "}
        Section frame: {sectionFrame}
        {" · "}
        Media index:{" "}
        {activeMediaTimelineItem?.index ?? "-"}
      </div>
    </div>
  );
};