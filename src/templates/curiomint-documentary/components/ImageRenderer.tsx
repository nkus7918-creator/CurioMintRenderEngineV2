import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

import type { MediaItem } from "../types";

interface ImageRendererProps {
  media: MediaItem;
  durationInFrames: number;
  fps?: number;
  frame?: number;
  motion?: string;
}

const getImageSource = (media: MediaItem): string => {
  if (typeof media.url === "string" && media.url.trim().length > 0) {
    return media.url;
  }

  if (
    typeof media.fallbackUrl === "string" &&
    media.fallbackUrl.trim().length > 0
  ) {
    return media.fallbackUrl;
  }

  return "";
};

const DOCUMENT_LIKE_WIKIMEDIA_QUERY =
  /\b(manuscript|document|page|scan|book|newspaper|parchment|codex|charter|statute|ordinance|decree|legal)\b/i;

const getSourceAspectRatio = (media: MediaItem): number | null => {
  const explicit = Number(media.sourceAspectRatio);

  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const width = Number(media.sourceWidth);

  const height = Number(media.sourceHeight);

  if (
    Number.isFinite(width) &&
    width > 0 &&
    Number.isFinite(height) &&
    height > 0
  ) {
    return width / height;
  }

  return null;
};

const shouldUseFramedWikimediaLayout = (media: MediaItem): boolean => {
  if (!media.wikimedia) {
    return false;
  }

  /*
   * Portraits must never be fullscreen-cropped.
   */
  if (media.wikimedia.kind === "person") {
    return true;
  }

  /*
   * Manuscripts, statutes, documents and similar
   * archival material must preserve the whole page,
   * even when the source itself is landscape-ish.
   */
  if (DOCUMENT_LIKE_WIKIMEDIA_QUERY.test(String(media.wikimedia.query ?? ""))) {
    return true;
  }

  /*
   * Any genuinely portrait-oriented Wikimedia
   * visual gets the same safe treatment.
   *
   * Example:
   * 1600 x 2008 manuscript illustration.
   */
  const aspectRatio = getSourceAspectRatio(media);

  return aspectRatio !== null && aspectRatio < 0.95;
};

const getKenBurnsDirection = (id: string): "left" | "right" | "center" => {
  const hash = Array.from(id).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  const directions: Array<"left" | "right" | "center"> = [
    "left",
    "right",
    "center",
  ];

  return directions[hash % directions.length];
};

const buildStandardTransform = (
  media: MediaItem,
  frame: number,
  durationInFrames: number,
): string => {
  const safeDuration = Math.max(1, durationInFrames);

  const direction = getKenBurnsDirection(media.id);

  const zoom = interpolate(frame, [0, safeDuration], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX =
    direction === "left"
      ? interpolate(frame, [0, safeDuration], [3, -3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : direction === "right"
        ? interpolate(frame, [0, safeDuration], [-3, 3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 0;

  const translateY = interpolate(frame, [0, safeDuration], [2, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return `scale(${zoom}) translate(${translateX}%, ${translateY}%)`;
};

const buildPersonTransform = (
  frame: number,
  durationInFrames: number,
): string => {
  const safeDuration = Math.max(1, durationInFrames);

  const zoom = interpolate(frame, [0, safeDuration], [1, 1.018], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return `scale(${zoom})`;
};

export const ImageRenderer = ({
  media,
  durationInFrames,
}: ImageRendererProps) => {
  const frame = useCurrentFrame();

  const src = getImageSource(media);

  if (!src) {
    return null;
  }

  const safeDuration = Math.max(1, durationInFrames);

  const fadeInEnd = Math.min(10, safeDuration * 0.2);

  const fadeOutStart = Math.max(fadeInEnd, safeDuration - 10);

  const opacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, safeDuration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const isWikimediaPerson = media.wikimedia?.kind === "person";

  const useFramedWikimediaLayout = shouldUseFramedWikimediaLayout(media);

  if (useFramedWikimediaLayout) {
    const backgroundZoom = interpolate(frame, [0, safeDuration], [1.08, 1.13], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const personTransform = buildPersonTransform(frame, safeDuration);

    return (
      <AbsoluteFill
        style={{
          opacity,
          overflow: "hidden",
          backgroundColor: "#05070b",
        }}
      >
        <Img
          src={src}
          style={{
            position: "absolute",
            inset: -60,
            width: "calc(100% + 120px)",
            height: "calc(100% + 120px)",
            objectFit: "cover",
            filter: "blur(36px) brightness(0.32) saturate(0.85)",
            transform: `scale(${backgroundZoom})`,
            transformOrigin: "center center",
          }}
        />

        <AbsoluteFill
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.32), rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.32))",
          }}
        />

        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.30))",
          }}
        />

        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 50,
            paddingBottom: 50,
            paddingLeft: 120,
            paddingRight: 120,
          }}
        >
          <Img
            src={src}
            style={{
              width: "auto",
              height: isWikimediaPerson ? "90%" : "86%",
              maxWidth: isWikimediaPerson ? "58%" : "78%",
              maxHeight: isWikimediaPerson ? "90%" : "86%",
              objectFit: "contain",
              objectPosition: "center center",
              borderRadius: isWikimediaPerson ? 22 : 14,
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const transform = buildStandardTransform(media, frame, safeDuration);

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};

export default ImageRenderer;
