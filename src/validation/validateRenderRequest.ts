import {
    CURRENT_RENDER_SCHEMA_VERSION,
  } from "../types/render";

  import type {
    RenderRequest,
    RenderRequestValidationResult,
  } from "../types/render";

  const isRecord = (
    value: unknown,
  ): value is Record<string, unknown> =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);

  export const validateRenderRequest = (
    body: unknown,
  ): RenderRequestValidationResult => {
    if (!isRecord(body)) {
      return {
        valid: false,
        message:
          "Request body must be a JSON object",
      };
    }

    const templateId =
      body.templateId;

    if (
      typeof templateId !== "string" ||
      templateId.trim().length === 0
    ) {
      return {
        valid: false,
        message:
          "templateId is required",
      };
    }

    if (!isRecord(body.props)) {
      return {
        valid: false,
        message:
          "props must be a JSON object",
      };
    }

    const rawSchemaVersion =
      body.schemaVersion;

    /*
     * Eski payload'larÄ±n hemen bozulmamasÄ±
     * iÃ§in eksik sÃ¼rÃ¼m geÃ§ici olarak 1.0
     * kabul edilir.
     *
     * n8n profesyonelleÅŸtirme aÅŸamasÄ±nda
     * schemaVersion zorunlu yapÄ±lacaktÄ±r.
     */
    const schemaVersion =
      rawSchemaVersion === undefined
        ? CURRENT_RENDER_SCHEMA_VERSION
        : rawSchemaVersion;

    if (
      typeof schemaVersion !== "string" ||
      schemaVersion.trim().length === 0
    ) {
      return {
        valid: false,
        message:
          "schemaVersion must be a non-empty string",
      };
    }

    const request: RenderRequest = {
      schemaVersion:
        schemaVersion.trim(),

      templateId:
        templateId.trim(),

      props: body.props,
    };

    return {
      valid: true,
      request,
    };
  };
