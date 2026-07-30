import {
    Img,
    interpolate,
} from "remotion";

import type { MediaItem } from "../types";
import { resolveCameraMotion } from "../motion/resolveCameraMotion";
import { getTransitionStyle } from "../transitions/getTransitionStyle";
import { useTheme } from "../themes/ThemeContext";

import { getMotionValues } from "../motion/getMotionValues";
import { getTransitionValues } from "../transitions/getTransitionValues";
import { composeTransform } from "../transform/composeTransform";

type ImageRendererProps = {
    media: MediaItem;
    frame: number;
    durationInFrames: number;
};

export const ImageRenderer = ({
    media,
    frame,
    durationInFrames,
}: ImageRendererProps) => {
    const theme = useTheme();

    const safeDuration = Math.max(1, durationInFrames);
    const endFrame = Math.max(1, safeDuration - 1);

    const motionValues = getMotionValues({
        frame,
        durationInFrames: safeDuration,
        motion:
            media.motion ?? {
                preset: theme.motion.defaultCameraPreset,
                intensity: theme.motion.defaultIntensity,
            },
    });

    const transitionValues = getTransitionValues({
        frame,
        durationInFrames: safeDuration,
        fps: 30,
        transition: media.transition,
    });
    const transitionStyle = getTransitionStyle({
        frame,
        durationInFrames: safeDuration,
        fps: 30,
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
                opacity: transitionValues.opacity,

                transform: composeTransform({
                    translateX:
                        motionValues.translateX +
                        transitionValues.translateX,
                    translateY: motionValues.translateY,
                    scale:
                        motionValues.scale *
                        transitionValues.scale,
                }),
            }}
        />
    );
};