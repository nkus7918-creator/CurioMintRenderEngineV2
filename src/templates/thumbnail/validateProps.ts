import type {
    ValidationResult,
  } from "../../types/validation";
  
  import {
    validationFailure,
    validationSuccess,
  } from "../../types/validation";
  
  export const validateThumbnailProps = (
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
  
    if (
      props.backgroundImageUrl !==
        undefined &&
      typeof props.backgroundImageUrl !==
        "string"
    ) {
      return validationFailure(
        "props.backgroundImageUrl must be a string",
      );
    }
  
    if (
      props.theme !== undefined &&
      props.theme !== "documentary" &&
      props.theme !==
        "entertainment"
    ) {
      return validationFailure(
        "props.theme must be documentary or entertainment",
      );
    }
  
    if (
      props.titleAlignment !==
        undefined &&
      props.titleAlignment !== "left" &&
      props.titleAlignment !==
        "center" &&
      props.titleAlignment !==
        "right"
    ) {
      return validationFailure(
        "props.titleAlignment must be left, center or right",
      );
    }
  
    if (
      props.darkenBackground !==
        undefined &&
      (
        typeof props.darkenBackground !==
          "number" ||
        !Number.isFinite(
          props.darkenBackground,
        ) ||
        props.darkenBackground < 0 ||
        props.darkenBackground > 1
      )
    ) {
      return validationFailure(
        "props.darkenBackground must be between 0 and 1",
      );
    }
  
    return validationSuccess();
  };