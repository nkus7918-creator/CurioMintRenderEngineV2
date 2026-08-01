/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const historicalManifest = {
  "ancient paper": [
    "assets/Historical/Ancient Paper 1.jpg",
    "assets/Historical/Ancient Paper 2.svg",
    "assets/Historical/Ancient Paper 3.svg",
    "assets/Historical/Ancient Paper 4.jpg"
  ],
  "compass": [
    "assets/Historical/Compass 1.svg",
    "assets/Historical/Compass 2.svg"
  ],
  "ink splash": [
    "assets/Historical/Ink Splash 1.svg",
    "assets/Historical/Ink Splash 2.svg"
  ],
  "old book": [
    "assets/Historical/Old Book 1.jpg",
    "assets/Historical/Old Book 2.png",
    "assets/Historical/Old Book 3.png"
  ],
  "scroll": [
    "assets/Historical/Scroll 1.jpg",
    "assets/Historical/Scroll 2.png",
    "assets/Historical/Scroll 3.png",
    "assets/Historical/Scroll 4.png"
  ],
  "wax seal": [
    "assets/Historical/Wax Seal 1.png",
    "assets/Historical/Wax Seal 2.png",
    "assets/Historical/Wax Seal 3.png"
  ]
} as const;

export type HistoricalCategory =
  keyof typeof historicalManifest;

export type HistoricalCategoryAssetPath =
  (typeof historicalManifest)[HistoricalCategory][number];
