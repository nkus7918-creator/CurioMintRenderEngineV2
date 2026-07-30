export type OverlayPreset =
    | "none"
    | "minimal"
    | "cinematic"
    | "history";

export type OverlayConfig = {
    preset?: OverlayPreset;
    opacity?: number;
};