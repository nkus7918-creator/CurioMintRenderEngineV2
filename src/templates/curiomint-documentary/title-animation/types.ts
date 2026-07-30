export type TitleAnimationPreset =
    | "none"
    | "fade"
    | "fadeUp"
    | "fadeDown"
    | "slideLeft"
    | "slideRight"
    | "scaleIn"
    | "blurIn";

export type TitleAnimationConfig = {
    preset?: TitleAnimationPreset;
    durationInSeconds?: number;
    delayInSeconds?: number;
};