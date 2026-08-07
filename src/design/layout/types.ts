export type LayoutPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type LayoutInsets = {
  top: number;

  right: number;

  bottom: number;

  left: number;
};

export type LayoutPreset = {
  name: string;

  designWidth: number;

  designHeight: number;

  columns: number;

  gutter: number;

  safeAreas: Readonly<
    Record<string, LayoutInsets>
  >;
};

export type LayoutCanvasMetrics = {
  scale: number;

  scaledWidth: number;

  scaledHeight: number;

  offsetX: number;

  offsetY: number;
};

export type LayoutSafeAreaRect = {
  x: number;

  y: number;

  width: number;

  height: number;
};

export type LayoutGridMetrics = {
  columns: number;

  gutter: number;

  containerWidth: number;

  totalGutterWidth: number;

  columnWidth: number;
};