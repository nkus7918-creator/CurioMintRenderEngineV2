import type {
  TemplateDefinition,
} from "../../types/template";

import {
  validateThumbnailProps,
} from "./validateProps";

export const template:
  TemplateDefinition = {
    id: "orven-thumbnail",

    compositionId:
      "orven-thumbnail",

    width: 1280,

    height: 720,

    fps: 30,

    renderType: "still",

    supportedSchemaVersions: [
      "1.0",
    ],

    validateProps:
      validateThumbnailProps,
  };
