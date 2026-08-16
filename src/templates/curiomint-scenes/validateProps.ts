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
