import { OffthreadVideo } from "remotion";

import type { MediaItem } from "../types";
import { getMotionValues } from "../motion/getMotionValues";
import { getTransitionValues } from "../transitions/getTransitionValues";
import { composeTransform } from "../transform/composeTransform";
import { useTheme } from "../themes/ThemeContext";

type VideoRendererProps = {
    media: MediaItem;
    fps: number;
    frame: number;
    durationInFrames: number;
};

export const VideoRenderer = ({
    media,
    fps,
    frame,
    durationInFrames,
}: VideoRendererProps) => {
    const theme = useTheme();

    const trimBefore = Math.round(
        (media.startFromSeconds ?? 0) * fps,
    );

    const trimAfter =
        media.durationInSeconds !== undefined
            ? trimBefore +
            Math.round(media.durationInSeconds * fps)
            : undefined;

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
        <OffthreadVideo
            src={media.url}
            trimBefore={trimBefore}
            trimAfter={trimAfter}
            muted={media.muted ?? true}
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