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

const normalizePath = (value) =>
  value.split(path.sep).join("/");

const isSupportedAudioFile = (fileName) =>
  supportedAudioExtensions.has(
    path.extname(fileName).toLowerCase(),
  );

const readCategorizedLibrary = async ({
  sourceRoot,
  publicPath,
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

    const files = await fs.readdir(categoryPath, {
      withFileTypes: true,
    });

    manifest[category] = files
      .filter(
        (file) =>
          file.isFile() &&
          isSupportedAudioFile(file.name),
      )
      .map((file) =>
        normalizePath(
          path.join(
            publicPath,
            directory.name,
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