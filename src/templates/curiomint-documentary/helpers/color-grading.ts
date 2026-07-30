import type { DocumentaryTheme } from "../themes/types";

export const createColorFilter = (
    grading: DocumentaryTheme["colorGrading"],
) => {
    return [
        `brightness(${grading.brightness})`,
        `contrast(${grading.contrast})`,
        `saturate(${grading.saturation})`,
        `sepia(${grading.sepia})`,
        `hue-rotate(${grading.hueRotate}deg)`,
    ].join(" ");
};