import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const anton = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

const montserrat = loadMontserrat("normal", {
  weights: ["800"],
  subsets: ["latin", "latin-ext"],
});

export const SHORTS_FONT_FAMILY = anton.fontFamily;
export const SUBTITLE_FONT_FAMILY = montserrat.fontFamily;
