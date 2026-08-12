import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { OverlayRenderer } from "../renderers/OverlayRenderer";

import { SubtitleRenderer } from "../renderers/SubtitleRenderer";

import { TitleRenderer } from "../renderers/TitleRenderer";

import { SectionMedia } from "../components/SectionMedia";

import { useTheme } from "../themes/ThemeContext";

import { resolveInfographicTiming } from "../helpers/infographicTiming";

import type { DocumentarySection } from "../types";

type DocumentaryLayoutProps = {
  section: DocumentarySection;
  sectionStartFrame: number;
};

export const DocumentaryLayout = ({
  section,
  sectionStartFrame,
}: DocumentaryLayoutProps) => {
  const theme = useTheme();

  const frame = useCurrentFrame();

  const { fps } = useVideoConfig();

  const infographicTiming = resolveInfographicTiming({
    section,
    fps,
  });

  const historicalMapIsActive =
    infographicTiming?.type === "historicalMap" &&
    frame >= infographicTiming.startFrame &&
    frame < infographicTiming.startFrame + infographicTiming.durationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,

        overflow: "hidden",
      }}
    >
      <SectionMedia section={section} sectionStartFrame={sectionStartFrame} />

      <OverlayRenderer overlay={section.overlay} />

      {!historicalMapIsActive ? (
        <TitleRenderer
          title={section.title}
          animation={section.titleAnimation}
        />
      ) : null}

      <SubtitleRenderer
        text={
          section.subtitleTiming?.text ??
          section.narrationText ??
          section.subtitle
        }
        subtitleWords={section.subtitleTiming?.words}
        config={section.subtitleConfig}
      />
    </AbsoluteFill>
  );
};
