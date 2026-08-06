export type RenderType = "video" | "still";

export interface TemplateDefinition {
  id: string;

  compositionId: string;

  width: number;

  height: number;

  fps: number;

  renderType: RenderType;
}
