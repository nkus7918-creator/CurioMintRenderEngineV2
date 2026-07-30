import type { CameraMotionPreset } from "../motion/types";

export type DocumentaryThemeId =
    | "documentary-dark"
    | "history"
    | "science"
    | "minimal";

export type DocumentaryTheme = {
    id: DocumentaryThemeId;

    colors: {
        background: string;
        surface: string;
        textPrimary: string;
        textSecondary: string;
        accent: string;
        overlay: string;
    };

    typography: {
        fontFamily: string;
        titleFontSize: number;
        bodyFontSize: number;
        subtitleFontSize: number;
        fontWeight: number;
    };

    media: {
        borderRadius: number;
        overlayOpacity: number;
    };

    overlay: {
        topHeight: string;
        bottomHeight: string;

        minimalTopGradient: string;
        minimalBottomGradient: string;

        cinematicTopGradient: string;
        cinematicBottomGradient: string;

        historyTopGradient: string;
        historyBottomGradient: string;
    };

    motion: {
        defaultCameraPreset: CameraMotionPreset;
        defaultIntensity: number;
    };
    transitions: {
        defaultDurationInSeconds: number;
    };
};