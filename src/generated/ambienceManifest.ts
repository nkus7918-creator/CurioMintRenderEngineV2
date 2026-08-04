/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const ambienceManifest = {
  "ancient": [],
  "city": [],
  "nature": [],
  "space": []
} as const;

export type AmbienceTheme =
  keyof typeof ambienceManifest;

export type AmbienceThemeAssetPath =
  (typeof ambienceManifest)[AmbienceTheme][number];
