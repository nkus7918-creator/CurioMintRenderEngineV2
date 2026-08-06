import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";

import { StatisticCard } from "../infographics/StatisticCard";
import { TimelineCard } from "../infographics/TimelineCard";
import { PersonCard } from "../infographics/PersonCard";
import { QuoteCard } from "../infographics/QuoteCard";
import { ComparisonCard } from "../infographics/ComparisonCard";
import { CountryCard } from "../infographics/CountryCard";
import { BattleCard } from "../infographics/BattleCard";
import { AnimatedMap } from "../maps/AnimatedMap";

import type { DocumentarySection } from "../types";

type Props = {
  section: DocumentarySection;
};

export const InfographicLayer = ({ section }: Props) => {
  const { fps } = useVideoConfig();

  if (!section.infographics) {
    return null;
  }

  const startFrame = Math.round(
    (section.infographicTiming?.startInSeconds ?? 1.8) * fps,
  );

  const durationInFrames = Math.max(
    1,
    Math.round((section.infographicTiming?.durationInSeconds ?? 3) * fps),
  );

  return (
    <Sequence
      from={startFrame}
      durationInFrames={durationInFrames}
      layout="none"
    >
      <AbsoluteFill
        style={{
          /*
           * Üstte title için boşluk.
           * Altta subtitle için daha büyük güvenli alan.
           */
          top: 120,
          bottom: 220,
          left: 70,
          right: 70,

          justifyContent: "center",
          alignItems: "center",

          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {section.infographics.statistic && (
          <StatisticCard config={section.infographics.statistic} />
        )}

        {section.infographics.timeline && (
          <TimelineCard config={section.infographics.timeline} />
        )}

        {section.infographics.person && (
          <PersonCard config={section.infographics.person} />
        )}

        {section.infographics.quote && (
          <QuoteCard config={section.infographics.quote} />
        )}

        {section.infographics.comparison && (
          <ComparisonCard config={section.infographics.comparison} />
        )}

        {section.infographics.country && (
          <CountryCard config={section.infographics.country} />
        )}

        {section.infographics.battle && (
          <BattleCard config={section.infographics.battle} />
        )}

        {section.infographics.map && (
          <AnimatedMap config={section.infographics.map} />
        )}
      </AbsoluteFill>
    </Sequence>
  );
};
