import type {
  SubtitleConfig,
} from "./types";

export type ResolvedSubtitleConfig = {
  preset: NonNullable<
    SubtitleConfig["preset"]
  >;

  animation: NonNullable<
    SubtitleConfig["animation"]
  >;

  maxLines: number;

  highlightCurrentWord: boolean;

  maxWordsPerChunk: number;

  maxCharactersPerChunk: number;

  maxChunkDurationInSeconds: number;

  leadInSeconds: number;

  holdSeconds: number;

  activeWordMinDurationInSeconds:
    number;
};

const clampNumber = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(min, value),
  );
};

const clampInteger = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  return Math.round(
    clampNumber(
      value,
      fallback,
      min,
      max,
    ),
  );
};

export const resolveSubtitleConfig = (
  config?: SubtitleConfig,
): ResolvedSubtitleConfig => ({
  preset:
    config?.preset ??
    "cinematic",

  animation:
    config?.animation ??
    "fadeUp",

  maxLines:
    clampInteger(
      config?.maxLines,
      2,
      1,
      2,
    ),

  highlightCurrentWord:
    config?.highlightCurrentWord ??
    true,

  maxWordsPerChunk:
    clampInteger(
      config?.maxWordsPerChunk,
      12,
      4,
      18,
    ),

  maxCharactersPerChunk:
    clampInteger(
      config?.maxCharactersPerChunk,
      90,
      24,
      140,
    ),

  maxChunkDurationInSeconds:
    clampNumber(
      config?.maxChunkDurationInSeconds,
      5,
      1.5,
      8,
    ),

  leadInSeconds:
    clampNumber(
      config?.leadInSeconds,
      0.12,
      0,
      0.5,
    ),

  holdSeconds:
    clampNumber(
      config?.holdSeconds,
      0.28,
      0,
      0.8,
    ),

  activeWordMinDurationInSeconds:
    clampNumber(
      config?.activeWordMinDurationInSeconds,
      0.18,
      0.05,
      0.6,
    ),
});