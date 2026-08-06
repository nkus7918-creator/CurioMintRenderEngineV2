import type {
    MediaItem,
    ShortVideoStrategy,
  } from "./types";
  
  export type VideoSourceWindow = {
    trimBeforeInFrames: number;
  
    trimAfterInFrames?: number;
  
    availableDurationInFrames?: number;
  
    sourceDurationInFrames?: number;
  };
  
  export type ResolvedVideoPlayback =
    VideoSourceWindow & {
      strategy: ShortVideoStrategy;
  
      timelineDurationInFrames: number;
  
      shortageInFrames: number;
  
      shouldLoop: boolean;
    };
  
  type ResolveVideoPlaybackInput = {
    media: MediaItem;
  
    fps: number;
  
    durationInFrames: number;
  };
  
  const normalizeFps = (
    fps: number,
  ): number => {
    if (
      !Number.isFinite(fps) ||
      fps <= 0
    ) {
      return 30;
    }
  
    return fps;
  };
  
  const secondsToFrames = (
    seconds: number | undefined,
    fps: number,
  ): number | undefined => {
    if (
      typeof seconds !== "number" ||
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return undefined;
    }
  
    return Math.round(
      seconds * fps,
    );
  };
  
  export const resolveShortVideoStrategy = (
    media: MediaItem,
  ): ShortVideoStrategy =>
    media.shortVideoStrategy ??
    "advance";
  
  export const resolveVideoSourceWindow = (
    media: MediaItem,
    fps: number,
  ): VideoSourceWindow => {
    const safeFps =
      normalizeFps(fps);
  
    const trimBeforeInFrames =
      Math.max(
        0,
        secondsToFrames(
          media.startFromSeconds,
          safeFps,
        ) ?? 0,
      );
  
    const sourceDurationInFrames =
      secondsToFrames(
        media.sourceDurationInSeconds,
        safeFps,
      );
  
    const explicitTrimAfterInFrames =
      secondsToFrames(
        media.trimEndSeconds,
        safeFps,
      );
  
    const endCandidates = [
      explicitTrimAfterInFrames,
      sourceDurationInFrames,
    ].filter(
      (
        value,
      ): value is number =>
        typeof value === "number",
    );
  
    const trimAfterInFrames =
      endCandidates.length > 0
        ? Math.min(...endCandidates)
        : undefined;
  
    if (
      trimAfterInFrames !== undefined &&
      trimAfterInFrames <=
        trimBeforeInFrames
    ) {
      return {
        trimBeforeInFrames,
  
        /*
         * Geçersiz aralık Remotion'a
         * gönderilmez. Timeline bu item'ı
         * sıfır süreye indirecektir.
         */
        trimAfterInFrames:
          undefined,
  
        availableDurationInFrames: 0,
  
        sourceDurationInFrames,
      };
    }
  
    const availableDurationInFrames =
      trimAfterInFrames !== undefined
        ? Math.max(
            0,
            trimAfterInFrames -
              trimBeforeInFrames,
          )
        : undefined;
  
    return {
      trimBeforeInFrames,
  
      trimAfterInFrames,
  
      availableDurationInFrames,
  
      sourceDurationInFrames,
    };
  };
  
  export const resolveVideoTimelineDuration = ({
    media,
    fps,
    durationInFrames,
  }: ResolveVideoPlaybackInput): number => {
    const requestedDurationInFrames =
      Math.max(
        0,
        Math.floor(durationInFrames),
      );
  
    if (
      media.type !== "video" ||
      requestedDurationInFrames === 0
    ) {
      return requestedDurationInFrames;
    }
  
    const strategy =
      resolveShortVideoStrategy(media);
  
    const sourceWindow =
      resolveVideoSourceWindow(
        media,
        fps,
      );
  
    const availableDuration =
      sourceWindow
        .availableDurationInFrames;
  
    if (
      availableDuration === undefined
    ) {
      /*
       * Kaynak süresi henüz bilinmiyorsa
       * mevcut davranış korunur.
       *
       * Preflight aşaması bu metadata'yı
       * daha sonra sağlayacaktır.
       */
      return requestedDurationInFrames;
    }
  
    if (availableDuration <= 0) {
      return 0;
    }
  
    if (strategy === "loop") {
      return requestedDurationInFrames;
    }
  
    return Math.min(
      requestedDurationInFrames,
      availableDuration,
    );
  };
  
  export const resolveVideoPlayback = ({
    media,
    fps,
    durationInFrames,
  }: ResolveVideoPlaybackInput): ResolvedVideoPlayback => {
    const timelineDurationInFrames =
      Math.max(
        1,
        Math.floor(durationInFrames),
      );
  
    const strategy =
      resolveShortVideoStrategy(media);
  
    const sourceWindow =
      resolveVideoSourceWindow(
        media,
        fps,
      );
  
    const availableDuration =
      sourceWindow
        .availableDurationInFrames;
  
    const shortageInFrames =
      availableDuration === undefined
        ? 0
        : Math.max(
            0,
            timelineDurationInFrames -
              availableDuration,
          );
  
    const shouldLoop =
      strategy === "loop" &&
      availableDuration !== undefined &&
      availableDuration > 0 &&
      timelineDurationInFrames >
        availableDuration;
  
    return {
      ...sourceWindow,
  
      strategy,
  
      timelineDurationInFrames,
  
      shortageInFrames,
  
      shouldLoop,
    };
  };