import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const musicRoot = path.join(
  projectRoot,
  "public",
  "assets",
  "audio",
  "music",
);

const jsonManifestOutput = path.join(
  projectRoot,
  "public",
  "assets",
  "audio",
  "music-manifest.json",
);

const typescriptManifestOutput = path.join(
  projectRoot,
  "src",
  "generated",
  "musicManifest.ts",
);

const supportedExtensions = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".flac",
  ".ogg",
]);

const normalizePath = (value) =>
  value.split(path.sep).join("/");

const isSupportedAudioFile = (fileName) =>
  supportedExtensions.has(
    path.extname(fileName).toLowerCase(),
  );

const readMusicLibrary = async () => {
  const manifest = {};

  let themeDirectories;

  try {
    themeDirectories = await fs.readdir(
      musicRoot,
      {
        withFileTypes: true,
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        `Music folder could not be found:\n${musicRoot}`,
      );
    }

    throw error;
  }

  for (const directory of themeDirectories) {
    if (!directory.isDirectory()) {
      continue;
    }

    const theme = directory.name;
    const themePath = path.join(
      musicRoot,
      theme,
    );

    const files = await fs.readdir(
      themePath,
      {
        withFileTypes: true,
      },
    );

    const tracks = files
      .filter(
        (file) =>
          file.isFile() &&
          isSupportedAudioFile(file.name),
      )
      .map((file) =>
        normalizePath(
          path.join(
            "assets",
            "audio",
            "music",
            theme,
            file.name,
          ),
        ),
      )
      .sort((a, b) =>
        a.localeCompare(b, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      );

    manifest[theme] = tracks;
  }

  return manifest;
};

const createTypescriptManifest = (
  manifest,
) => {
  const serializedManifest =
    JSON.stringify(manifest, null, 2);

  return `/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const musicManifest = ${serializedManifest} as const;

export type MusicTheme =
  keyof typeof musicManifest;

export type MusicAssetPath =
  (typeof musicManifest)[MusicTheme][number];
`;
};

const main = async () => {
  const manifest = await readMusicLibrary();

  await fs.mkdir(
    path.dirname(jsonManifestOutput),
    {
      recursive: true,
    },
  );

  await fs.mkdir(
    path.dirname(
      typescriptManifestOutput,
    ),
    {
      recursive: true,
    },
  );

  await fs.writeFile(
    jsonManifestOutput,
    `${JSON.stringify(
      manifest,
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fs.writeFile(
    typescriptManifestOutput,
    createTypescriptManifest(manifest),
    "utf8",
  );

  const totalTracks = Object.values(
    manifest,
  ).reduce(
    (total, tracks) =>
      total + tracks.length,
    0,
  );

  console.log(
    `JSON manifest: ${jsonManifestOutput}`,
  );

  console.log(
    `TypeScript manifest: ${typescriptManifestOutput}`,
  );

  console.log(
    `Themes: ${Object.keys(manifest).length}`,
  );

  console.log(
    `Tracks: ${totalTracks}`,
  );
};

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});