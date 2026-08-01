import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { createDocumentaryTimeline, getActiveTimelineItem } from "../timeline";

import { DocumentaryLayout } from "../layouts/DocumentaryLayout";
import { ChapterIntro } from "../components/ChapterIntro";

import type { DocumentaryProps } from "../types";

import { getSectionTransitionOpacity } from "../transitions";

import { AudioEngine } from "../audio/AudioEngine";

export const Documentary = ({
  chapters,
  sections,
  introDurationInSeconds,
  chapterIntroDurationInSeconds,
  outroDurationInSeconds,
  narrationVolume = 1,
}: DocumentaryProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timeline = createDocumentaryTimeline({
    chapters,
    sections,
    fps,
    introDurationInSeconds,
    chapterIntroDurationInSeconds,
    outroDurationInSeconds,
  });

  const activeTimelineItem = getActiveTimelineItem(timeline, frame);

  if (!activeTimelineItem) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#080808",
        }}
      />
    );
  }

  if (activeTimelineItem.type === "chapter") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#080808",
        }}
      >
        <Sequence
          from={activeTimelineItem.startFrame}
          durationInFrames={activeTimelineItem.durationInFrames}
        >
          <ChapterIntro
            chapterIndex={activeTimelineItem.chapterIndex}
            chapterTitle={activeTimelineItem.chapter.title}
            durationInFrames={activeTimelineItem.durationInFrames}
          />
        </Sequence>
      </AbsoluteFill>
    );
  }

  const activeSection = activeTimelineItem.section;

  const chapterStartFrames = timeline.items
    .filter((item) => item.type === "chapter")
    .map((item) => item.startFrame);

  const sectionOpacity = getSectionTransitionOpacity({
    frame,
    timelineItem: activeTimelineItem,
    transitionDurationInFrames: 12,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
      }}
    >
      <Sequence
        from={activeTimelineItem.startFrame}
        durationInFrames={activeTimelineItem.durationInFrames}
      >
        <AbsoluteFill
          style={{
            opacity: sectionOpacity,
          }}
        >
          <DocumentaryLayout section={activeSection} sectionStartFrame={0} />
        </AbsoluteFill>

        {activeSection.narrationUrl ? (
          <Audio
            key={activeSection.id}
            src={activeSection.narrationUrl}
            volume={narrationVolume}
          />
        ) : null}
      </Sequence>

      <AudioEngine
        musicTheme="history"
        ambienceTheme="ancient"
        seed="default"
        chapterStartFrames={chapterStartFrames}
      />
    </AbsoluteFill>
  );
};
