import { useMemo } from "react";
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

  const mediaTimeline = useMemo(() => {
    if (!section) {
      return null;
    }

    const sectionDurationInFrames = Math.max(
      1,
      Math.ceil(section.durationInSeconds * fps),
    );

    return createMediaTimeline({
      media: section.media ?? [],
      fps,
      sectionDurationInFrames,
    });
  }, [fps, section?.durationInSeconds, section?.media]);

  const sectionFrame = Math.max(0, globalFrame - sectionStartFrame);

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

  if (!mediaTimeline || mediaTimeline.items.length === 0) {
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
      {mediaTimeline.items.map((timelineItem) => {
        const mediaFrame = Math.max(0, sectionFrame - timelineItem.startFrame);

        return (
          <Sequence
            key={`${timelineItem.media.id}-${timelineItem.index}`}
            from={timelineItem.startFrame}
            durationInFrames={timelineItem.durationInFrames}
            layout="none"
          >
            <AbsoluteFill>
              <MediaRenderer
                media={timelineItem.media}
                fps={fps}
                frame={mediaFrame}
                durationInFrames={timelineItem.durationInFrames}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
