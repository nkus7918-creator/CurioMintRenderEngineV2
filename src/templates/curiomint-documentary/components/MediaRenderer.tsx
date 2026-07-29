import type { MediaItem } from "../types";

import { ImageRenderer } from "./ImageRenderer";
import { VideoRenderer } from "./VideoRenderer";

type MediaRendererProps = {
  media: MediaItem;
  fps: number;
};

export const MediaRenderer = ({
  media,
  fps,
}: MediaRendererProps) => {
  const durationInFrames = Math.max(
    1,
    Math.round(
      (media.durationInSeconds ?? 5) * fps,
    ),
  );

  switch (media.type) {
    case "image":
      return (
        <ImageRenderer
          media={media}
          durationInFrames={durationInFrames}
        />
      );

    case "video":
      return (
        <VideoRenderer
          media={media}
          fps={fps}
        />
      );

    default:
      return null;
  }
};