import { SectionMedia } from "../components/SectionMedia";
import { TitleRenderer } from "../renderers/TitleRenderer";

import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createDocumentaryTimeline,
  getActiveTimelineSection,
} from "../timeline";

import type { DocumentaryProps } from "../types";

export const Documentary = ({
  title,
  subtitle,
  theme,
  sections,
  introDurationInSeconds,
  outroDurationInSeconds,
}: DocumentaryProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeInSeconds = frame / fps;

  const timeline = createDocumentaryTimeline({
    sections,
    fps,
    introDurationInSeconds,
    outroDurationInSeconds,
  });

  const activeTimelineSection =
    getActiveTimelineSection(timeline, frame);

  const activeSection =
    activeTimelineSection?.section;

  const titleOpacity = interpolate(
    frame,
    [0, 30],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 100,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          textAlign: "center",
          maxWidth: 1500,
        }}
      >
        <div
          style={{
            marginBottom: 30,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            opacity: 0.65,
          }}
        >
          {theme}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 96,
            lineHeight: 1.05,
            fontWeight: 800,
          }}
        >
          {title}
        </h1>

        {subtitle ? (
          <p
            style={{
              marginTop: 30,
              marginBottom: 0,
              fontSize: 38,
              lineHeight: 1.3,
              opacity: 0.75,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        <div
          style={{
            width: 180,
            height: 4,
            margin: "50px auto",
            backgroundColor: "white",
            opacity: 0.35,
          }}
        />

        <SectionMedia
          section={activeSection}
          sectionStartFrame={
            activeTimelineSection?.startFrame ?? 0
          }
        />

        <div
          style={{
            marginTop: 50,
            fontSize: 24,
            fontVariantNumeric: "tabular-nums",
            opacity: 0.45,
          }}
        >
          {currentTimeInSeconds.toFixed(1)} seconds
          {" · "}
          frame {frame}
          {" · "}
          section {activeTimelineSection?.index ?? "-"}
        </div>
      </div>
      <TitleRenderer title={title} />
    </AbsoluteFill>
  );
};