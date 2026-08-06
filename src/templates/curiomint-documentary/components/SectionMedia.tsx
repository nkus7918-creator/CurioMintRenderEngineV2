import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { createMediaTimeline } from "../mediaTimeline";

import type { DocumentarySection } from "../types";

import { useTheme } from "../themes/ThemeContext";
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
  const theme = useTheme();

  const sectionFrame = Math.max(0, globalFrame - sectionStartFrame);

  const sectionDurationInFrames = Math.max(
    1,
    Math.ceil((section?.durationInSeconds ?? 0) * fps),
  );

  if (!section) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily,
          fontSize: 34,
          opacity: 0.5,
        }}
      >
        Aktif bölüm bulunamadı
      </AbsoluteFill>
    );
  }

  const mediaTimeline = createMediaTimeline({
    media: section.media ?? [],
    fps,
    sectionDurationInFrames,
  });


  if (mediaTimeline.length === 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily,
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
        backgroundColor: theme.colors.surface,
      }}
    >
      {mediaTimeline.map((timelineItem) => {
        const mediaFrame = Math.max(0, sectionFrame - timelineItem.startFrame);

        return (
          <Sequence
            key={timelineItem.media.id}
            from={timelineItem.startFrame}
            durationInFrames={timelineItem.durationInFrames}
            layout="none"
          >
            <AbsoluteFill>
              <MediaRenderer
                media={timelineItem.media}
                fps={fps}
                frame={mediaFrame}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
