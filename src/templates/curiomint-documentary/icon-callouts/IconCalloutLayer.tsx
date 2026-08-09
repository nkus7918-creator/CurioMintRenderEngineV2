import React from "react";

import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from "remotion";

import {
  IconCallout,
} from "./IconCallout";

import type {
  DocumentarySection,
} from "../types";

interface IconCalloutLayerProps {
  section: DocumentarySection;
}

const DEFAULT_DURATION_SECONDS =
  4.2;

export const IconCalloutLayer: React.FC<
  IconCalloutLayerProps
> = ({
  section,
}) => {
  const { fps } =
    useVideoConfig();

  const sectionDurationInFrames =
    Math.max(
      1,
      Math.round(
        section.durationInSeconds *
          fps,
      ),
    );

  const cues =
    (
      section.iconCallouts ??
      []
    ).slice(0, 2);

  if (cues.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents:
          "none",
        zIndex: 40,
      }}
    >
      {cues.map(
        (cue) => {
          const startFrame =
            Math.max(
              0,
              Math.round(
                cue.startInSeconds *
                  fps,
              ),
            );

          if (
            startFrame >=
            sectionDurationInFrames
          ) {
            return null;
          }

          const requestedDuration =
            Math.max(
              1,
              Math.round(
                (
                  cue.durationInSeconds ??
                  DEFAULT_DURATION_SECONDS
                ) * fps,
              ),
            );

          const durationInFrames =
            Math.max(
              1,
              Math.min(
                requestedDuration,
                sectionDurationInFrames -
                  startFrame,
              ),
            );

          return (
            <Sequence
              key={cue.id}
              from={startFrame}
              durationInFrames={
                durationInFrames
              }
              layout="none"
            >
              <IconCallout
                cue={cue}
                durationInFrames={
                  durationInFrames
                }
              />
            </Sequence>
          );
        },
      )}
    </AbsoluteFill>
  );
};