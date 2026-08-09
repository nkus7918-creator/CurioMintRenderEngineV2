import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  OverlayRenderer,
} from "../renderers/OverlayRenderer";

import {
  SubtitleRenderer,
} from "../renderers/SubtitleRenderer";

import {
  TitleRenderer,
} from "../renderers/TitleRenderer";

import {
  SectionMedia,
} from "../components/SectionMedia";

import {
  useTheme,
} from "../themes/ThemeContext";

import type {
  DocumentarySection,
} from "../types";

type DocumentaryLayoutProps = {
  section: DocumentarySection;
  sectionStartFrame: number;
};

export const DocumentaryLayout = ({
  section,
  sectionStartFrame,
}: DocumentaryLayoutProps) => {
  const theme =
    useTheme();

  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const hasHistoricalMap =
    Boolean(
      section.infographics
        ?.historicalMap,
    );

  const infographicStartFrame =
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

  const infographicDuration =
    Math.max(
      1,
      Math.min(
        requestedDuration,
        sectionDuration -
          infographicStartFrame,
      ),
    );

  const historicalMapIsActive =
    hasHistoricalMap &&
    frame >=
      infographicStartFrame &&
    frame <
      infographicStartFrame +
        infographicDuration;

  return (
    <AbsoluteFill
      style={{
        backgroundColor:
          theme.colors
            .background,
        overflow: "hidden",
      }}
    >
      <SectionMedia
        section={section}
        sectionStartFrame={
          sectionStartFrame
        }
      />

      <OverlayRenderer
        overlay={
          section.overlay
        }
      />

      {!historicalMapIsActive ? (
        <TitleRenderer
          title={
            section.title
          }
          animation={
            section.titleAnimation
          }
        />
      ) : null}

      <SubtitleRenderer
        text={
          section
            .subtitleTiming
            ?.text ??
          section
            .narrationText ??
          section.subtitle
        }
        subtitleWords={
          section
            .subtitleTiming
            ?.words
        }
        config={
          section.subtitleConfig
        }
      />
    </AbsoluteFill>
  );
};