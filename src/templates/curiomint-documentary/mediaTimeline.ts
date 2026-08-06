import type {
    MediaItem,
  } from "./types";

  export type MediaTimelineItem = {
    media: MediaItem;

    index: number;

    startFrame: number;

    endFrame: number;

    /*
     * Media item'Ä±n payload veya otomatik
     * daÄŸÄ±tÄ±m sonucunda talep ettiÄŸi sÃ¼re.
     *
     * Section sonuna gelindiÄŸinde gerÃ§ek
     * durationInFrames bundan kÄ±sa olabilir.
     */
    requestedDurationInFrames: number;

    /*
     * Sequence, renderer, motion ve transition
     * katmanlarÄ±nÄ±n kullanacaÄŸÄ± tek gerÃ§ek sÃ¼re.
     */
    durationInFrames: number;

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

    /*
     * BÃ¼tÃ¼n media item'larÄ±n aÃ§Ä±k sÃ¼resi varsa
     * fakat toplam sÃ¼re section'dan kÄ±saysa,
     * siyah boÅŸluk bÄ±rakmamak iÃ§in kalan sÃ¼re
     * son media item'a verilir.
     *
     * Kaynak videonun bu sÃ¼reyi karÅŸÄ±layÄ±p
     * karÅŸÄ±lamadÄ±ÄŸÄ± sonraki preflight aÅŸamasÄ±nda
     * doÄŸrulanacaktÄ±r.
     */
    if (automaticItemCount === 0) {
      const requestedTotal =
        requestedDurations.reduce(
          (total, duration) =>
            total + duration,
          0,
        );

      const uncoveredFrames =
        Math.max(
          0,
          safeSectionDuration -
            requestedTotal,
        );

      if (uncoveredFrames > 0) {
        const lastIndex =
          requestedDurations.length - 1;

        requestedDurations[lastIndex] +=
          uncoveredFrames;
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

      const requestedDurationInFrames =
        Math.max(
          0,
          requestedDurations[index] ??
            0,
        );

      const durationInFrames =
        Math.min(
          requestedDurationInFrames,
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
