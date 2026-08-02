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
import { StatisticCard } from "../infographics/StatisticCard";

import type { DocumentaryProps } from "../types";

import { getSectionTransitionOpacity } from "../transitions";

import { AudioEngine } from "../audio/AudioEngine";
import { OverlayStack } from "../overlays/OverlayStack";
import { AnimatedMap } from "../maps/AnimatedMap";
import { TimelineCard } from "../infographics/TimelineCard";
import { PersonCard } from "../infographics/PersonCard";
import { QuoteCard } from "../infographics/QuoteCard";
import { ComparisonCard } from "../infographics/ComparisonCard";
import { CountryCard } from "../infographics/CountryCard";
import { BattleCard } from "../infographics/BattleCard";

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

  const sectionStartFrames = timeline.items
    .filter((item) => item.type === "section")
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

        {activeSection.infographics?.statistic ? (
          <StatisticCard config={activeSection.infographics.statistic} />
        ) : null}

        {activeSection.infographics?.map ? (
          <AnimatedMap config={activeSection.infographics.map} />
        ) : null}

        {activeSection.infographics?.timeline ? (
          <TimelineCard config={activeSection.infographics.timeline} />
        ) : null}

        {activeSection.infographics?.person ? (
          <PersonCard config={activeSection.infographics.person} />
        ) : null}

        {activeSection.infographics?.quote ? (
          <QuoteCard config={activeSection.infographics.quote} />
        ) : null}

        {activeSection.infographics?.comparison ? (
          <ComparisonCard config={activeSection.infographics.comparison} />
        ) : null}

        {activeSection.infographics?.country ? (
          <CountryCard config={activeSection.infographics.country} />
        ) : null}

        {activeSection.infographics?.battle ? (
          <BattleCard config={activeSection.infographics.battle} />
        ) : null}

        {activeSection.narrationUrl ? (
          <Audio
            key={activeSection.id}
            src={activeSection.narrationUrl}
            volume={narrationVolume}
          />
        ) : null}
      </Sequence>

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
        chapterStartFrames={chapterStartFrames}
        sectionStartFrames={sectionStartFrames}
      />
    </AbsoluteFill>
  );
};
