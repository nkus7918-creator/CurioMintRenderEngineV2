export type HistoricalMapConfig = {
  /**
   * Human-readable Cliopatria entity query.
   * Example: "Roman Empire".
   */
  entity: string;

  /**
   * Astronomical-style integer year used by Cliopatria:
   * negative = BCE, positive = CE.
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
  unresolvedReason?: string;
};