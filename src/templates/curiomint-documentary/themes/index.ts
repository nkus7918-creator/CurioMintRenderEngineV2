import { documentaryDarkTheme } from "./documentary-dark";

import type {
  DocumentaryTheme,
  DocumentaryThemeId,
} from "./types";

const themes: Record<
  DocumentaryThemeId,
  DocumentaryTheme
> = {
  "documentary-dark": documentaryDarkTheme,

  history: documentaryDarkTheme,
  science: documentaryDarkTheme,
  minimal: documentaryDarkTheme,
};

export const getDocumentaryTheme = (
  themeId: DocumentaryThemeId,
): DocumentaryTheme => {
  return themes[themeId];
};