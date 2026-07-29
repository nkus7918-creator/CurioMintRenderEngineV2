export type TransitionType =
  | "none"
  | "fade"
  | "crossfade"
  | "slideLeft"
  | "slideRight"
  | "zoom";

export type TransitionConfig = {
  type: TransitionType;
  durationInSeconds?: number;
};