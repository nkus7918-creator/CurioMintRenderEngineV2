import type { SubtitleConfig } from "./types";

export type ResolvedSubtitleConfig = {
  preset: NonNullable<SubtitleConfig["preset"]>;
  animation: NonNullable<SubtitleConfig["animation"]>;
  maxLines: number;
  highlightCurrentWord: boolean;
};

export const resolveSubtitleConfig = (
  config?: SubtitleConfig,
): ResolvedSubtitleConfig => {
  return {
    preset: config?.preset ?? "cinematic",
    animation: config?.animation ?? "fadeUp",
    maxLines: config?.maxLines ?? 2,
    highlightCurrentWord:
      config?.highlightCurrentWord ?? true,
  };
};