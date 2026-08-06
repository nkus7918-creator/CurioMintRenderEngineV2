import type {
  TemplateDefinition,
} from "../../types/template";

import {
  validateDocumentaryProps,
} from "./validateProps";

export const template:
  TemplateDefinition = {
    id:
      "curiomint-documentary",

    compositionId:
      "curiomint-documentary",

    width: 1920,

    height: 1080,

    fps: 30,

    renderType: "video",

    supportedSchemaVersions: [
      "1.0",
    ],

    validateProps:
      validateDocumentaryProps,
  };
