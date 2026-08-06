export const CURRENT_RENDER_SCHEMA_VERSION =
  "1.0" as const;

export type RenderSchemaVersion =
  typeof CURRENT_RENDER_SCHEMA_VERSION;

export interface RenderRequest {
  /*
   * API contract sÃ¼rÃ¼mÃ¼dÃ¼r.
   *
   * GeÃ§iÅŸ sÃ¼resince eksik gÃ¶nderilirse
   * validateRenderRequest tarafÄ±ndan
   * CURRENT_RENDER_SCHEMA_VERSION atanÄ±r.
   */
  schemaVersion: string;

  templateId: string;

  props: Record<string, unknown>;
}

export type RenderRequestValidationResult =
  | {
      valid: true;
      request: RenderRequest;
    }
  | {
      valid: false;
      message: string;
    };
