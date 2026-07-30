import type {
    TitleAnimationConfig,
    TitleAnimationPreset,
  } from "./types";
  
  export type ResolvedTitleAnimation = {
    preset: TitleAnimationPreset;
    durationInSeconds: number;
    delayInSeconds: number;
  };
  
  export const resolveTitleAnimation = (
    config?: TitleAnimationConfig,
  ): ResolvedTitleAnimation => {
    return {
      preset: config?.preset ?? "fade",
      durationInSeconds: config?.durationInSeconds ?? 0.8,
      delayInSeconds: config?.delayInSeconds ?? 0,
    };
  };