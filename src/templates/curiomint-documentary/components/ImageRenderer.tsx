import { Img } from "remotion";

import type { MediaItem } from "../types";

import { useTheme } from "../themes/ThemeContext";
import { getMotionValues } from "../motion/getMotionValues";
import { getTransitionValues } from "../transitions/getTransitionValues";
import { composeTransform } from "../transform/composeTransform";
import { createColorFilter } from "../helpers/color-grading";

type ImageRendererProps = {
    media: MediaItem;
    fps: number;
    frame: number;
    durationInFrames: number;
};

export const ImageRenderer = ({
    media,
    fps,
    frame,
    durationInFrames,
}: ImageRendererProps) => {
    const theme = useTheme();

    const safeDuration = Math.max(1, durationInFrames);

    const motionValues = getMotionValues({
        frame,
        durationInFrames: safeDuration,
        motion:
            media.motion ?? {
                preset: theme.motion.defaultCameraPreset,
                intensity: theme.motion.defaultIntensity,
            },
        seed: media.id ?? media.url,
    });

    const transitionValues = getTransitionValues({
        frame,
        durationInFrames: safeDuration,
        fps,
        transition: media.transition,
    });

    return (
        <Img
            src={media.url}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: theme.media.borderRadius,
                filter: "none",
                opacity: transitionValues.opacity,

                transform: composeTransform({
                    translateX:
                        motionValues.translateX +
                        transitionValues.translateX,

                    translateY:
                        motionValues.translateY +
                        transitionValues.translateY,

                    scale:
                        motionValues.scale *
                        transitionValues.scale,
                    rotation: motionValues.rotation,
                }),
            }}
        />
    );
};