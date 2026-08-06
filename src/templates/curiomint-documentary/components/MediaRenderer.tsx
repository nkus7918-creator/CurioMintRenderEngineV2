import type {
    MediaItem,
  } from "../types";

  import {
    ImageRenderer,
  } from "./ImageRenderer";

  import {
    VideoRenderer,
  } from "./VideoRenderer";

  type MediaRendererProps = {
    media: MediaItem;

    fps: number;

    frame: number;

    /*
     * Bu deÄŸer yalnÄ±zca media timeline
     * tarafÄ±ndan belirlenir.
     *
     * Renderer media.durationInSeconds
     * Ã¼zerinden tekrar sÃ¼re hesaplamaz.
     */
    durationInFrames: number;
  };

  export const MediaRenderer = ({
    media,
    fps,
    frame,
    durationInFrames,
  }: MediaRendererProps) => {
    const safeDurationInFrames =
      Math.max(
        1,
        durationInFrames,
      );

    switch (media.type) {
      case "image":
        return (
          <ImageRenderer
            media={media}
            fps={fps}
            frame={frame}
            durationInFrames={
              safeDurationInFrames
            }
          />
        );

      case "video":
        return (
          <VideoRenderer
            media={media}
            fps={fps}
            frame={frame}
            durationInFrames={
              safeDurationInFrames
            }
          />
        );

      default:
        return null;
    }
  };
