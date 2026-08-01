import type { DocumentaryThemeId } from "../themes/types";
import type { MusicTheme } from "../../../generated/musicManifest";

export const getMusicTheme = (
  theme?: DocumentaryThemeId,
): MusicTheme => {
  switch (theme) {
    case "documentary-dark":
      return "history";

    default:
      return "history";
  }
};