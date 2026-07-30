import { interpolate } from "remotion";

import type { ResolvedTitleAnimation } from "./resolveTitleAnimation";

type GetTitleAnimationStyleParams = {
    frame: number;
    fps: number;
    animation: ResolvedTitleAnimation;
};

export const getTitleAnimationStyle = ({
    frame,
    fps,
    animation,
}: GetTitleAnimationStyleParams): React.CSSProperties => {
    const delayInFrames = Math.round(
        animation.delayInSeconds * fps,
    );

    const durationInFrames = Math.max(
        1,
        Math.round(animation.durationInSeconds * fps),
    );

    const progress = interpolate(
        frame,
        [
            delayInFrames,
            delayInFrames + durationInFrames,
        ],
        [0, 1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    switch (animation.preset) {
        case "none":
            return {};

        case "fade":
            return {
                opacity: progress,
            };

        case "fadeUp":
            return {
                opacity: progress,
                transform: `translateY(${interpolate(
                    progress,
                    [0, 1],
                    [40, 0],
                )}px)`,
            };

        case "fadeDown":
            return {
                opacity: progress,
                transform: `translateY(${interpolate(
                    progress,
                    [0, 1],
                    [-40, 0],
                )}px)`,
            };

        case "slideLeft":
            return {
                opacity: progress,
                transform: `translateX(${interpolate(
                    progress,
                    [0, 1],
                    [80, 0],
                )}px)`,
            };

        case "slideRight":
            return {
                opacity: progress,
                transform: `translateX(${interpolate(
                    progress,
                    [0, 1],
                    [-80, 0],
                )}px)`,
            };
        case "scaleIn":
            return {
                opacity: progress,
                transform: `scale(${interpolate(
                    progress,
                    [0, 1],
                    [0.9, 1],
                )})`,
            };

        case "blurIn":
            return {
                opacity: progress,
                filter: `blur(${interpolate(
                    progress,
                    [0, 1],
                    [16, 0],
                )}px)`,
            };

        default:
            return {};
    }
};