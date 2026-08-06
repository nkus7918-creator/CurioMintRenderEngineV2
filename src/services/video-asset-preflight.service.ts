import fs from "fs/promises";
import path from "path";

import { getVideoMetadata } from "@remotion/renderer";

import { logger } from "../shared/logger";

const MEDIA_CACHE_ABSOLUTE_DIR = path.resolve("/app/media-cache");

const MINIMUM_VIDEO_FILE_SIZE_BYTES = 10_000;

const MINIMUM_USABLE_WINDOW_SECONDS = 0.25;

const TRIM_DURATION_TOLERANCE_SECONDS = 0.1;

type MediaLike = {
  id?: unknown;

  type?: unknown;

  url?: unknown;

  durationInSeconds?: unknown;

  startFromSeconds?: unknown;

  trimEndSeconds?: unknown;

  shortVideoStrategy?: unknown;

  [key: string]: unknown;
};

type SectionLike = {
  media?: unknown;

  [key: string]: unknown;
};

type PropsLike = {
  sections?: unknown;

  chapters?: unknown;

  [key: string]: unknown;
};

type VideoMediaReference = {
  media: MediaLike;

  location: string;
};

export type VideoAssetPreflightWarningCode =
  | "low-resolution"
  | "low-fps"
  | "portrait-video"
  | "non-seekable"
  | "shorter-than-requested";

export type VideoAssetPreflightWarning = {
  mediaId: string;

  location: string;

  code: VideoAssetPreflightWarningCode;

  message: string;
};

export type VideoAssetMetadata = {
  durationInSeconds: number;

  width: number;

  height: number;

  fps: number;

  codec: string;

  aspectRatio: number;

  supportsSeeking: boolean;

  hasAudio: boolean;

  fileSizeBytes: number;
};

export type VideoAssetPreflightResult = {
  props: Record<string, unknown>;

  inspectedVideoCount: number;

  uniqueFileCount: number;

  warningCount: number;

  warnings: VideoAssetPreflightWarning[];
};

export class VideoAssetPreflightError extends Error {
  public readonly mediaId: string;

  public readonly location: string;

  constructor({
    mediaId,
    location,
    message,
  }: {
    mediaId: string;

    location: string;

    message: string;
  }) {
    super(
      `Video asset preflight failed for "${mediaId}" at ${location}: ${message}`,
    );

    this.name = "VideoAssetPreflightError";

    this.mediaId = mediaId;

    this.location = location;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRemoteHttpUrl = (value: string): boolean =>
  value.startsWith("https://") || value.startsWith("http://");

const roundNumber = (value: number, decimals = 6): number => {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
};

const getMediaId = (media: MediaLike, location: string): string =>
  typeof media.id === "string" && media.id.trim().length > 0
    ? media.id
    : location;

const readOptionalNonNegativeNumber = ({
  value,
  fieldName,
  mediaId,
  location,
}: {
  value: unknown;

  fieldName: string;

  mediaId: string;

  location: string;
}): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new VideoAssetPreflightError({
      mediaId,

      location,

      message: `"${fieldName}" must be a finite non-negative number.`,
    });
  }

  return value;
};

const collectVideoMediaReferences = (
  props: PropsLike,
): VideoMediaReference[] => {
  const references: VideoMediaReference[] = [];

  const inspectSections = (sections: unknown, locationPrefix: string): void => {
    if (!Array.isArray(sections)) {
      return;
    }

    sections.forEach((sectionValue, sectionIndex) => {
      if (!isRecord(sectionValue)) {
        return;
      }

      const section = sectionValue as SectionLike;

      if (!Array.isArray(section.media)) {
        return;
      }

      section.media.forEach((mediaValue, mediaIndex) => {
        if (!isRecord(mediaValue)) {
          return;
        }

        const media = mediaValue as MediaLike;

        if (media.type !== "video") {
          return;
        }

        references.push({
          media,

          location:
            `${locationPrefix}[${sectionIndex}]` + `.media[${mediaIndex}]`,
        });
      });
    });
  };

  inspectSections(props.sections, "sections");

  if (Array.isArray(props.chapters)) {
    props.chapters.forEach((chapterValue, chapterIndex) => {
      if (!isRecord(chapterValue)) {
        return;
      }

      inspectSections(
        chapterValue.sections,

        `chapters[${chapterIndex}].sections`,
      );
    });
  }

  return references;
};

const resolveLocalVideoPath = (videoUrl: string): string => {
  const normalizedUrl = videoUrl.trim();

  if (!normalizedUrl) {
    throw new Error("Video URL is empty.");
  }

  if (path.isAbsolute(normalizedUrl)) {
    return normalizedUrl;
  }

  if (isRemoteHttpUrl(normalizedUrl)) {
    const parsedUrl = new URL(normalizedUrl);

    const isLocalCacheHost =
      parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost";

    const isMediaCachePath = parsedUrl.pathname.startsWith("/media-cache/");

    if (!isLocalCacheHost || !isMediaCachePath) {
      throw new Error(
        "Remote video was not cached. Render cannot continue with an unverified remote video.",
      );
    }

    const decodedPath = decodeURIComponent(parsedUrl.pathname);

    const fileName = path.basename(decodedPath);

    if (!fileName || fileName === "." || fileName === path.sep) {
      throw new Error("Cached video filename could not be resolved.");
    }

    return path.join(MEDIA_CACHE_ABSOLUTE_DIR, fileName);
  }

  const publicRelativePath = normalizedUrl
    .replace(/^[/\\]+/, "")
    .replace(/^public[/\\]/, "");

  return path.resolve(process.cwd(), "public", publicRelativePath);
};

const inspectLocalVideo = async (
  localPath: string,
): Promise<VideoAssetMetadata> => {
  const fileStat = await fs.stat(localPath);

  if (!fileStat.isFile()) {
    throw new Error(`Resolved asset is not a file: ${localPath}`);
  }

  if (fileStat.size < MINIMUM_VIDEO_FILE_SIZE_BYTES) {
    throw new Error(
      `Video file is unexpectedly small: ${fileStat.size} bytes.`,
    );
  }

  const metadata = await getVideoMetadata(localPath, {
    logLevel: "error",
  });

  const durationInSeconds = metadata.durationInSeconds;

  if (
    durationInSeconds === null ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds <= 0
  ) {
    throw new Error("Video duration is invalid.");
  }

  if (
    !Number.isFinite(metadata.width) ||
    metadata.width <= 0 ||
    !Number.isFinite(metadata.height) ||
    metadata.height <= 0
  ) {
    throw new Error("Video dimensions are invalid.");
  }

  if (!Number.isFinite(metadata.fps) || metadata.fps <= 0) {
    throw new Error("Video FPS is invalid.");
  }

  if (metadata.codec === "unknown") {
    throw new Error("Video codec is unsupported or unknown.");
  }

  return {
    durationInSeconds: roundNumber(durationInSeconds),

    width: metadata.width,

    height: metadata.height,

    fps: roundNumber(metadata.fps),

    codec: metadata.codec,

    aspectRatio: roundNumber(metadata.width / metadata.height),

    supportsSeeking: metadata.supportsSeeking,

    hasAudio: metadata.audioCodec !== null,

    fileSizeBytes: fileStat.size,
  };
};

const validateTrimWindow = ({
  media,
  metadata,
  mediaId,
  location,
}: {
  media: MediaLike;

  metadata: VideoAssetMetadata;

  mediaId: string;

  location: string;
}): number => {
  const startFromSeconds =
    readOptionalNonNegativeNumber({
      value: media.startFromSeconds,

      fieldName: "startFromSeconds",

      mediaId,

      location,
    }) ?? 0;

  const requestedTrimEndSeconds = readOptionalNonNegativeNumber({
    value: media.trimEndSeconds,

    fieldName: "trimEndSeconds",

    mediaId,

    location,
  });

  if (startFromSeconds >= metadata.durationInSeconds) {
    throw new VideoAssetPreflightError({
      mediaId,

      location,

      message: `startFromSeconds (${startFromSeconds}) must be lower than the source duration (${metadata.durationInSeconds}).`,
    });
  }

  let normalizedTrimEndSeconds = requestedTrimEndSeconds;

  if (normalizedTrimEndSeconds !== undefined) {
    if (
      normalizedTrimEndSeconds >
      metadata.durationInSeconds + TRIM_DURATION_TOLERANCE_SECONDS
    ) {
      throw new VideoAssetPreflightError({
        mediaId,

        location,

        message: `trimEndSeconds (${normalizedTrimEndSeconds}) exceeds the source duration (${metadata.durationInSeconds}).`,
      });
    }

    normalizedTrimEndSeconds = Math.min(
      normalizedTrimEndSeconds,
      metadata.durationInSeconds,
    );

    if (normalizedTrimEndSeconds <= startFromSeconds) {
      throw new VideoAssetPreflightError({
        mediaId,

        location,

        message: "trimEndSeconds must be greater than startFromSeconds.",
      });
    }

    media.trimEndSeconds = roundNumber(normalizedTrimEndSeconds);
  }

  const playableEndSeconds =
    normalizedTrimEndSeconds ?? metadata.durationInSeconds;

  const availableDurationInSeconds = playableEndSeconds - startFromSeconds;

  if (availableDurationInSeconds < MINIMUM_USABLE_WINDOW_SECONDS) {
    throw new VideoAssetPreflightError({
      mediaId,

      location,

      message: `Playable video window is too short: ${roundNumber(
        availableDurationInSeconds,
      )} seconds.`,
    });
  }

  return roundNumber(availableDurationInSeconds);
};

const createWarnings = ({
  media,
  metadata,
  availableDurationInSeconds,
  mediaId,
  location,
}: {
  media: MediaLike;

  metadata: VideoAssetMetadata;

  availableDurationInSeconds: number;

  mediaId: string;

  location: string;
}): VideoAssetPreflightWarning[] => {
  const warnings: VideoAssetPreflightWarning[] = [];

  const shorterDimension = Math.min(metadata.width, metadata.height);

  const longerDimension = Math.max(metadata.width, metadata.height);

  if (shorterDimension < 720 || longerDimension < 1280) {
    warnings.push({
      mediaId,

      location,

      code: "low-resolution",

      message: `Video resolution is ${metadata.width}x${metadata.height}; recommended minimum is 1280x720.`,
    });
  }

  if (metadata.fps < 23.5) {
    warnings.push({
      mediaId,

      location,

      code: "low-fps",

      message: `Video FPS is ${metadata.fps}; recommended minimum is 24 FPS.`,
    });
  }

  if (metadata.width < metadata.height) {
    warnings.push({
      mediaId,

      location,

      code: "portrait-video",

      message:
        "Portrait video will require aggressive cropping in a 16:9 documentary composition.",
    });
  }

  if (!metadata.supportsSeeking) {
    warnings.push({
      mediaId,

      location,

      code: "non-seekable",

      message: "Video may seek slowly or unreliably during rendering.",
    });
  }

  const requestedDuration = readOptionalNonNegativeNumber({
    value: media.durationInSeconds,

    fieldName: "durationInSeconds",

    mediaId,

    location,
  });

  const strategy = media.shortVideoStrategy === "loop" ? "loop" : "advance";

  if (
    requestedDuration !== undefined &&
    requestedDuration > availableDurationInSeconds &&
    strategy !== "loop"
  ) {
    warnings.push({
      mediaId,

      location,

      code: "shorter-than-requested",

      message: `Video provides ${availableDurationInSeconds} seconds but the timeline requests ${requestedDuration} seconds. The next media item will start early.`,
    });
  }

  return warnings;
};

export const preflightVideoAssets = async (
  props: Record<string, unknown>,
  jobId: string,
): Promise<VideoAssetPreflightResult> => {
  const preflightLogger = logger.child({
    jobId,

    component: "video-asset-preflight",
  });

  const clonedProps = structuredClone(props) as PropsLike;

  const videoReferences = collectVideoMediaReferences(clonedProps);

  if (videoReferences.length === 0) {
    return {
      props: clonedProps as Record<string, unknown>,

      inspectedVideoCount: 0,

      uniqueFileCount: 0,

      warningCount: 0,

      warnings: [],
    };
  }

  preflightLogger.info(
    {
      event: "video-preflight.started",

      videoCount: videoReferences.length,
    },
    "Video asset preflight started",
  );

  const metadataCache = new Map<string, VideoAssetMetadata>();

  const warnings: VideoAssetPreflightWarning[] = [];

  for (const reference of videoReferences) {
    const mediaId = getMediaId(reference.media, reference.location);

    if (
      typeof reference.media.url !== "string" ||
      reference.media.url.trim().length === 0
    ) {
      throw new VideoAssetPreflightError({
        mediaId,

        location: reference.location,

        message: "Video URL is missing.",
      });
    }

    let localPath: string;

    try {
      localPath = resolveLocalVideoPath(reference.media.url);
    } catch (error) {
      throw new VideoAssetPreflightError({
        mediaId,

        location: reference.location,

        message:
          error instanceof Error
            ? error.message
            : "Video path could not be resolved.",
      });
    }

    let metadata = metadataCache.get(localPath);

    if (!metadata) {
      try {
        metadata = await inspectLocalVideo(localPath);
      } catch (error) {
        throw new VideoAssetPreflightError({
          mediaId,

          location: reference.location,

          message:
            error instanceof Error
              ? error.message
              : "Video metadata could not be read.",
        });
      }

      metadataCache.set(localPath, metadata);
    }

    reference.media.sourceDurationInSeconds = metadata.durationInSeconds;

    reference.media.sourceWidth = metadata.width;

    reference.media.sourceHeight = metadata.height;

    reference.media.sourceFps = metadata.fps;

    reference.media.sourceCodec = metadata.codec;

    reference.media.sourceAspectRatio = metadata.aspectRatio;

    reference.media.sourceSupportsSeeking = metadata.supportsSeeking;

    reference.media.sourceHasAudio = metadata.hasAudio;

    reference.media.sourceFileSizeBytes = metadata.fileSizeBytes;

    const availableDurationInSeconds = validateTrimWindow({
      media: reference.media,

      metadata,

      mediaId,

      location: reference.location,
    });

    const mediaWarnings = createWarnings({
      media: reference.media,

      metadata,

      availableDurationInSeconds,

      mediaId,

      location: reference.location,
    });

    warnings.push(...mediaWarnings);

    preflightLogger.info(
      {
        event: "video-preflight.asset-ready",

        mediaId,

        location: reference.location,

        durationInSeconds: metadata.durationInSeconds,

        width: metadata.width,

        height: metadata.height,

        fps: metadata.fps,

        codec: metadata.codec,

        supportsSeeking: metadata.supportsSeeking,

        warningCodes: mediaWarnings.map((warning) => warning.code),
      },
      "Video asset passed preflight",
    );
  }

  const result: VideoAssetPreflightResult = {
    props: clonedProps as Record<string, unknown>,

    inspectedVideoCount: videoReferences.length,

    uniqueFileCount: metadataCache.size,

    warningCount: warnings.length,

    warnings,
  };

  preflightLogger.info(
    {
      event: "video-preflight.completed",

      inspectedVideoCount: result.inspectedVideoCount,

      uniqueFileCount: result.uniqueFileCount,

      warningCount: result.warningCount,
    },
    "Video asset preflight completed",
  );

  return result;
};
