import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createDocumentaryTimeline,
  getActiveTimelineItem,
} from "../timeline";

import { DocumentaryLayout } from "../layouts/DocumentaryLayout";
import { ChapterIntro } from "../components/ChapterIntro";
import { InfographicLayer } from "../components/InfographicLayer";

import type { DocumentaryProps } from "../types";

import { getSectionTransitionOpacity } from "../transitions";

import { AudioEngine } from "../audio/AudioEngine";
import { OverlayStack } from "../overlays/OverlayStack";

export const Documentary = ({
  chapters,
  sections,
  introDurationInSeconds,
  chapterIntroDurationInSeconds,
  outroDurationInSeconds,
  narrationVolume = 1,
  musicVolume = 0.18,
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

  const activeTimelineItem =
    getActiveTimelineItem(timeline, frame);

  const chapterStartFrames = timeline.items
    .filter((item) => item.type === "chapter")
    .map((item) => item.startFrame);

  const sectionStartFrames = timeline.items
    .filter((item) => item.type === "section")
    .map((item) => item.startFrame);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
      }}
    >
      {activeTimelineItem?.type === "chapter" ? (
        <Sequence
          from={activeTimelineItem.startFrame}
          durationInFrames={
            activeTimelineItem.durationInFrames
          }
        >
          <ChapterIntro
            chapterIndex={
              activeTimelineItem.chapterIndex
            }
            chapterTitle={
              activeTimelineItem.chapter.title
            }
            chapterSubtitle={
              activeTimelineItem.chapter.subtitle
            }
            backgroundImageUrl={
              activeTimelineItem.chapter
                .backgroundImageUrl
            }
            durationInFrames={
              activeTimelineItem.durationInFrames
            }
          />
        </Sequence>
      ) : null}

      {activeTimelineItem?.type === "section" ? (
        (() => {
          const activeSection =
            activeTimelineItem.section;

          const sectionOpacity =
            getSectionTransitionOpacity({
              frame,
              timelineItem: activeTimelineItem,
              transitionDurationInFrames: 12,
            });

          return (
            <Sequence
              from={activeTimelineItem.startFrame}
              durationInFrames={
                activeTimelineItem.durationInFrames
              }
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

                <InfographicLayer
                  section={activeSection}
                />
              </AbsoluteFill>

              {activeSection.narrationUrl ? (
                <Audio
                  key={activeSection.id}
                  src={activeSection.narrationUrl}
                  volume={narrationVolume}
                />
              ) : null}
            </Sequence>
          );
        })()
      ) : null}

      <OverlayStack
        seed="default"
        chapterStartFrames={chapterStartFrames}
        sectionStartFrames={sectionStartFrames}
        enabled
        mode="light"
      />

      <AudioEngine
        musicTheme="history"
        ambienceTheme="ancient"
        seed="default"
        musicVolume={musicVolume}
        chapterStartFrames={chapterStartFrames}
        sectionStartFrames={sectionStartFrames}
      />
    </AbsoluteFill>
  );
};