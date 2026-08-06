import type {
  TemplateDefinition,
} from "../../types/template";

import {
  validateScenesProps,
} from "./validateProps";

export const template:
  TemplateDefinition = {
    id: "curiomint-scenes",

    compositionId:
      "curiomint-scenes",

    width: 1080,

    height: 1920,

    fps: 30,

    renderType: "video",

    supportedSchemaVersions: [
      "1.0",
    ],

    validateProps:
      validateScenesProps,
  };
