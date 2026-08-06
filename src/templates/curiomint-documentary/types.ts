import type { TransitionConfig } from "./transitions/types";

import type { DocumentaryThemeId } from "./themes/types";

import type { CameraMotionConfig } from "./motion/types";

import type { TitleAnimationConfig } from "./title-animation/types";

import type { SubtitleConfig } from "./subtitle-engine/types";

import type { OverlayConfig } from "./overlay-engine/types";

export type ThemeName = "history" | "science" | "legend" | "modern" | "war";

export type MediaType = "image" | "video";

export type ShortVideoStrategy = "advance" | "loop";

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

  /*
   * Media'nÄ±n documentary timeline iÃ§inde
   * ne kadar sÃ¼re gÃ¶sterilmek istendiÄŸi.
   */
  durationInSeconds?: number;

  animation?: MediaAnimation;

  /*
   * Kaynak videonun hangi saniyesinden
   * oynatÄ±lmaya baÅŸlanacaÄŸÄ±.
   */
  startFromSeconds?: number;

  /*
   * Kaynak videoda oynatÄ±labilecek son
   * zaman noktasÄ±dÄ±r. Mutlak saniye deÄŸeridir.
   *
   * Ã–rnek:
   * startFromSeconds: 4
   * trimEndSeconds: 9
   *
   * Kaynaktan 4-9 saniye arasÄ± kullanÄ±lÄ±r.
   */
  trimEndSeconds?: number;

  /*
   * Kaynak dosyanÄ±n gerÃ§ek toplam sÃ¼resi.
   * Asset preflight aÅŸamasÄ±nda otomatik
   * doldurulacaktÄ±r.
   */
  sourceDurationInSeconds?: number;

  /*
   * Kaynak video timeline sÃ¼resinden kÄ±saysa:
   *
   * advance:
   * Sonraki media erken baÅŸlar.
   *
   * loop:
   * SeÃ§ilen kaynak aralÄ±ÄŸÄ± tekrar oynatÄ±lÄ±r.
   */
  shortVideoStrategy?: ShortVideoStrategy;

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

  infographics?: {
    statistic?: {
      label: string;
      value: string;
      prefix?: string;
      suffix?: string;
      description?: string;
    };

    map?: {
      title?: string;
      subtitle?: string;
      mapStyle?: "political" | "relief" | "blank";

      markers: {
        id: string;
        label: string;
        x: number;
        y: number;
      }[];
    };

    timeline?: {
      title?: string;
      activeIndex?: number;

      events: {
        year: string;
        title: string;
      }[];
    };

    person?: {
      name: string;
      subtitle?: string;
      imageUrl: string;
      birth?: string;
      death?: string;
      description?: string;
    };

    quote?: {
      quote: string;
      author?: string;
    };

    comparison?: {
      title?: string;

      left: {
        label: string;
        value: string;
        description?: string;
      };

      right: {
        label: string;
        value: string;
        description?: string;
      };
    };
    country?: {
      name: string;
      code: string;
      capital?: string;
      population?: string;
      region?: string;
      description?: string;
    };
    battle?: {
      title: string;
      date?: string;
      location?: string;

      attacker: {
        name: string;
        strength?: string;
      };

      defender: {
        name: string;
        strength?: string;
      };

      result?: string;
      description?: string;
    };
  };
  infographicTiming?: {
    startInSeconds?: number;
    durationInSeconds?: number;
  };
}

export type DocumentaryChapter = {
  id: string;

  title: string;

  subtitle?: string;

  imagePrompt?: string;

  backgroundImageUrl?: string;

  showIntro?: boolean;
  rank?: number;

  sections: DocumentarySection[];
};

export type DocumentaryProps = {
  theme?: DocumentaryThemeId;
  title: string;
  subtitle?: string;
  durationInSeconds?: number;

  chapters?: DocumentaryChapter[];

  sections?: DocumentarySection[];

  introDurationInSeconds?: number;
  chapterIntroDurationInSeconds?: number;
  outroDurationInSeconds?: number;

  narrationVolume?: number;
  musicUrl?: string;
  musicVolume?: number;

  logoUrl?: string;
  subtitleWords?: SubtitleWord[];
};
