/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const ambienceManifest = {
  "ancient": [
    "assets/audio/Ambience/Ancient/Battlefield 1.mp3",
    "assets/audio/Ambience/Ancient/Battlefield 2.mp3",
    "assets/audio/Ambience/Ancient/Battlefield 3.mp3",
    "assets/audio/Ambience/Ancient/Medieval 1.wav",
    "assets/audio/Ambience/Ancient/Medieval 2.wav",
    "assets/audio/Ambience/Ancient/Medieval 3.wav",
    "assets/audio/Ambience/Ancient/Roman City 1.wav",
    "assets/audio/Ambience/Ancient/Roman City 2.mp3"
  ],
  "city": [
    "assets/audio/Ambience/City/City Day 1.m4a",
    "assets/audio/Ambience/City/City Day 2.mp3",
    "assets/audio/Ambience/City/City Night 1.mp3",
    "assets/audio/Ambience/City/City Night 2.mp3",
    "assets/audio/Ambience/City/City Night 3.mp3",
    "assets/audio/Ambience/City/Crowd 1.mp3",
    "assets/audio/Ambience/City/Crowd 2.mp3",
    "assets/audio/Ambience/City/Crowd 3.mp3",
    "assets/audio/Ambience/City/Crowd 4.mp3",
    "assets/audio/Ambience/City/Market 1.mp3",
    "assets/audio/Ambience/City/Market 2.mp3",
    "assets/audio/Ambience/City/Market 3.mp3",
    "assets/audio/Ambience/City/Market 4.mp3",
    "assets/audio/Ambience/City/Street 1.mp3",
    "assets/audio/Ambience/City/Street 2.mp3",
    "assets/audio/Ambience/City/Street 3.mp3"
  ],
  "nature": [
    "assets/audio/Ambience/Nature/Cave 1.mp3",
    "assets/audio/Ambience/Nature/Cave 2.mp3",
    "assets/audio/Ambience/Nature/Cave 3.mp3",
    "assets/audio/Ambience/Nature/Desert 1.wav",
    "assets/audio/Ambience/Nature/Forest 1.flac",
    "assets/audio/Ambience/Nature/Forest 2.wav",
    "assets/audio/Ambience/Nature/Jungle 1.wav",
    "assets/audio/Ambience/Nature/Jungle 2.mp3",
    "assets/audio/Ambience/Nature/Jungle 3.mp3",
    "assets/audio/Ambience/Nature/Ocean 1.wav",
    "assets/audio/Ambience/Nature/Ocean 2.wav",
    "assets/audio/Ambience/Nature/Ocean 3.wav",
    "assets/audio/Ambience/Nature/Rain 1.mp3",
    "assets/audio/Ambience/Nature/Rain 2.mp3",
    "assets/audio/Ambience/Nature/Rain 3.wav",
    "assets/audio/Ambience/Nature/River 1.mp3",
    "assets/audio/Ambience/Nature/River 2.mp3",
    "assets/audio/Ambience/Nature/River 3.mp3",
    "assets/audio/Ambience/Nature/River 4.mp3",
    "assets/audio/Ambience/Nature/Waterfall 1.mp3",
    "assets/audio/Ambience/Nature/Waterfall 2.mp3",
    "assets/audio/Ambience/Nature/Wind 1.mp3",
    "assets/audio/Ambience/Nature/Wind 2.mp3",
    "assets/audio/Ambience/Nature/Wind 3.mp3",
    "assets/audio/Ambience/Nature/Wind 4.mp3"
  ],
  "space": [
    "assets/audio/Ambience/Space/Sci-fi Atmosphere 1.mp3",
    "assets/audio/Ambience/Space/Sci-fi Atmosphere 2.mp3",
    "assets/audio/Ambience/Space/Space Hum 1.mp3",
    "assets/audio/Ambience/Space/Space Hum 2.mp3",
    "assets/audio/Ambience/Space/Space Hum 3.mp3",
    "assets/audio/Ambience/Space/Space Hum 4.mp3"
  ]
} as const;

export type AmbienceTheme =
  keyof typeof ambienceManifest;

export type AmbienceThemeAssetPath =
  (typeof ambienceManifest)[AmbienceTheme][number];
