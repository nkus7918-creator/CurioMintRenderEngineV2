import type { TransitionConfig } from "./types";

export const resolveTransition = (
    transition?: TransitionConfig,
): TransitionConfig => {
    return {
        type: transition?.type ?? "none",
        durationInSeconds:
            transition?.durationInSeconds ?? 0.5,
    };
};