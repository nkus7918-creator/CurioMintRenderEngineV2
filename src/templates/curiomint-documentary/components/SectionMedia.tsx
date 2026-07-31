import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createMediaTimeline,
  getActiveMediaTimelineItem,
  getNextMediaTimelineItem,
} from "../mediaTimeline";

import type { DocumentarySection } from "../types";

import { useTheme } from "../themes/ThemeContext";
import { MediaRenderer } from "./MediaRenderer";

import {
  getCurrentMediaOpacity,
  getMediaTransitionProgress,
  getNextMediaOpacity,
  resolveMediaTransition,
} from "../mediaTransition";

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

  const sectionFrame = Math.max(
    0,
    globalFrame - sectionStartFrame,
  );

  const sectionDurationInFrames = Math.max(
    0,
    Math.ceil(
      (section?.durationInSeconds ?? 0) * fps,
    ),
  );

  const mediaTimeline = createMediaTimeline({
    media: section?.media ?? [],
    fps,
    sectionDurationInFrames,
  });

  const activeMediaTimelineItem =
    getActiveMediaTimelineItem(
      mediaTimeline,
      sectionFrame,
    );

  const nextMediaTimelineItem =
    getNextMediaTimelineItem(
      mediaTimeline,
      activeMediaTimelineItem,
    );

  const nextMedia =
    nextMediaTimelineItem?.media;

  const resolvedTransition =
    activeMediaTimelineItem && nextMediaTimelineItem
      ? resolveMediaTransition({
        currentItem: activeMediaTimelineItem,
        fps,
      })
      : {
        type: "none" as const,
        durationInFrames: 0,
      };

  const transitionProgress =
    activeMediaTimelineItem && nextMediaTimelineItem
      ? getMediaTransitionProgress({
        sectionFrame,
        currentItem: activeMediaTimelineItem,
        transitionDurationInFrames:
          resolvedTransition.durationInFrames,
      })
      : 0;

  const currentMediaOpacity =
    getCurrentMediaOpacity({
      progress: transitionProgress,
      type: resolvedTransition.type,
    });

  const nextMediaOpacity =
    getNextMediaOpacity({
      progress: transitionProgress,
      type: resolvedTransition.type,
    });

  const nextMediaFrame = Math.max(
    0,
    sectionFrame -
    (nextMediaTimelineItem?.startFrame ?? 0),
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

  if (!media) {
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
      <AbsoluteFill
        style={{
          opacity: currentMediaOpacity,
        }}
      >
        <MediaRenderer
          media={media}
          fps={fps}
          frame={mediaFrame}
        />
      </AbsoluteFill>

      {nextMedia && nextMediaTimelineItem ? (
        <AbsoluteFill
          style={{
            opacity: nextMediaOpacity,
          }}
        >
          <MediaRenderer
            media={nextMedia}
            fps={fps}
            frame={nextMediaFrame}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};