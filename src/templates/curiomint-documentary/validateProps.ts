import type {
    ValidationResult,
  } from "../../types/validation";
  
  import {
    validationFailure,
    validationSuccess,
  } from "../../types/validation";
  
  import {
    validateDocumentaryAssets,
  } from "../../validation/validateDocumentaryAssets";
  
  import {
    normalizeDocumentarySections,
  } from "./normalizeDocumentarySections";
  
  import type {
    DocumentaryProps,
  } from "./types";
  
  const isNonEmptyString = (
    value: unknown,
  ): value is string =>
    typeof value === "string" &&
    value.trim().length > 0;
  
  const isPositiveNumber = (
    value: unknown,
  ): value is number =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0;
  
  const isNonNegativeNumber = (
    value: unknown,
  ): value is number =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0;
  
  export const validateDocumentaryProps = (
    rawProps: Record<string, unknown>,
  ): ValidationResult => {
    const props =
      rawProps as unknown as DocumentaryProps;
  
    if (!isNonEmptyString(props.title)) {
      return validationFailure(
        "props.title is required",
      );
    }
  
    if (
      rawProps.renderPreset !== undefined &&
      rawProps.renderPreset !==
        "preview" &&
      rawProps.renderPreset !== "final"
    ) {
      return validationFailure(
        "props.renderPreset must be preview or final",
      );
    }
  
    const hasSections =
      Array.isArray(props.sections) &&
      props.sections.length > 0;
  
    const hasChapters =
      Array.isArray(props.chapters) &&
      props.chapters.length > 0;
  
    if (!hasSections && !hasChapters) {
      return validationFailure(
        "Documentary must include at least one section or one chapter",
      );
    }
  
    if (hasChapters) {
      for (
        let chapterIndex = 0;
        chapterIndex <
        props.chapters!.length;
        chapterIndex++
      ) {
        const chapter =
          props.chapters![chapterIndex];
  
        if (
          !chapter ||
          !isNonEmptyString(chapter.id)
        ) {
          return validationFailure(
            `props.chapters[${chapterIndex}].id is required`,
          );
        }
  
        if (
          !isNonEmptyString(
            chapter.title,
          )
        ) {
          return validationFailure(
            `props.chapters[${chapterIndex}].title is required`,
          );
        }
  
        if (
          !Array.isArray(
            chapter.sections,
          ) ||
          chapter.sections.length === 0
        ) {
          return validationFailure(
            `props.chapters[${chapterIndex}].sections must contain at least one section`,
          );
        }
      }
    }
  
    const sections =
      normalizeDocumentarySections({
        chapters: props.chapters,
        sections: props.sections,
      });
  
    for (
      let sectionIndex = 0;
      sectionIndex < sections.length;
      sectionIndex++
    ) {
      const section =
        sections[sectionIndex];
  
      if (
        !section ||
        !isNonEmptyString(section.id)
      ) {
        return validationFailure(
          `documentary section at index ${sectionIndex}.id is required`,
        );
      }
  
      if (
        !isNonEmptyString(
          section.title,
        )
      ) {
        return validationFailure(
          `documentary section at index ${sectionIndex}.title is required`,
        );
      }
  
      if (
        !isPositiveNumber(
          section.durationInSeconds,
        )
      ) {
        return validationFailure(
          `documentary section at index ${sectionIndex}.durationInSeconds must be greater than 0`,
        );
      }
  
      if (
        !Array.isArray(section.media) ||
        section.media.length === 0
      ) {
        return validationFailure(
          `documentary section at index ${sectionIndex}.media must contain at least one item`,
        );
      }
  
      for (
        let mediaIndex = 0;
        mediaIndex <
        section.media.length;
        mediaIndex++
      ) {
        const media =
          section.media[mediaIndex];
  
        if (
          !media ||
          !isNonEmptyString(media.id)
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.id is required`,
          );
        }
  
        if (
          media.type !== "image" &&
          media.type !== "video"
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.type must be image or video`,
          );
        }
  
        if (
          !isNonEmptyString(media.url)
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.url is required`,
          );
        }
  
        if (
          media.durationInSeconds !==
            undefined &&
          !isPositiveNumber(
            media.durationInSeconds,
          )
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.durationInSeconds must be greater than 0`,
          );
        }
  
        if (
          media.startFromSeconds !==
            undefined &&
          !isNonNegativeNumber(
            media.startFromSeconds,
          )
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.startFromSeconds cannot be negative`,
          );
        }
  
        if (
          media.trimEndSeconds !==
            undefined &&
          !isNonNegativeNumber(
            media.trimEndSeconds,
          )
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.trimEndSeconds cannot be negative`,
          );
        }
  
        if (
          media.startFromSeconds !==
            undefined &&
          media.trimEndSeconds !==
            undefined &&
          media.trimEndSeconds <=
            media.startFromSeconds
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.trimEndSeconds must be greater than startFromSeconds`,
          );
        }
  
        if (
          media.shortVideoStrategy !==
            undefined &&
          media.shortVideoStrategy !==
            "advance" &&
          media.shortVideoStrategy !==
            "loop"
        ) {
          return validationFailure(
            `documentary section at index ${sectionIndex}, media index ${mediaIndex}.shortVideoStrategy must be advance or loop`,
          );
        }
      }
    }
  
    const assetValidation =
      validateDocumentaryAssets(props);
  
    if (!assetValidation.valid) {
      return validationFailure(
        assetValidation.message,
      );
    }
  
    return validationSuccess();
  };