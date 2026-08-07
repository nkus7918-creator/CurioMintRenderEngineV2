import {
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  DOCUMENTARY_LAYOUT_PRESET,
  LayoutGridArea,
} from "../../../design";

import {
  StatisticCard,
} from "../infographics/StatisticCard";

import {
  TimelineCard,
} from "../infographics/TimelineCard";

import {
  PersonCard,
} from "../infographics/PersonCard";

import {
  QuoteCard,
} from "../infographics/QuoteCard";

import {
  ComparisonCard,
} from "../infographics/ComparisonCard";

import {
  CountryCard,
} from "../infographics/CountryCard";

import {
  BattleCard,
} from "../infographics/BattleCard";

import {
  AnimatedMap,
} from "../maps/AnimatedMap";

import type {
  DocumentarySection,
} from "../types";

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
  const frame =
    useCurrentFrame();

  const fadeInEnd =
    Math.min(
      10,
      Math.max(
        1,
        durationInFrames - 1,
      ),
    );

  const fadeOutStart =
    Math.max(
      fadeInEnd,
      durationInFrames - 12,
    );

  const fadeOutEnd =
    Math.max(
      fadeOutStart + 1,
      durationInFrames,
    );

  const opacity =
    interpolate(
      frame,

      [
        0,
        fadeInEnd,
        fadeOutStart,
        fadeOutEnd,
      ],

      [0, 1, 1, 0],

      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  if (!section.infographics) {
    return null;
  }

  return (
    <LayoutGridArea
      preset={
        DOCUMENTARY_LAYOUT_PRESET
      }
      areaName="card"
      columnStart={2}
      columnSpan={10}
      placement="center"
      itemStyle={{
        opacity,

        overflow: "visible",
      }}
    >
      {section.infographics
        .statistic ? (
        <StatisticCard
          config={
            section.infographics
              .statistic
          }
        />
      ) : null}

      {section.infographics
        .timeline ? (
        <TimelineCard
          config={
            section.infographics
              .timeline
          }
        />
      ) : null}

      {section.infographics
        .person ? (
        <PersonCard
          config={
            section.infographics
              .person
          }
        />
      ) : null}

      {section.infographics
        .quote ? (
        <QuoteCard
          config={
            section.infographics
              .quote
          }
        />
      ) : null}

      {section.infographics
        .comparison ? (
        <ComparisonCard
          config={
            section.infographics
              .comparison
          }
        />
      ) : null}

      {section.infographics
        .country ? (
        <CountryCard
          config={
            section.infographics
              .country
          }
        />
      ) : null}

      {section.infographics
        .battle ? (
        <BattleCard
          config={
            section.infographics
              .battle
          }
        />
      ) : null}

      {section.infographics.map ? (
        <AnimatedMap
          config={
            section.infographics
              .map
          }
        />
      ) : null}
    </LayoutGridArea>
  );
};

export const InfographicLayer = ({
  section,
}: Props) => {
  const { fps } =
    useVideoConfig();

  if (!section.infographics) {
    return null;
  }

  const startFrame =
    Math.max(
      0,
      Math.round(
        (
          section
            .infographicTiming
            ?.startInSeconds ??
          1.8
        ) * fps,
      ),
    );

  const requestedDuration =
    Math.max(
      1,
      Math.round(
        (
          section
            .infographicTiming
            ?.durationInSeconds ??
          3
        ) * fps,
      ),
    );

  const sectionDuration =
    Math.max(
      1,
      Math.round(
        section
          .durationInSeconds *
          fps,
      ),
    );

  /*
   * Infographic section sonrasına
   * taşamaz.
   */
  const durationInFrames =
    Math.max(
      1,
      Math.min(
        requestedDuration,
        sectionDuration -
          startFrame,
      ),
    );

  return (
    <Sequence
      from={startFrame}
      durationInFrames={
        durationInFrames
      }
      layout="none"
    >
      <InfographicContent
        section={section}
        durationInFrames={
          durationInFrames
        }
      />
    </Sequence>
  );
};