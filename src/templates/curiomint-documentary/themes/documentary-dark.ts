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

  transitions: {
    defaultDurationInSeconds: 0.5,
  },
};