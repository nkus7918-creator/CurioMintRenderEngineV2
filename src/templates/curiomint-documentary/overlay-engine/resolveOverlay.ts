import type { OverlayConfig, OverlayPreset } from "./types";

export type ResolvedOverlay = {
    preset: OverlayPreset;
    opacity: number;
};

export const resolveOverlay = (
    config?: OverlayConfig,
): ResolvedOverlay => {
    return {
        preset: config?.preset ?? "cinematic",
        opacity: config?.opacity ?? 1,
    };
};