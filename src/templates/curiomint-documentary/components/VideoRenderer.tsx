import { OffthreadVideo } from "remotion";

import type { MediaItem } from "../types";

type VideoRendererProps = {
  media: MediaItem;
  fps: number;
};

export const VideoRenderer = ({
  media,
  fps,
}: VideoRendererProps) => {
  const trimBefore = Math.round(
    (media.startFromSeconds ?? 0) * fps,
  );

  const trimAfter =
    media.durationInSeconds !== undefined
      ? trimBefore +
        Math.round(media.durationInSeconds * fps)
      : undefined;

  return (
    <OffthreadVideo
      src={media.url}
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      muted={media.muted ?? true}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};