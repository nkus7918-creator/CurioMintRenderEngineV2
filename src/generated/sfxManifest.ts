/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const sfxManifest = {
  "cinematic": [],
  "impact": [],
  "rise": [],
  "transition": [],
  "ui": []
} as const;

export type SfxCategory =
  keyof typeof sfxManifest;

export type SfxCategoryAssetPath =
  (typeof sfxManifest)[SfxCategory][number];
