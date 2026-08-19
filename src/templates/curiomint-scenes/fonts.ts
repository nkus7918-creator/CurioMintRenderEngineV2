import { loadFont } from "@remotion/google-fonts/Anton";

const anton = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

export const SHORTS_FONT_FAMILY = anton.fontFamily;
