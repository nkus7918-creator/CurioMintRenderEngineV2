import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  createDocumentaryTimeline,
  getActiveTimelineSection,
} from "../timeline";

import { DocumentaryLayout } from "../layouts/DocumentaryLayout";

import type { DocumentaryProps } from "../types";

import {
  getSectionTransitionOpacity,
} from "../transitions";

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

  const sectionOpacity =
    activeTimelineSection
      ? getSectionTransitionOpacity({
        frame,
        timelineItem:
          activeTimelineSection,
        transitionDurationInFrames:
          12,
      })
      : 0;

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
      <Sequence
        from={activeTimelineSection.startFrame}
        durationInFrames={activeTimelineSection.durationInFrames}
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
        </AbsoluteFill>

        {activeSection.narrationUrl ? (
          <Audio
            key={activeSection.id}
            src={activeSection.narrationUrl}
            volume={1}
          />
        ) : null}
      </Sequence>
    </AbsoluteFill>
  );
};