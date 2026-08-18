import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const supportedAudioExtensions = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".flac",
  ".ogg",
]);

const supportedOverlayExtensions = new Set([
  ".mp4",
  ".webm",
  ".mov",
]);

const supportedImageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
]);

const normalizePath = (value) =>
  value.split(path.sep).join("/");

const isSupportedAudioFile = (fileName) =>
  supportedAudioExtensions.has(
    path.extname(fileName).toLowerCase(),
  );

const listFilesRecursively = async (directoryPath) => {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return listFilesRecursively(entryPath);
      }

      return entry.isFile() ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat();
};

const readCategorizedLibrary = async ({
  sourceRoot,
  publicPath,
  supportedExtensions = supportedAudioExtensions,
}) => {
  const manifest = {};

  const categoryDirectories = await fs.readdir(
    sourceRoot,
    {
      withFileTypes: true,
    },
  );

  for (const directory of categoryDirectories) {
    if (!directory.isDirectory()) {
      continue;
    }

    const category = directory.name.toLowerCase();

    const categoryPath = path.join(
      sourceRoot,
      directory.name,
    );

    const files = await listFilesRecursively(categoryPath);

    manifest[category] = files
      .filter((filePath) =>
        supportedExtensions.has(
          path.extname(filePath).toLowerCase(),
        ),
      )
      .map((filePath) =>
        normalizePath(
          path.join(
            publicPath,
            directory.name,
            path.relative(categoryPath, filePath),
          ),
        ),
      )
      .sort((a, b) =>
        a.localeCompare(b, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }

  return manifest;
};

const createTypescriptManifest = ({
  exportName,
  typeName,
  manifest,
}) => `/**
 * AUTO-GENERATED FILE.
 *
 * Do not edit manually.
 * Run: npm run generate-assets
 */

export const ${exportName} = ${JSON.stringify(
  manifest,
  null,
  2,
)} as const;

export type ${typeName} =
  keyof typeof ${exportName};

export type ${typeName}AssetPath =
  (typeof ${exportName})[${typeName}][number];
`;

const writeManifest = async ({
  manifest,
  jsonOutput,
  typescriptOutput,
  exportName,
  typeName,
}) => {
  await fs.mkdir(path.dirname(jsonOutput), {
    recursive: true,
  });

  await fs.mkdir(
    path.dirname(typescriptOutput),
    {
      recursive: true,
    },
  );

  await fs.writeFile(
    jsonOutput,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  await fs.writeFile(
    typescriptOutput,
    createTypescriptManifest({
      exportName,
      typeName,
      manifest,
    }),
    "utf8",
  );
};

const main = async () => {
  const musicManifest =
    await readCategorizedLibrary({
      sourceRoot: path.join(
        projectRoot,
        "public",
        "assets",
        "audio",
        "music",
      ),
      publicPath: path.join(
        "assets",
        "audio",
        "music",
      ),
    });

  const ambienceManifest =
    await readCategorizedLibrary({
      sourceRoot: path.join(
        projectRoot,
        "public",
        "assets",
        "audio",
        "Ambience",
      ),
      publicPath: path.join(
        "assets",
        "audio",
        "Ambience",
      ),
    });

  const sfxManifest =
    await readCategorizedLibrary({
      sourceRoot: path.join(
        projectRoot,
        "public",
        "assets",
        "audio",
        "SFX",
      ),
      publicPath: path.join(
        "assets",
        "audio",
        "SFX",
      ),
    });
  await writeManifest({
    manifest: musicManifest,
    jsonOutput: path.join(
      projectRoot,
      "public",
      "assets",
      "audio",
      "music-manifest.json",
    ),
    typescriptOutput: path.join(
      projectRoot,
      "src",
      "generated",
      "musicManifest.ts",
    ),
    exportName: "musicManifest",
    typeName: "MusicTheme",
  });


  const overlayManifest =
    await readCategorizedLibrary({
      sourceRoot: path.join(
        projectRoot,
        "public",
        "assets",
        "Overlays",
      ),
      publicPath: path.join(
        "assets",
        "Overlays",
      ),
      supportedExtensions:
        supportedOverlayExtensions,
    });


  const readFlatLibrary = async ({
    sourceRoot,
    publicPath,
    supportedExtensions,
  }) => {
    const files = await fs.readdir(sourceRoot, {
      withFileTypes: true,
    });

    const manifest = {};

    for (const file of files) {
      if (
        !file.isFile() ||
        !supportedExtensions.has(
          path.extname(file.name).toLowerCase(),
        )
      ) {
        continue;
      }

      const category = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+\d+$/, "")
        .trim()
        .toLowerCase();

      manifest[category] ??= [];

      manifest[category].push(
        normalizePath(
          path.join(publicPath, file.name),
        ),
      );
    }

    for (const assets of Object.values(manifest)) {
      assets.sort((a, b) =>
        a.localeCompare(b, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      );
    }

    return manifest;
  };

  const historicalManifest =
    await readFlatLibrary({
      sourceRoot: path.join(
        projectRoot,
        "public",
        "assets",
        "Historical",
      ),
      publicPath: path.join(
        "assets",
        "Historical",
      ),
      supportedExtensions:
        supportedImageExtensions,
    });
  await writeManifest({
    manifest: ambienceManifest,
    jsonOutput: path.join(
      projectRoot,
      "public",
      "assets",
      "audio",
      "ambience-manifest.json",
    ),
    typescriptOutput: path.join(
      projectRoot,
      "src",
      "generated",
      "ambienceManifest.ts",
    ),
    exportName: "ambienceManifest",
    typeName: "AmbienceTheme",
  });

  await writeManifest({
    manifest: sfxManifest,
    jsonOutput: path.join(
      projectRoot,
      "public",
      "assets",
      "audio",
      "sfx-manifest.json",
    ),
    typescriptOutput: path.join(
      projectRoot,
      "src",
      "generated",
      "sfxManifest.ts",
    ),
    exportName: "sfxManifest",
    typeName: "SfxCategory",
  });

  await writeManifest({
    manifest: overlayManifest,
    jsonOutput: path.join(
      projectRoot,
      "public",
      "assets",
      "Overlays",
      "overlay-manifest.json",
    ),
    typescriptOutput: path.join(
      projectRoot,
      "src",
      "generated",
      "overlayManifest.ts",
    ),
    exportName: "overlayManifest",
    typeName: "OverlayCategory",
  });

  await writeManifest({
    manifest: historicalManifest,
    jsonOutput: path.join(
      projectRoot,
      "public",
      "assets",
      "Historical",
      "historical-manifest.json",
    ),
    typescriptOutput: path.join(
      projectRoot,
      "src",
      "generated",
      "historicalManifest.ts",
    ),
    exportName: "historicalManifest",
    typeName: "HistoricalCategory",
  });
  console.log("Music and ambience manifests generated.");
};

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});