export type HistoricalMapViewport = {
  /**
   * Normalized position on the shared 1200x600 world canvas.
   */
  centerX: number;
  centerY: number;

  /**
   * 1 = full world. Higher values create a regional crop.
   */
  zoom: number;
};

export type HistoricalMapConfig = {
  /**
   * Human-readable Cliopatria entity query.
   * Example: "Roman Empire".
   */
  entity: string;

  /**
   * Integer year used by Cliopatria.
   * Negative = BCE, positive = CE.
   */
  year: number;

  title?: string;
  subtitle?: string;

  /**
   * Filled automatically by the render engine.
   */
  mapUrl?: string;
  resolvedName?: string;
  fromYear?: number;
  toYear?: number;
  areaKm2?: number;
  sourceCredit?: string;
  viewport?: HistoricalMapViewport;
  unresolvedReason?: string;
};