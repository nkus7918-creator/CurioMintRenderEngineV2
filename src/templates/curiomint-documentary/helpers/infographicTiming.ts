import type { DocumentarySection } from "../types";

export type DocumentaryInfographicType =
  | "statistic"
  | "timeline"
  | "person"
  | "quote"
  | "comparison"
  | "country"
  | "battle"
  | "map"
  | "historicalMap";

type TimingPolicy = {
  durationInSeconds: number;
  startFraction: number;
  minStartInSeconds: number;
  maxStartInSeconds: number;
};

const TIMING_POLICY: Record<DocumentaryInfographicType, TimingPolicy> = {
  statistic: {
    durationInSeconds: 5,
    startFraction: 0.32,
    minStartInSeconds: 3,
    maxStartInSeconds: 10.5,
  },

  quote: {
    durationInSeconds: 6,
    startFraction: 0.3,
    minStartInSeconds: 3,
    maxStartInSeconds: 10,
  },

  person: {
    durationInSeconds: 6.5,
    startFraction: 0.3,
    minStartInSeconds: 3,
    maxStartInSeconds: 10,
  },

  map: {
    durationInSeconds: 7.5,
    startFraction: 0.27,
    minStartInSeconds: 3,
    maxStartInSeconds: 9,
  },

  comparison: {
    durationInSeconds: 8,
    startFraction: 0.3,
    minStartInSeconds: 3,
    maxStartInSeconds: 10,
  },

  timeline: {
    durationInSeconds: 8,
    startFraction: 0.3,
    minStartInSeconds: 3,
    maxStartInSeconds: 10,
  },

  country: {
    durationInSeconds: 8,
    startFraction: 0.28,
    minStartInSeconds: 3,
    maxStartInSeconds: 9.5,
  },

  battle: {
    durationInSeconds: 8,
    startFraction: 0.28,
    minStartInSeconds: 3,
    maxStartInSeconds: 9.5,
  },

  historicalMap: {
    durationInSeconds: 9,
    startFraction: 0.27,
    minStartInSeconds: 3,
    maxStartInSeconds: 9,
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const getInfographicType = (
  section: DocumentarySection,
): DocumentaryInfographicType | null => {
  const infographics = section.infographics;

  if (!infographics) {
    return null;
  }

  /*
   * Full visual layers first.
   *
   * The production pipeline should
   * normally create only one main
   * infographic per section, but this
   * priority keeps runtime behavior
   * deterministic if malformed input
   * contains more than one.
   */
  if (infographics.historicalMap) {
    return "historicalMap";
  }

  if (infographics.map) {
    return "map";
  }

  if (infographics.country) {
    return "country";
  }

  if (infographics.battle) {
    return "battle";
  }

  if (infographics.timeline) {
    return "timeline";
  }

  if (infographics.comparison) {
    return "comparison";
  }

  if (infographics.person) {
    return "person";
  }

  if (infographics.quote) {
    return "quote";
  }

  if (infographics.statistic) {
    return "statistic";
  }

  return null;
};

export type ResolvedInfographicTiming = {
  type: DocumentaryInfographicType;
  startInSeconds: number;
  durationInSeconds: number;
  startFrame: number;
  durationInFrames: number;
};

export const resolveInfographicTiming = ({
  section,
  fps,
}: {
  section: DocumentarySection;
  fps: number;
}): ResolvedInfographicTiming | null => {
  const type = getInfographicType(section);

  if (!type) {
    return null;
  }

  const policy = TIMING_POLICY[type];

  const sectionDurationInSeconds = Math.max(
    1 / fps,
    Number(section.durationInSeconds) || 0,
  );

  const explicitDuration = section.infographicTiming?.durationInSeconds;

  const requestedDurationInSeconds =
    Number.isFinite(explicitDuration) && Number(explicitDuration) > 0
      ? Number(explicitDuration)
      : policy.durationInSeconds;

  const explicitStart = section.infographicTiming?.startInSeconds;

  let startInSeconds: number;

  if (Number.isFinite(explicitStart)) {
    startInSeconds = Math.max(0, Number(explicitStart));
  } else {
    const proportionalStart = sectionDurationInSeconds * policy.startFraction;

    startInSeconds = clamp(
      proportionalStart,
      policy.minStartInSeconds,
      policy.maxStartInSeconds,
    );

    /*
     * When the section is long enough,
     * leave roughly one second after the
     * infographic before the section ends.
     *
     * This avoids a full visual layer
     * disappearing exactly on the section
     * cut.
     */
    const latestComfortableStart =
      sectionDurationInSeconds - requestedDurationInSeconds - 1;

    if (latestComfortableStart >= 1.5) {
      startInSeconds = Math.min(startInSeconds, latestComfortableStart);
    }
  }

  const sectionDurationInFrames = Math.max(
    1,
    Math.round(sectionDurationInSeconds * fps),
  );

  const unclampedStartFrame = Math.max(0, Math.round(startInSeconds * fps));

  /*
   * Never begin outside the section.
   */
  const startFrame = Math.min(
    unclampedStartFrame,
    Math.max(0, sectionDurationInFrames - 1),
  );

  const requestedDurationInFrames = Math.max(
    1,
    Math.round(requestedDurationInSeconds * fps),
  );

  const remainingFrames = Math.max(1, sectionDurationInFrames - startFrame);

  const durationInFrames = Math.max(
    1,
    Math.min(requestedDurationInFrames, remainingFrames),
  );

  return {
    type,

    startInSeconds: startFrame / fps,

    durationInSeconds: durationInFrames / fps,

    startFrame,

    durationInFrames,
  };
};
