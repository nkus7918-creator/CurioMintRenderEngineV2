export const audioMixer = {
  narration: 1,

  music: 0.08,

  ambience: 0.16,

  narrationFadeInSeconds:
    0.08,

  narrationFadeOutSeconds:
    0.14,

  ducking: {
    /*
     * Narration sırasında müzik
     * kendi seviyesinin %24'Ã¼ne iner.
     */
    musicUnderNarration:
      0.24,

    /*
     * Ambience tamamen kaybolmaz.
     */
    ambienceUnderNarration:
      0.55,

    attackInSeconds:
      0.18,

    releaseInSeconds:
      0.45,
  },

  sfx: {
    intro: 0.35,

    chapter: 0.28,

    section: 0.18,
  },
} as const;