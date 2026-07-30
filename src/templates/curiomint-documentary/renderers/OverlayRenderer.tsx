import { AbsoluteFill } from "remotion";

import type { OverlayConfig } from "../overlay-engine/types";
import { resolveOverlay } from "../overlay-engine/resolveOverlay";
import { useTheme } from "../themes/ThemeContext";

type OverlayRendererProps = {
    overlay?: OverlayConfig;
};

export const OverlayRenderer = ({
    overlay,
}: OverlayRendererProps) => {
    const theme = useTheme();
    const resolvedOverlay = resolveOverlay(overlay);

    if (resolvedOverlay.preset === "none") {
        return null;
    }

    const { preset, opacity } = resolvedOverlay;

    const gradients = {
        minimal: {
            top: theme.overlay.minimalTopGradient,
            bottom: theme.overlay.minimalBottomGradient,
        },
        cinematic: {
            top: theme.overlay.cinematicTopGradient,
            bottom: theme.overlay.cinematicBottomGradient,
        },
        history: {
            top: theme.overlay.historyTopGradient,
            bottom: theme.overlay.historyBottomGradient,
        },
    } as const;

    const activeGradient = gradients[preset];

    return (
        <AbsoluteFill
            style={{
                pointerEvents: "none",
                opacity,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: theme.overlay.topHeight,
                    background: activeGradient.top,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: theme.overlay.bottomHeight,
                    background: activeGradient.bottom,
                }}
            />
        </AbsoluteFill>
    );
};