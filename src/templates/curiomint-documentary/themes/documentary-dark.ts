import {
    COLORS,
    MOTION,
    SPACING,
    TYPOGRAPHY,
} from "../../../design";

import type { DocumentaryTheme } from "./types";

export const documentaryDarkTheme: DocumentaryTheme = {
    id: "documentary-dark",

    colors: {
        background: COLORS.background,
        surface: COLORS.surface,
        textPrimary: COLORS.textPrimary,
        textSecondary: COLORS.textSecondary,
        accent: COLORS.accent,
        overlay: "#000000",
        subtitleActive: "#FFD54A",
    },

    typography: {
        fontFamily: TYPOGRAPHY.title.fontFamily,
        titleFontSize: 78,
        bodyFontSize: 42,
        subtitleFontSize: 48,
        fontWeight: TYPOGRAPHY.title.fontWeight,
    },

    media: {
        borderRadius: SPACING.md,
        overlayOpacity: 0.25,
    },

    colorGrading: {
        brightness: 0.98,
        contrast: 1.08,
        saturation: 0.92,
        sepia: 0.02,
        hueRotate: 0,
    },

    overlay: {
        topHeight: "35%",
        bottomHeight: "42%",

        minimalTopGradient:
            "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0))",

        minimalBottomGradient:
            "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))",

        cinematicTopGradient:
            "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))",

        cinematicBottomGradient:
            "linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0))",

        historyTopGradient:
            "linear-gradient(to bottom, rgba(30,18,8,0.65), rgba(0,0,0,0))",

        historyBottomGradient:
            "linear-gradient(to top, rgba(24,14,6,0.78), rgba(0,0,0,0))",
    },

    motion: {
        defaultCameraPreset: "slowPush",
        defaultIntensity: 1,
    },

    transitions: {
        defaultDurationInSeconds: MOTION.fadeDuration / 30,
    },
};