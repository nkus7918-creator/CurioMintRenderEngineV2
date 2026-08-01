/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const musicManifest = {
  "ancient": [
    "assets/audio/music/ancient/Documentary Ancient1.mp3",
    "assets/audio/music/ancient/Documentary Ancient2.mp3",
    "assets/audio/music/ancient/Documentary Ancient3.mp3"
  ],
  "emotional": [
    "assets/audio/music/emotional/Documentary Emotional1.mp3",
    "assets/audio/music/emotional/Documentary Emotional2.mp3",
    "assets/audio/music/emotional/Documentary Emotional3.mp3"
  ],
  "history": [
    "assets/audio/music/history/Documentary History1.mp3",
    "assets/audio/music/history/Documentary History2.mp3",
    "assets/audio/music/history/Documentary History3.mp3"
  ],
  "inspirational": [
    "assets/audio/music/inspirational/Documentary Inspirational1.mp3",
    "assets/audio/music/inspirational/Documentary Inspirational2.mp3",
    "assets/audio/music/inspirational/Documentary Inspirational3.mp3"
  ],
  "investigation": [
    "assets/audio/music/investigation/Documentary Investigation1.mp3",
    "assets/audio/music/investigation/Documentary Investigation2.mp3",
    "assets/audio/music/investigation/Documentary Investigation3.mp3"
  ],
  "mystery": [
    "assets/audio/music/mystery/Documentary Mystery1.mp3",
    "assets/audio/music/mystery/Documentary Mystery2.mp3",
    "assets/audio/music/mystery/Documentary Mystery3.mp3"
  ],
  "nature": [
    "assets/audio/music/nature/Documentary Nature1.mp3",
    "assets/audio/music/nature/Documentary Nature2.mp3"
  ],
  "science": [
    "assets/audio/music/science/Documentary Science1.mp3",
    "assets/audio/music/science/Documentary Science2.mp3",
    "assets/audio/music/science/Documentary Science3.mp3"
  ],
  "space": [
    "assets/audio/music/space/Documentary Space1.mp3",
    "assets/audio/music/space/Documentary Space2.mp3",
    "assets/audio/music/space/Documentary Space3.mp3"
  ],
  "tension": [
    "assets/audio/music/tension/Documentary Tension1.mp3",
    "assets/audio/music/tension/Documentary Tension2.mp3",
    "assets/audio/music/tension/Documentary Tension3.mp3"
  ]
} as const;

export type MusicTheme =
  keyof typeof musicManifest;

export type MusicAssetPath =
  (typeof musicManifest)[MusicTheme][number];
