import type { ValidationResult } from "../../types/validation";
import {
  validationFailure,
  validationSuccess,
} from "../../types/validation";

const mediaTypes = new Set(["video", "image"]);
const mediaMotions = new Set([
  "zoomIn",
  "zoomOut",
  "panLeft",
  "panRight",
  "panUp",
]);

const legacyOptionalStringFields = [
  "hook",
  "setup",
  "surprise",
  "payoff",
  "hookMediaType",
  "hookMediaUrl",
  "hookMediaMotion",
  "setupMediaType",
  "setupMediaUrl",
  "setupMediaMotion",
  "surpriseMediaType",
  "surpriseMediaUrl",
  "surpriseMediaMotion",
  "payoffMediaType",
  "payoffMediaUrl",
  "payoffMediaMotion",
  "hookVideoUrl",
  "setupVideoUrl",
  "surpriseVideoUrl",
  "payoffVideoUrl",
  "hookAudioUrl",
  "setupAudioUrl",
  "surpriseAudioUrl",
  "payoffAudioUrl",
  "headerHook",
  "ctaQuestion",
  "sourceLabel",
  "thumbnailText",
  "logoSrc",
  "audioProfile",
] as const;

const validateDynamicSections = (
  sections: unknown[],
): string | null => {
  if (sections.length === 0) {
    return "props.sections must contain at least one section";
  }

  const ids = new Set<string>();

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];

    if (!section || typeof section !== "object" || Array.isArray(section)) {
      return `props.sections[${index}] must be an object`;
    }

    const record = section as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";

    if (!id) return `props.sections[${index}].id is required`;
    if (ids.has(id)) return `props.sections contains duplicate id "${id}"`;
    ids.add(id);

    if (typeof record.text !== "string" || record.text.trim().length === 0) {
      return `props.sections[${index}].text is required`;
    }

    for (const field of ["role", "highlight", "narrationUrl"] as const) {
      if (record[field] !== undefined && typeof record[field] !== "string") {
        return `props.sections[${index}].${field} must be a string`;
      }
    }

    if (
      record.timing !== undefined &&
      typeof record.timing !== "string" &&
      (typeof record.timing !== "object" || record.timing === null || Array.isArray(record.timing))
    ) {
      return `props.sections[${index}].timing must be an object or JSON string`;
    }

    if (record.media !== undefined && !Array.isArray(record.media)) {
      return `props.sections[${index}].media must be an array`;
    }

    const mediaItems = Array.isArray(record.media) ? record.media : [];

    for (let mediaIndex = 0; mediaIndex < mediaItems.length; mediaIndex += 1) {
      const media = mediaItems[mediaIndex];

      if (!media || typeof media !== "object" || Array.isArray(media)) {
        return `props.sections[${index}].media[${mediaIndex}] must be an object`;
      }

      const mediaRecord = media as Record<string, unknown>;

      if (typeof mediaRecord.url !== "string" || mediaRecord.url.trim().length === 0) {
        return `props.sections[${index}].media[${mediaIndex}].url is required`;
      }

      if (mediaRecord.type !== undefined && !mediaTypes.has(String(mediaRecord.type))) {
        return `props.sections[${index}].media[${mediaIndex}].type must be video or image`;
      }

      if (mediaRecord.motion !== undefined && !mediaMotions.has(String(mediaRecord.motion))) {
        return `props.sections[${index}].media[${mediaIndex}].motion is unsupported`;
      }

      if (mediaRecord.durationInSeconds !== undefined) {
        const duration = Number(mediaRecord.durationInSeconds);

        if (!Number.isFinite(duration) || duration <= 0) {
          return `props.sections[${index}].media[${mediaIndex}].durationInSeconds must be positive`;
        }
      }
    }
  }

  return null;
};

export const validateScenesProps = (
  props: Record<string, unknown>,
): ValidationResult => {
  if (typeof props.title !== "string" || props.title.trim().length === 0) {
    return validationFailure("props.title is required");
  }

  for (const fieldName of legacyOptionalStringFields) {
    const value = props[fieldName];

    if (value !== undefined && typeof value !== "string") {
      return validationFailure(`props.${fieldName} must be a string`);
    }
  }

  if (props.sections !== undefined) {
    if (!Array.isArray(props.sections)) {
      return validationFailure("props.sections must be an array");
    }

    const sectionError = validateDynamicSections(props.sections);
    if (sectionError) return validationFailure(sectionError);
  }

  for (const fieldName of [
    "hookMediaType",
    "setupMediaType",
    "surpriseMediaType",
    "payoffMediaType",
  ] as const) {
    const value = props[fieldName];
    if (value !== undefined && !mediaTypes.has(String(value))) {
      return validationFailure(`props.${fieldName} must be video or image`);
    }
  }

  for (const fieldName of [
    "hookMediaMotion",
    "setupMediaMotion",
    "surpriseMediaMotion",
    "payoffMediaMotion",
  ] as const) {
    const value = props[fieldName];
    if (value !== undefined && !mediaMotions.has(String(value))) {
      return validationFailure(`props.${fieldName} has an unsupported motion`);
    }
  }

  for (const booleanField of ["musicEnabled", "sfxEnabled"] as const) {
    if (props[booleanField] !== undefined && typeof props[booleanField] !== "boolean") {
      return validationFailure(`props.${booleanField} must be a boolean`);
    }
  }

  if (props.musicVolume !== undefined) {
    const musicVolume = Number(props.musicVolume);
    if (!Number.isFinite(musicVolume) || musicVolume < 0 || musicVolume > 1) {
      return validationFailure("props.musicVolume must be between 0 and 1");
    }
  }

  if (props.sfxVolume !== undefined) {
    const sfxVolume = Number(props.sfxVolume);
    if (!Number.isFinite(sfxVolume) || sfxVolume < 0 || sfxVolume > 1) {
      return validationFailure("props.sfxVolume must be between 0 and 1");
    }
  }

  if (props.narrationVolume !== undefined) {
    const narrationVolume = Number(props.narrationVolume);
    if (!Number.isFinite(narrationVolume) || narrationVolume < 0 || narrationVolume > 3) {
      return validationFailure("props.narrationVolume must be between 0 and 3");
    }
  }

  if (
    props.renderPreset !== undefined &&
    props.renderPreset !== "preview" &&
    props.renderPreset !== "final"
  ) {
    return validationFailure("props.renderPreset must be preview or final");
  }

  return validationSuccess();
};
