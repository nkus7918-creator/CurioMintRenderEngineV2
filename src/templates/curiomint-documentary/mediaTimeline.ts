import type {
    MediaItem,
  } from "./types";

  import {
    resolveVideoTimelineDuration,
  } from "./videoPlayback";

  export type MediaTimelineItem = {
    media: MediaItem;

    index: number;

    startFrame: number;

    endFrame: number;

    /*
     * Timeline dağılımının media için
     * istediği süre.
     */
    requestedDurationInFrames: number;

    /*
     * Kaynak video sınırları uygulandıktan
     * sonra gerçekten kullanılacak süre.
     */
    durationInFrames: number;

    shortageInFrames: number;

    hasExplicitDuration: boolean;
  };

  export type MediaTimeline = {
    items: MediaTimelineItem[];

    sectionDurationInFrames: number;

    totalDurationInFrames: number;

    uncoveredDurationInFrames: number;
  };

  type CreateMediaTimelineInput = {
    media: MediaItem[];

    sectionDurationInFrames: number;

    fps: number;
  };

  const normalizeSectionDuration = (
    durationInFrames: number,
  ): number => {
    if (
      !Number.isFinite(durationInFrames) ||
      durationInFrames <= 0
    ) {
      return 0;
    }

    return Math.max(
      1,
      Math.floor(durationInFrames),
    );
  };

  const secondsToFrames = (
    seconds: number | undefined,
    fps: number,
  ): number => {
    if (
      typeof seconds !== "number" ||
      !Number.isFinite(seconds) ||
      seconds <= 0 ||
      !Number.isFinite(fps) ||
      fps <= 0
    ) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil(seconds * fps),
    );
  };

  export const createMediaTimeline = ({
    media,
    sectionDurationInFrames,
    fps,
  }: CreateMediaTimelineInput): MediaTimeline => {
    const safeSectionDuration =
      normalizeSectionDuration(
        sectionDurationInFrames,
      );

    if (
      media.length === 0 ||
      safeSectionDuration === 0
    ) {
      return {
        items: [],

        sectionDurationInFrames:
          safeSectionDuration,

        totalDurationInFrames: 0,

        uncoveredDurationInFrames:
          safeSectionDuration,
      };
    }

    const explicitDurations =
      media.map((item) =>
        secondsToFrames(
          item.durationInSeconds,
          fps,
        ),
      );

    const explicitDurationTotal =
      explicitDurations.reduce(
        (total, duration) =>
          total + duration,
        0,
      );

    const automaticItemCount =
      explicitDurations.filter(
        (duration) => duration === 0,
      ).length;

    const remainingForAutomaticItems =
      Math.max(
        0,
        safeSectionDuration -
          explicitDurationTotal,
      );

    const automaticBaseDuration =
      automaticItemCount > 0
        ? Math.floor(
            remainingForAutomaticItems /
              automaticItemCount,
          )
        : 0;

    const automaticRemainder =
      automaticItemCount > 0
        ? remainingForAutomaticItems %
          automaticItemCount
        : 0;

    let automaticItemIndex = 0;

    const requestedDurations =
      explicitDurations.map(
        (explicitDuration) => {
          if (explicitDuration > 0) {
            return explicitDuration;
          }

          const duration =
            automaticBaseDuration +
            (automaticItemIndex <
            automaticRemainder
              ? 1
              : 0);

          automaticItemIndex += 1;

          return duration;
        },
      );

    if (automaticItemCount === 0) {
      const requestedTotal =
        requestedDurations.reduce(
          (total, duration) =>
            total + duration,
          0,
        );

      const missingFrames =
        Math.max(
          0,
          safeSectionDuration -
            requestedTotal,
        );

      if (missingFrames > 0) {
        const lastIndex =
          requestedDurations.length -
          1;

        requestedDurations[lastIndex] +=
          missingFrames;
      }
    }

    const items: MediaTimelineItem[] =
      [];

    let cursor = 0;

    media.forEach((item, index) => {
      const remainingFrames =
        Math.max(
          0,
          safeSectionDuration -
            cursor,
        );

      if (remainingFrames === 0) {
        return;
      }

      const isLastItem =
        index === media.length - 1;

      const baseRequestedDuration =
        Math.max(
          0,
          requestedDurations[index] ??
            0,
        );

      /*
       * Önceki kısa videolar section'ı
       * erken boşalttıysa son uygun media
       * kalan süreyi doldurmayı dener.
       *
       * Son media kısa bir "advance"
       * videosuysa yine kaynak süresine
       * clamp edilir ve uncovered süre
       * preflight tarafından yakalanır.
       */
      const requestedDurationInFrames =
        isLastItem
          ? Math.max(
              baseRequestedDuration,
              remainingFrames,
            )
          : Math.min(
              baseRequestedDuration,
              remainingFrames,
            );

      const resolvedDurationInFrames =
        item.type === "video"
          ? resolveVideoTimelineDuration({
              media: item,

              fps,

              durationInFrames:
                requestedDurationInFrames,
            })
          : requestedDurationInFrames;

      const durationInFrames =
        Math.min(
          resolvedDurationInFrames,
          remainingFrames,
        );

      if (durationInFrames <= 0) {
        return;
      }

      const startFrame = cursor;

      const endFrame =
        startFrame +
        durationInFrames;

      items.push({
        media: item,

        index,

        startFrame,

        endFrame,

        requestedDurationInFrames,

        durationInFrames,

        shortageInFrames:
          Math.max(
            0,
            requestedDurationInFrames -
              durationInFrames,
          ),

        hasExplicitDuration:
          explicitDurations[index] > 0,
      });

      cursor = endFrame;
    });

    return {
      items,

      sectionDurationInFrames:
        safeSectionDuration,

      totalDurationInFrames:
        cursor,

      uncoveredDurationInFrames:
        Math.max(
          0,
          safeSectionDuration -
            cursor,
        ),
    };
  };

  export const getActiveMediaTimelineItem = (
    timeline: MediaTimeline,
    frame: number,
  ): MediaTimelineItem | undefined =>
    timeline.items.find(
      (item) =>
        frame >= item.startFrame &&
        frame < item.endFrame,
    );

  export const getNextMediaTimelineItem = (
    timeline: MediaTimeline,
    currentItem?: MediaTimelineItem,
  ): MediaTimelineItem | undefined => {
    if (!currentItem) {
      return undefined;
    }

    const currentTimelineIndex =
      timeline.items.indexOf(
        currentItem,
      );

    if (currentTimelineIndex < 0) {
      return undefined;
    }

    return timeline.items[
      currentTimelineIndex + 1
    ];
  };
