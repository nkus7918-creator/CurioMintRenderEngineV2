import type { TransitionConfig } from "./transitions/types";

import type {
    DocumentaryThemeId,
} from "./themes/types";

import type { CameraMotionConfig } from "./motion/types";

import type { TitleAnimationConfig } from "./title-animation/types";

import type { SubtitleConfig } from "./subtitle-engine/types";

import type { OverlayConfig } from "./overlay-engine/types";

export type ThemeName =
    | "history"
    | "science"
    | "legend"
    | "modern"
    | "war";

export type MediaType = "image" | "video";

export type MediaAnimation =
    | "none"
    | "ken-burns"
    | "slow-zoom"
    | "pan-left"
    | "pan-right"
    | "parallax";

export interface MediaItem {
    id: string;
    type: MediaType;
    url: string;

    durationInSeconds?: number;
    animation?: MediaAnimation;
    startFromSeconds?: number;
    muted?: boolean;
    fallbackUrl?: string;

    transition?: TransitionConfig;

    motion?: CameraMotionConfig;
}

export type AudioEffectType = "sfx" | "ambience";

export interface AudioEffect {
    id: string;
    type: AudioEffectType;
    url: string;
    startAtSeconds: number;
    durationInSeconds?: number;
    volume?: number;
}

export interface SubtitleWord {
    word: string;
    start: number;
    end: number;
}

export interface SubtitleTiming {
    text: string;
    duration: number;
    words?: SubtitleWord[];
}

export interface DocumentarySection {
    id: string;
    title: string;
    subtitle?: string;
    narrationText?: string;
    narrationUrl?: string;
    durationInSeconds: number;
    media: MediaItem[];
    ambienceUrl?: string;
    audioEffects?: AudioEffect[];
    subtitleTiming?: SubtitleTiming;
    titleAnimation?: TitleAnimationConfig;
    subtitleConfig?: SubtitleConfig;
    overlay?: OverlayConfig;
}

export type DocumentaryProps = {
    theme?: DocumentaryThemeId;
    title: string;
    subtitle?: string;
    durationInSeconds: number;
    sections: DocumentarySection[];

    introDurationInSeconds?: number;
    outroDurationInSeconds?: number;

    narrationVolume?: number;
    musicUrl?: string;
    musicVolume?: number;

    logoUrl?: string;
    subtitleWords?: SubtitleWord[];
};
