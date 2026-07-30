import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createDocumentaryTimeline,
  getActiveTimelineSection,
} from "../timeline";

import { DocumentaryLayout } from "../layouts/DocumentaryLayout";

import type { DocumentaryProps } from "../types";

export const Documentary = ({
  title,
  subtitle,
  subtitleWords,
  sections,
  introDurationInSeconds,
  outroDurationInSeconds,
}: DocumentaryProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  if (!activeSection) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#080808",
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
      }}
    >
      <DocumentaryLayout
        section={activeSection}
        sectionStartFrame={activeTimelineSection.startFrame}
      />

      {activeSection.narrationUrl ? (
        <Audio
          key={activeSection.id}
          src={activeSection.narrationUrl}
          volume={1}
        />
      ) : null}
    </AbsoluteFill>
  );
};