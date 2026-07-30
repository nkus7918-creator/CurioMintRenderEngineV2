import type { CameraMotionConfig } from "./types";

export function resolveCameraMotion(
    motion?: CameraMotionConfig,
) {
    const preset = motion?.preset ?? "slowPush";
    const intensity = motion?.intensity ?? 1;

    switch (preset) {
        case "none":
            return {
                startScale: 1,
                endScale: 1,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 0,
            };

        case "slowPush":
            return {
                startScale: 1,
                endScale: 1.08 * intensity,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 0,
            };

        case "slowPull":
            return {
                startScale: 1.08 * intensity,
                endScale: 1,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 0,
            };

        case "driftLeft":
            return {
                startScale: 1.12,
                endScale: 1.12,
                startX: 90 * intensity,
                endX: -90 * intensity,
                startY: 0,
                endY: 0,
            };

        case "driftRight":
            return {
                startScale: 1.12,
                endScale: 1.12,
                startX: -90 * intensity,
                endX: 90 * intensity,
                startY: 0,
                endY: 0,
            };
        case "driftUp":
            return {
                startScale: 1.05,
                endScale: 1.05,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: -40 * intensity,
            };

        case "driftDown":
            return {
                startScale: 1.05,
                endScale: 1.05,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 40 * intensity,
            };
    }
}