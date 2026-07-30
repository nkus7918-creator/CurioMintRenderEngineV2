import type { MediaItem } from "../types";

import { ImageRenderer } from "./ImageRenderer";
import { VideoRenderer } from "./VideoRenderer";

type MediaRendererProps = {
    media: MediaItem;
    fps: number;
    frame: number;
};

const getMediaDurationInFrames = ({
    media,
    fps,
}: {
    media: MediaItem;
    fps: number;
}) => {
    return Math.max(
        1,
        Math.round(
            (media.durationInSeconds ?? 5) * fps,
        ),
    );
};

export const MediaRenderer = ({
    media,
    fps,
    frame,
}: MediaRendererProps) => {
    const durationInFrames =
        getMediaDurationInFrames({
            media,
            fps,
        });

    switch (media.type) {
        case "image":
            return (
                <ImageRenderer
                    media={media}
                    fps={fps}
                    frame={frame}
                    durationInFrames={durationInFrames}
                />
            );

        case "video":
            return (
                <VideoRenderer
                    media={media}
                    fps={fps}
                    frame={frame}
                    durationInFrames={durationInFrames}
                />
            );

        default:
            return null;
    }
};