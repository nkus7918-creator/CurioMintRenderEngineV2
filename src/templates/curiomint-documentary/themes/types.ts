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

  transitions: {
    defaultDurationInSeconds: number;
  };
};