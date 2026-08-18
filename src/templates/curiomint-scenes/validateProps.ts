import type {
  ValidationResult,
} from "../../types/validation";

import {
  validationFailure,
  validationSuccess,
} from "../../types/validation";

const optionalStringFields = [
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
] as const;

export const validateScenesProps = (
  props: Record<string, unknown>,
): ValidationResult => {
  if (
    typeof props.title !== "string" ||
    props.title.trim().length === 0
  ) {
    return validationFailure(
      "props.title is required",
    );
  }

  for (const fieldName of optionalStringFields) {
    const value = props[fieldName];

    if (
      value !== undefined &&
      typeof value !== "string"
    ) {
      return validationFailure(
        `props.${fieldName} must be a string`,
      );
    }
  }

  const mediaTypeFields = [
    "hookMediaType",
    "setupMediaType",
    "surpriseMediaType",
    "payoffMediaType",
  ] as const;

  for (const fieldName of mediaTypeFields) {
    const value = props[fieldName];

    if (
      value !== undefined &&
      value !== "video" &&
      value !== "image"
    ) {
      return validationFailure(
        `props.${fieldName} must be video or image`,
      );
    }
  }

  const mediaMotionFields = [
    "hookMediaMotion",
    "setupMediaMotion",
    "surpriseMediaMotion",
    "payoffMediaMotion",
  ] as const;

  for (const fieldName of mediaMotionFields) {
    const value = props[fieldName];

    if (
      value !== undefined &&
      value !== "zoomIn" &&
      value !== "zoomOut" &&
      value !== "panLeft" &&
      value !== "panRight" &&
      value !== "panUp"
    ) {
      return validationFailure(
        `props.${fieldName} has an unsupported motion`,
      );
    }
  }

  if (
    props.renderPreset !== undefined &&
    props.renderPreset !== "preview" &&
    props.renderPreset !== "final"
  ) {
    return validationFailure(
      "props.renderPreset must be preview or final",
    );
  }

  return validationSuccess();
};
