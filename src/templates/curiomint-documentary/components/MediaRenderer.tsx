import type { MediaItem } from "../types";

import { ImageRenderer } from "./ImageRenderer";
import { VideoRenderer } from "./VideoRenderer";

type MediaRendererProps = {
  media: MediaItem;
  fps: number;
  frame: number;
};

export const MediaRenderer = ({
  media,
  fps,
  frame,
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