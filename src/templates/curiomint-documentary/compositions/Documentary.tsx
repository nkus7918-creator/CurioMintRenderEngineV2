import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { DesignCanvas, DOCUMENTARY_LAYOUT_PRESET } from "../../../design";

import { createDocumentaryTimeline, getActiveTimelineItem } from "../timeline";

import { DocumentaryLayout } from "../layouts/DocumentaryLayout";

import { ChapterIntro } from "../components/ChapterIntro";

import { InfographicLayer } from "../components/InfographicLayer";

import type { DocumentaryProps } from "../types";

import { getSectionTransitionOpacity } from "../transitions";

import { AudioEngine } from "../audio/AudioEngine";

import { OverlayStack } from "../overlays/OverlayStack";

import { NarrationAudio } from "../audio/NarrationAudio";

import type { AudioFrameInterval } from "../audio/ducking";

export const Documentary = ({
  chapters,
  sections,
  introDurationInSeconds,
  chapterIntroDurationInSeconds,
  outroDurationInSeconds,
  narrationVolume = 1,
  musicVolume = 0.08,
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

  /*
   * chapterIndex is the index in the original chapters array.
   * Opening/ending chapters may have showIntro=false, so that
   * index must not be used as the visible chapter number.
   */
  const visibleChapterItems = timeline.items.filter(
    (item) => item.type === "chapter",
  );

  const visibleChapterIndex =
    activeTimelineItem?.type === "chapter"
      ? visibleChapterItems.findIndex(
          (item) =>
            item.startFrame === activeTimelineItem.startFrame,
        )
      : -1;

  /*
   * Production safety: background music should never exceed
   * the documentary narration-first mix target.
   */
  const resolvedMusicVolume = Math.min(
    0.08,
    Math.max(0, musicVolume),
  );

  const chapterStartFrames = timeline.items
    .filter((item) => item.type === "chapter")
    .map((item) => item.startFrame);

  const sectionStartFrames = timeline.items
    .filter((item) => item.type === "section")
    .map((item) => item.startFrame);

  const narrationIntervals: AudioFrameInterval[] = timeline.items
    .filter(
      (
        item,
      ): item is Extract<
        (typeof timeline.items)[number],
        {
          type: "section";
        }
      > => item.type === "section" && Boolean(item.section.narrationUrl),
    )
    .map((item) => ({
      startFrame: item.startFrame,

      endFrame: item.endFrame,
    }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
      }}
    >
      <DesignCanvas
        preset={DOCUMENTARY_LAYOUT_PRESET}
        backgroundColor="#080808"
      >
        {activeTimelineItem?.type === "chapter" ? (
          <Sequence
            from={activeTimelineItem.startFrame}
            durationInFrames={activeTimelineItem.durationInFrames}
          >
            <ChapterIntro
              chapterIndex={
                visibleChapterIndex >= 0
                  ? visibleChapterIndex
                  : activeTimelineItem.chapterIndex
              }
              chapterTitle={activeTimelineItem.chapter.title}
              chapterSubtitle={activeTimelineItem.chapter.subtitle}
              backgroundImageUrl={activeTimelineItem.chapter.backgroundImageUrl}
              durationInFrames={activeTimelineItem.durationInFrames}
              rank={activeTimelineItem.chapter.rank}
            />
          </Sequence>
        ) : null}

        {activeTimelineItem?.type === "section"
          ? (() => {
              const activeSection = activeTimelineItem.section;

              const sectionOpacity = getSectionTransitionOpacity({
                frame,

                timelineItem: activeTimelineItem,

                transitionDurationInFrames: 12,
              });

              return (
                <Sequence
                  from={activeTimelineItem.startFrame}
                  durationInFrames={activeTimelineItem.durationInFrames}
                >
                  <AbsoluteFill
                    style={{
                      opacity: sectionOpacity,
                    }}
                  >
                    <DocumentaryLayout
                      section={activeSection}
                      sectionStartFrame={0}
                    />

                    <InfographicLayer section={activeSection} />
                  </AbsoluteFill>

                  {activeSection.narrationUrl ? (
                    <NarrationAudio
                      key={activeSection.id}
                      src={activeSection.narrationUrl}
                      volume={narrationVolume}
                      durationInFrames={activeTimelineItem.durationInFrames}
                    />
                  ) : null}
                </Sequence>
              );
            })()
          : null}

        <OverlayStack
          seed="default"
          chapterStartFrames={chapterStartFrames}
          sectionStartFrames={sectionStartFrames}
          enabled
          mode="light"
        />
      </DesignCanvas>

      <AudioEngine
        musicTheme="history"
        ambienceTheme="ancient"
        seed="default"
        musicVolume={resolvedMusicVolume}
        narrationIntervals={narrationIntervals}
        chapterStartFrames={chapterStartFrames}
        sectionStartFrames={sectionStartFrames}
      />
    </AbsoluteFill>
  );
};
