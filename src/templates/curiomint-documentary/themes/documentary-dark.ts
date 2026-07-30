import type { DocumentaryTheme } from "./types";

export const documentaryDarkTheme: DocumentaryTheme = {
    id: "documentary-dark",

    colors: {
        background: "#050505",
        surface: "#111111",
        textPrimary: "#FFFFFF",
        textSecondary: "#B8B8B8",
        accent: "#D6A85F",
        overlay: "#000000",
    },

    typography: {
        fontFamily: "Arial, sans-serif",
        titleFontSize: 78,
        bodyFontSize: 42,
        subtitleFontSize: 48,
        fontWeight: 700,
    },

    media: {
        borderRadius: 28,
        overlayOpacity: 0.25,
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
        defaultDurationInSeconds: 0.5,
    },
};