import type { MediaItem } from "./types";

export type MediaTimelineItem = {
    media: MediaItem;
    index: number;
    startFrame: number;
    endFrame: number;
    durationInFrames: number;
};

type CreateMediaTimelineInput = {
    media: MediaItem[];
    sectionDurationInFrames: number;
    fps: number;
};

const secondsToFrames = (
    seconds: number | undefined,
    fps: number,
): number => {
    if (
        typeof seconds !== "number" ||
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {
        return 0;
    }

    return Math.max(1, Math.ceil(seconds * fps));
};

export const createMediaTimeline = ({
    media,
    sectionDurationInFrames,
    fps,
}: CreateMediaTimelineInput): MediaTimelineItem[] => {
    if (
        media.length === 0 ||
        sectionDurationInFrames <= 0
    ) {
        return [];
    }

    const explicitDurationInFrames = media.reduce(
        (total, item) =>
            total +
            secondsToFrames(item.durationInSeconds, fps),
        0,
    );

    const itemsWithoutDuration = media.filter(
        (item) =>
            secondsToFrames(item.durationInSeconds, fps) === 0,
    ).length;

    const remainingDurationInFrames = Math.max(
        0,
        sectionDurationInFrames -
        explicitDurationInFrames,
    );

    const automaticDurationInFrames =
        itemsWithoutDuration > 0
            ? Math.floor(
                remainingDurationInFrames /
                itemsWithoutDuration,
            )
            : 0;

    const timeline: MediaTimelineItem[] = [];
    let cursor = 0;

    media.forEach((item, index) => {
        const explicitDuration = secondsToFrames(
            item.durationInSeconds,
            fps,
        );

        const isLastItem = index === media.length - 1;

        const durationInFrames = isLastItem
            ? Math.max(
                0,
                sectionDurationInFrames - cursor,
            )
            : explicitDuration ||
            automaticDurationInFrames;

        if (durationInFrames <= 0) {
            return;
        }

        const startFrame = cursor;
        const endFrame = Math.min(
            sectionDurationInFrames,
            startFrame + durationInFrames,
        );

        timeline.push({
            media: item,
            index,
            startFrame,
            endFrame,
            durationInFrames: endFrame - startFrame,
        });

        cursor = endFrame;
    });

    return timeline;
};

export const getActiveMediaTimelineItem = (
    timeline: MediaTimelineItem[],
    frame: number,
) => {
    return timeline.find(
        (item) =>
            frame >= item.startFrame &&
            frame < item.endFrame,
    );
};
export const getNextMediaTimelineItem = (
    timeline: MediaTimelineItem[],
    currentItem?: MediaTimelineItem,
) => {
    if (!currentItem) {
        return undefined;
    }

    return timeline.find(
        (item) => item.index === currentItem.index + 1,
    );
};