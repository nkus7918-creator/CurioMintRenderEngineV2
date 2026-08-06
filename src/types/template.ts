import type {
  ValidationResult,
} from "./validation";

export type RenderType =
  | "video"
  | "still";

export interface TemplateDefinition {
  id: string;

  compositionId: string;

  width: number;

  height: number;

  fps: number;

  renderType: RenderType;

  /*
   * Template'in kabul ettiÄŸi API payload
   * contract sÃ¼rÃ¼mleri.
   */
  supportedSchemaVersions:
    readonly string[];

  /*
   * Template'e Ã¶zel props doÄŸrulamasÄ±.
   *
   * Controller veya genel validator,
   * Documentary / Shorts / Thumbnail
   * detaylarÄ±nÄ± bilmez.
   */
  validateProps: (
    props: Record<string, unknown>,
  ) => ValidationResult;
}
