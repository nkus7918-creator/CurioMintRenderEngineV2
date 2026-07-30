import { getFadeOpacity } from "./fade";
import { getSlideTranslateX } from "./slide";
import { resolveTransition } from "./resolveTransition";
import type { TransitionConfig } from "./types";
import type { TransitionValues } from "./transitionValues";
import { getZoomScale } from "./zoom";

type GetTransitionValuesProps = {
    frame: number;
    durationInFrames: number;
    fps: number;
    transition?: TransitionConfig;
};

export const getTransitionValues = ({
    frame,
    durationInFrames,
    fps,
    transition,
}: GetTransitionValuesProps): TransitionValues => {
    const resolvedTransition = resolveTransition(transition);

    return {
        opacity: getFadeOpacity({
            frame,
            durationInFrames,
            fps,
            transition: resolvedTransition,
        }),

            translateX: getSlideTranslateX({
                frame,
                durationInFrames,
                fps,
                transition: resolvedTransition,
            }),

                translateY: 0,

                    scale: getZoomScale({
                        frame,
                        durationInFrames,
                        fps,
                        transition: resolvedTransition,
                    }),

                        rotate: 0,
                            blur: 0,
      };
};