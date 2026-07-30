import { random } from "remotion";

import type {
    CameraMotionConfig,
    CameraMotionValues,
} from "./types";

export function resolveCameraMotion(
    motion?: CameraMotionConfig,
    seed = "default-ken-burns",
): CameraMotionValues {
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
                startRotation: 0,
                endRotation: 0,
            };

        case "slowPush":
            return {
                startScale: 1,
                endScale: 1.08 * intensity,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 0,
                startRotation: 0,
                endRotation: 0,
            };

        case "slowPull":
            return {
                startScale: 1.08 * intensity,
                endScale: 1,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 0,
                startRotation: 0,
                endRotation: 0,
            };

        case "driftLeft":
            return {
                startScale: 1.12,
                endScale: 1.12,
                startX: 90 * intensity,
                endX: -90 * intensity,
                startY: 0,
                endY: 0,
                startRotation: 0,
                endRotation: 0,
            };

        case "driftRight":
            return {
                startScale: 1.12,
                endScale: 1.12,
                startX: -90 * intensity,
                endX: 90 * intensity,
                startY: 0,
                endY: 0,
                startRotation: 0,
                endRotation: 0,
            };
        case "driftUp":
            return {
                startScale: 1.05,
                endScale: 1.05,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: -40 * intensity,
                startRotation: 0,
                endRotation: 0,
            };

        case "driftDown":
            return {
                startScale: 1.05,
                endScale: 1.05,
                startX: 0,
                endX: 0,
                startY: 0,
                endY: 40 * intensity,
                startRotation: 0,
                endRotation: 0,
            };

        case "kenBurnsIn":
            return {
                startScale: 1.02,
                endScale: 1.14 * intensity,
                startX: -18 * intensity,
                endX: 18 * intensity,
                startY: 12 * intensity,
                endY: -12 * intensity,
                startRotation: 0,
                endRotation: 0,
            };

        case "kenBurnsOut":
            return {
                startScale: 1.14 * intensity,
                endScale: 1.02,
                startX: 18 * intensity,
                endX: -18 * intensity,
                startY: -12 * intensity,
                endY: 12 * intensity,
                startRotation: 0,
                endRotation: 0,
            };

        case "kenBurnsLeft":
            return {
                startScale: 1.12,
                endScale: 1.18,
                startX: 70 * intensity,
                endX: -70 * intensity,
                startY: 10 * intensity,
                endY: -10 * intensity,
                startRotation: 0,
                endRotation: 0,
            };

        case "kenBurnsRight":
            return {
                startScale: 1.12,
                endScale: 1.18,
                startX: -70 * intensity,
                endX: 70 * intensity,
                startY: -10 * intensity,
                endY: 10 * intensity,
                startRotation: 0,
                endRotation: 0,
            };
        case "kenBurns": {
            const variantIndex = Math.floor(
                random(`${seed}-variant`) * 6,
            );

            const variants: CameraMotionValues[] = [
                // %40 — sadece zoom
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: 0,
                    endX: 0,
                    startY: 0,
                    endY: 0,
                    startRotation: 0,
                    endRotation: 0,
                },
                {
                    startScale: 1.04,
                    endScale: 1.1,
                    startX: 0,
                    endX: 0,
                    startY: 0,
                    endY: 0,
                    startRotation: 0,
                    endRotation: 0,
                },
                {
                    startScale: 1.02,
                    endScale: 1.08,
                    startX: 0,
                    endX: 0,
                    startY: 0,
                    endY: 0,
                    startRotation: 0,
                    endRotation: 0,
                },
                {
                    startScale: 1.05,
                    endScale: 1.1,
                    startX: 0,
                    endX: 0,
                    startY: 0,
                    endY: 0,
                    startRotation: 0,
                    endRotation: 0,
                },

                // %30 — hafif yatay
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: -16,
                    endX: 16,
                    startY: 0,
                    endY: 0,
                    startRotation: -0.04,
                    endRotation: 0.04,
                },
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: 16,
                    endX: -16,
                    startY: 0,
                    endY: 0,
                    startRotation: 0.04,
                    endRotation: -0.04,
                },
                {
                    startScale: 1.04,
                    endScale: 1.1,
                    startX: -10,
                    endX: 10,
                    startY: 0,
                    endY: 0,
                    startRotation: 0,
                    endRotation: 0,
                },

                // %20 — hafif dikey
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: 0,
                    endX: 0,
                    startY: -12,
                    endY: 12,
                    startRotation: 0,
                    endRotation: 0,
                },
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: 0,
                    endX: 0,
                    startY: 12,
                    endY: -12,
                    startRotation: 0,
                    endRotation: 0,
                },

                // %10 — hafif diagonal
                {
                    startScale: 1.03,
                    endScale: 1.09,
                    startX: -12,
                    endX: 12,
                    startY: -6,
                    endY: 6,
                    startRotation: -0.04,
                    endRotation: 0.04,
                },
            ];

            const selected = variants[variantIndex];

            return {
                startScale:
                    1 + (selected.startScale - 1) * intensity,
                endScale:
                    1 + (selected.endScale - 1) * intensity,
                startX: selected.startX * intensity,
                endX: selected.endX * intensity,
                startY: selected.startY * intensity,
                endY: selected.endY * intensity,
                startRotation:
                    selected.startRotation * intensity,

                endRotation:
                    selected.endRotation * intensity,
            };
        }
    }
}