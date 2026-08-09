export type IconCalloutIcon =
  | "fire"
  | "mechanism"
  | "date"
  | "astronomy"
  | "intelligence"
  | "computing"
  | "world"
  | "idea"
  | "maritime"
  | "science"
  | "power"
  | "time"
  | "document"
  | "location"
  | "physics"
  | "space"
  | "discovery"
  | "engineering";

export type IconCalloutPlacement =
  | "top-left"
  | "top-right"
  | "center-left"
  | "center-right";

export interface IconCalloutCue {
  id: string;
  icon: IconCalloutIcon;

  /**
   * Small descriptive line, for example:
   * "INTERLOCKING GEARS"
   */
  label: string;

  /**
   * Optional large value, for example:
   * "30+" or "1900".
   */
  value?: string;

  /**
   * Section-relative start time.
   */
  startInSeconds: number;

  /**
   * Defaults to 4.2 seconds.
   */
  durationInSeconds?: number;

  /**
   * Defaults to top-right.
   * Bottom placements are intentionally excluded so callouts
   * cannot collide with cinematic subtitles.
   */
  placement?: IconCalloutPlacement;
}