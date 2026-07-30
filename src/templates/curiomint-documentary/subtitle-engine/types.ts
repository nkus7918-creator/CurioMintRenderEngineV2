export type SubtitlePreset =
  | "classic"
  | "cinematic"
  | "youtube"
  | "minimal";

export type SubtitleAnimationPreset =
  | "none"
  | "fade"
  | "fadeUp"
  | "scaleIn";

export type SubtitleConfig = {
  preset?: SubtitlePreset;
  animation?: SubtitleAnimationPreset;
  maxLines?: number;
  highlightCurrentWord?: boolean;
};