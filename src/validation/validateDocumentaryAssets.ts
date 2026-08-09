import type {
  DocumentaryProps,
  MediaItem,
  WikimediaOrientation,
  WikimediaVisualKind,
} from "../templates/curiomint-documentary/types";

import {
  normalizeDocumentarySections,
} from "../templates/curiomint-documentary/normalizeDocumentarySections";

const VALID_WIKIMEDIA_KINDS =
  new Set<WikimediaVisualKind>([
    "person",
    "artifact",
    "building",
    "place",
    "event",
    "general",
  ]);

const VALID_WIKIMEDIA_ORIENTATIONS =
  new Set<WikimediaOrientation>([
    "landscape",
    "portrait",
    "square",
    "any",
  ]);

const isValidUrl = (
  url: unknown,
): url is string =>
  typeof url === "string" &&
  (
    url.startsWith("http://") ||
    url.startsWith("https://")
  );

const validateWikimediaMedia = (
  media: MediaItem,
):
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    } => {
  const config =
    media.wikimedia;

  if (!config) {
    return {
      valid: true,
    };
  }

  if (
    media.type !==
    "image"
  ) {
    return {
      valid: false,
      message:
        "Wikimedia media resolver currently supports image media only",
    };
  }

  if (
    typeof config.query !==
      "string" ||
    config.query.trim()
      .length === 0
  ) {
    return {
      valid: false,
      message:
        "Wikimedia media query must be a non-empty string",
    };
  }

  if (
    config.kind !==
      undefined &&
    !VALID_WIKIMEDIA_KINDS.has(
      config.kind,
    )
  ) {
    return {
      valid: false,
      message:
        `Unsupported Wikimedia media kind "${String(config.kind)}"`,
    };
  }

  if (
    config.preferredOrientation !==
      undefined &&
    !VALID_WIKIMEDIA_ORIENTATIONS.has(
      config.preferredOrientation,
    )
  ) {
    return {
      valid: false,
      message:
        `Unsupported Wikimedia orientation "${String(config.preferredOrientation)}"`,
    };
  }

  return {
    valid: true,
  };
};

export type AssetValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export const validateDocumentaryAssets = (
  props: DocumentaryProps,
): AssetValidationResult => {
  const mediaIds =
    new Set<string>();

  const sectionIds =
    new Set<string>();

  const sections =
    normalizeDocumentarySections({
      chapters:
        props.chapters,

      sections:
        props.sections,
    });

  for (
    let sectionIndex = 0;
    sectionIndex <
    sections.length;
    sectionIndex++
  ) {
    const section =
      sections[sectionIndex];

    if (
      sectionIds.has(
        section.id,
      )
    ) {
      return {
        valid: false,

        message:
          `Duplicate section id "${section.id}" at ` +
          `documentary section index ${sectionIndex}`,
      };
    }

    sectionIds.add(
      section.id,
    );

    if (
      section.narrationUrl &&
      !isValidUrl(
        section.narrationUrl,
      )
    ) {
      return {
        valid: false,

        message:
          `Invalid narration URL at documentary section index ${sectionIndex}`,
      };
    }

    for (
      let mediaIndex = 0;
      mediaIndex <
      section.media.length;
      mediaIndex++
    ) {
      const media =
        section.media[
          mediaIndex
        ];

      const wikimediaValidation =
        validateWikimediaMedia(
          media,
        );

      if (
        !wikimediaValidation.valid
      ) {
        return {
          valid: false,

          message:
            `${wikimediaValidation.message} at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
        };
      }

      /*
       * Normal media must already have a valid HTTP(S) URL.
       *
       * Wikimedia image media may arrive with url: "" because its
       * URL is resolved and replaced before the Remotion render job
       * enters the queue.
       */
      if (
        !isValidUrl(
          media.url,
        ) &&
        !media.wikimedia
      ) {
        return {
          valid: false,

          message:
            `Invalid media URL at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
        };
      }

      if (
        media.fallbackUrl &&
        !isValidUrl(
          media.fallbackUrl,
        )
      ) {
        return {
          valid: false,

          message:
            `Invalid fallback URL at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
        };
      }

      if (
        mediaIds.has(
          media.id,
        )
      ) {
        return {
          valid: false,

          message:
            `Duplicate media id "${media.id}" at documentary section index ${sectionIndex}, media index ${mediaIndex}`,
        };
      }

      mediaIds.add(
        media.id,
      );
    }
  }

  return {
    valid: true,
  };
};