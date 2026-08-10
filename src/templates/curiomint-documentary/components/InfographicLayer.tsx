import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { DOCUMENTARY_LAYOUT_PRESET, LayoutGridArea } from "../../../design";

import { StatisticCard } from "../infographics/StatisticCard";

import { TimelineCard } from "../infographics/TimelineCard";

import { PersonCard } from "../infographics/PersonCard";

import { QuoteCard } from "../infographics/QuoteCard";

import { ComparisonCard } from "../infographics/ComparisonCard";

import { CountryCard } from "../infographics/CountryCard";

import { BattleCard } from "../infographics/BattleCard";

import { AnimatedMap } from "../maps/AnimatedMap";

import { HistoricalMap } from "../historical/HistoricalMap";

import type { DocumentarySection } from "../types";

type Props = {
  section: DocumentarySection;
};

type InfographicContentProps = {
  section: DocumentarySection;

  durationInFrames: number;
};

const InfographicContent = ({
  section,
  durationInFrames,
}: InfographicContentProps) => {
  const frame = useCurrentFrame();

  const fadeInEnd = Math.min(10, Math.max(1, durationInFrames - 1));

  const fadeOutStart = Math.max(fadeInEnd, durationInFrames - 12);

  const fadeOutEnd = Math.max(fadeOutStart + 1, durationInFrames);

  const opacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, fadeOutEnd],

    [0, 1, 1, 0],

    {
      extrapolateLeft: "clamp",

      extrapolateRight: "clamp",
    },
  );

  if (!section.infographics) {
    return null;
  }

  return (
    <>
      {/*
       * Cards use the complete 1920x1080 design canvas as their
       * positioning reference. This removes the visual offset
       * introduced by centering inside a 10-column grid area.
       */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          opacity,
        }}
      >
        {section.infographics.statistic ? (
          <StatisticCard config={section.infographics.statistic} />
        ) : null}

        {section.infographics.timeline ? (
          <TimelineCard config={section.infographics.timeline} />
        ) : null}

        {section.infographics.person ? (
          <PersonCard config={section.infographics.person} />
        ) : null}

        {section.infographics.quote ? (
          <QuoteCard config={section.infographics.quote} />
        ) : null}

        {section.infographics.comparison ? (
          <ComparisonCard config={section.infographics.comparison} />
        ) : null}

        {section.infographics.country ? (
          <CountryCard config={section.infographics.country} />
        ) : null}

        {section.infographics.battle ? (
          <BattleCard config={section.infographics.battle} />
        ) : null}
      </AbsoluteFill>

      {/*
       * Map is intentionally left in the documentary safe-area.
       * It is a full visual layer, not a centered information card.
       */}
      {section.infographics.map ? (
        <LayoutGridArea
          preset={DOCUMENTARY_LAYOUT_PRESET}
          areaName="card"
          columnStart={2}
          columnSpan={10}
          placement="center"
          itemStyle={{
            opacity,
            overflow: "visible",
          }}
        >
          <AnimatedMap config={section.infographics.map} />
        </LayoutGridArea>
      ) : null}

      {section.infographics.historicalMap ? (
        <LayoutGridArea
          preset={DOCUMENTARY_LAYOUT_PRESET}
          areaName="card"
          columnStart={2}
          columnSpan={10}
          placement="center"
          itemStyle={{
            opacity,
            overflow: "visible",
          }}
        >
          <HistoricalMap config={section.infographics.historicalMap} />
        </LayoutGridArea>
      ) : null}
    </>
  );
};

export const InfographicLayer = ({ section }: Props) => {
  const { fps } = useVideoConfig();

  if (!section.infographics) {
    return null;
  }

  const startFrame = Math.max(
    0,
    Math.round((section.infographicTiming?.startInSeconds ?? 1.8) * fps),
  );

  const defaultDurationInSeconds = section.infographics.comparison ? 8 : 3;

  const requestedDuration = Math.max(
    1,
    Math.round(
      (section.infographicTiming?.durationInSeconds ??
        defaultDurationInSeconds) * fps,
    ),
  );

  const sectionDuration = Math.max(
    1,
    Math.round(section.durationInSeconds * fps),
  );

  /*
   * Infographic section sonrasına
   * taşamaz.
   */
  const durationInFrames = Math.max(
    1,
    Math.min(requestedDuration, sectionDuration - startFrame),
  );

  return (
    <Sequence
      from={startFrame}
      durationInFrames={durationInFrames}
      layout="none"
    >
      <InfographicContent
        section={section}
        durationInFrames={durationInFrames}
      />
    </Sequence>
  );
};
