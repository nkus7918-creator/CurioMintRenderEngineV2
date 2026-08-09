import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_0_countries.geojson";

const SOURCE_VERSION = "Natural Earth v5.1.1";
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 700;
const PADDING = 54;

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "..");

const publicOutputDir = path.join(
  repoRoot,
  "public",
  "assets",
  "Maps",
  "Countries",
);

const manifestJsonPath = path.join(
  publicOutputDir,
  "country-map-manifest.json",
);

const manifestTsPath = path.join(
  repoRoot,
  "src",
  "templates",
  "curiomint-documentary",
  "maps",
  "countryMapManifest.generated.ts",
);

const ensureDir = (dir) => {
  fs.mkdirSync(dir, {
    recursive: true,
  });
};

const normalizeCode = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const isIso2 = (value) =>
  /^[A-Z]{2}$/.test(value);

const pickIso2 = (properties) => {
  const candidates = [
    properties.ISO_A2_EH,
    properties.ISO_A2,
    properties.WB_A2,
    properties.POSTAL,
  ]
    .map(normalizeCode)
    .filter(isIso2);

  return candidates[0] ?? null;
};

const pickIso3 = (properties) => {
  const candidates = [
    properties.ISO_A3_EH,
    properties.ISO_A3,
    properties.ADM0_A3,
    properties.WB_A3,
  ]
    .map(normalizeCode)
    .filter((value) =>
      /^[A-Z]{3}$/.test(value),
    );

  return candidates[0] ?? null;
};

const pickName = (properties) =>
  String(
    properties.NAME_EN ??
      properties.ADMIN ??
      properties.NAME_LONG ??
      properties.NAME ??
      "Unknown",
  ).trim();

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const geometryToRings = (geometry) => {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat();
  }

  return [];
};

const mod360 = (longitude) => {
  const result =
    ((longitude % 360) + 360) % 360;

  return result;
};

/**
 * Find the smallest circular longitude interval containing
 * all points. This prevents dateline-crossing countries such
 * as Fiji from being stretched across almost the whole SVG.
 */
const buildLongitudeNormalizer = (rings) => {
  const values = [];

  for (const ring of rings) {
    for (const point of ring) {
      const longitude =
        Number(point?.[0]);

      if (Number.isFinite(longitude)) {
        values.push(
          mod360(longitude),
        );
      }
    }
  }

  if (values.length === 0) {
    return (longitude) =>
      Number(longitude);
  }

  const sorted =
    [...values].sort(
      (a, b) => a - b,
    );

  let largestGap = -1;
  let start = sorted[0];

  for (
    let index = 0;
    index < sorted.length;
    index += 1
  ) {
    const current =
      sorted[index];

    const next =
      index === sorted.length - 1
        ? sorted[0] + 360
        : sorted[index + 1];

    const gap =
      next - current;

    if (gap > largestGap) {
      largestGap = gap;

      start =
        index === sorted.length - 1
          ? sorted[0]
          : sorted[index + 1];
    }
  }

  return (longitude) => {
    let normalized =
      mod360(
        Number(longitude),
      );

    while (
      normalized < start
    ) {
      normalized += 360;
    }

    return normalized;
  };
};

const mercatorY = (latitude) => {
  const clamped =
    Math.max(
      -85,
      Math.min(
        85,
        Number(latitude),
      ),
    );

  const radians =
    (clamped * Math.PI) /
    180;

  return Math.log(
    Math.tan(
      Math.PI / 4 +
        radians / 2,
    ),
  );
};

const projectGeometry = (geometry) => {
  const rings =
    geometryToRings(geometry);

  if (rings.length === 0) {
    return null;
  }

  const normalizeLongitude =
    buildLongitudeNormalizer(
      rings,
    );

  const projectedRings = [];
  const allPoints = [];

  for (const ring of rings) {
    const projectedRing = [];

    for (const coordinate of ring) {
      if (
        !Array.isArray(coordinate) ||
        coordinate.length < 2
      ) {
        continue;
      }

      const longitude =
        Number(coordinate[0]);

      const latitude =
        Number(coordinate[1]);

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        continue;
      }

      const point = {
        x: normalizeLongitude(
          longitude,
        ),
        y: mercatorY(latitude),
      };

      projectedRing.push(point);
      allPoints.push(point);
    }

    if (
      projectedRing.length >= 3
    ) {
      projectedRings.push(
        projectedRing,
      );
    }
  }

  if (
    allPoints.length === 0 ||
    projectedRings.length === 0
  ) {
    return null;
  }

  const minX =
    Math.min(
      ...allPoints.map(
        (point) => point.x,
      ),
    );

  const maxX =
    Math.max(
      ...allPoints.map(
        (point) => point.x,
      ),
    );

  const minY =
    Math.min(
      ...allPoints.map(
        (point) => point.y,
      ),
    );

  const maxY =
    Math.max(
      ...allPoints.map(
        (point) => point.y,
      ),
    );

  const sourceWidth =
    Math.max(
      0.000001,
      maxX - minX,
    );

  const sourceHeight =
    Math.max(
      0.000001,
      maxY - minY,
    );

  const availableWidth =
    VIEWBOX_WIDTH -
    PADDING * 2;

  const availableHeight =
    VIEWBOX_HEIGHT -
    PADDING * 2;

  const scale =
    Math.min(
      availableWidth /
        sourceWidth,
      availableHeight /
        sourceHeight,
    );

  const renderedWidth =
    sourceWidth * scale;

  const renderedHeight =
    sourceHeight * scale;

  const offsetX =
    (VIEWBOX_WIDTH -
      renderedWidth) /
    2;

  const offsetY =
    (VIEWBOX_HEIGHT -
      renderedHeight) /
    2;

  const toScreen = (
    point,
  ) => ({
    x:
      offsetX +
      (point.x - minX) *
        scale,

    y:
      offsetY +
      (maxY - point.y) *
        scale,
  });

  const formatNumber = (
    value,
  ) =>
    Number(value.toFixed(2));

  const pathParts = [];

  for (const ring of projectedRings) {
    const points =
      ring.map(toScreen);

    const roundedPoints = [];

    for (const point of points) {
      const rounded = {
        x: formatNumber(
          point.x,
        ),
        y: formatNumber(
          point.y,
        ),
      };

      const previous =
        roundedPoints[
          roundedPoints.length - 1
        ];

      if (
        previous &&
        previous.x ===
          rounded.x &&
        previous.y ===
          rounded.y
      ) {
        continue;
      }

      roundedPoints.push(
        rounded,
      );
    }

    if (
      roundedPoints.length < 3
    ) {
      continue;
    }

    pathParts.push(
      `M ${roundedPoints[0].x} ${roundedPoints[0].y}`,
    );

    for (
      let index = 1;
      index <
      roundedPoints.length;
      index += 1
    ) {
      pathParts.push(
        `L ${roundedPoints[index].x} ${roundedPoints[index].y}`,
      );
    }

    pathParts.push("Z");
  }

  if (pathParts.length === 0) {
    return null;
  }

  return pathParts.join(" ");
};

const createSvg = ({
  code,
  name,
  pathData,
}) => `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}"
  role="img"
  aria-label="${escapeXml(name)} map outline"
>
  <title>${escapeXml(name)}</title>
  <metadata>
    CurioMint country outline.
    Source: ${SOURCE_VERSION}, public domain.
    Country code: ${escapeXml(code)}.
  </metadata>
  <path
    d="${pathData}"
    fill="#F4F1EA"
    fill-rule="evenodd"
    clip-rule="evenodd"
    stroke="#D9B75E"
    stroke-width="5"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
</svg>
`;

const fetchDataset = async () => {
  console.log(
    `Downloading ${SOURCE_VERSION} country GeoJSON...`,
  );

  const response =
    await fetch(
      SOURCE_URL,
      {
        headers: {
          "User-Agent":
            "CurioMintRenderEngineV2-country-map-generator",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Natural Earth download failed: ${response.status} ${response.statusText}`,
    );
  }

  const json =
    await response.json();

  if (
    json?.type !==
      "FeatureCollection" ||
    !Array.isArray(
      json.features,
    )
  ) {
    throw new Error(
      "Natural Earth response is not a valid FeatureCollection.",
    );
  }

  return json;
};

const main = async () => {
  ensureDir(
    publicOutputDir,
  );

  const dataset =
    await fetchDataset();

  const manifest = {};
  const skipped = [];
  const duplicateCodes = [];

  for (
    const feature of
    dataset.features
  ) {
    const properties =
      feature.properties ??
      {};

    const iso2 =
      pickIso2(properties);

    const iso3 =
      pickIso3(properties);

    const name =
      pickName(properties);

    if (!iso2) {
      skipped.push({
        name,
        reason:
          "No usable ISO-2 code",
        adm0A3:
          properties.ADM0_A3 ??
          null,
      });

      continue;
    }

    if (manifest[iso2]) {
      duplicateCodes.push({
        code: iso2,
        existing:
          manifest[iso2].name,
        skipped: name,
      });

      continue;
    }

    const pathData =
      projectGeometry(
        feature.geometry,
      );

    if (!pathData) {
      skipped.push({
        code: iso2,
        name,
        reason:
          "No renderable polygon geometry",
      });

      continue;
    }

    const fileName =
      `${iso2.toLowerCase()}.svg`;

    const absoluteFilePath =
      path.join(
        publicOutputDir,
        fileName,
      );

    fs.writeFileSync(
      absoluteFilePath,
      createSvg({
        code: iso2,
        name,
        pathData,
      }),
      "utf8",
    );

    manifest[iso2] = {
      code: iso2,
      iso3,
      name,
      adm0A3:
        normalizeCode(
          properties.ADM0_A3,
        ) || null,
      file:
        `assets/Maps/Countries/${fileName}`,
    };
  }

  const sortedEntries =
    Object.entries(manifest)
      .sort(
        ([codeA], [codeB]) =>
          codeA.localeCompare(
            codeB,
          ),
      );

  const sortedManifest =
    Object.fromEntries(
      sortedEntries,
    );

  if (
    sortedEntries.length < 200
  ) {
    throw new Error(
      `Only ${sortedEntries.length} country SVGs were generated. Expected at least 200.`,
    );
  }

  fs.writeFileSync(
    manifestJsonPath,
    JSON.stringify(
      {
        source: {
          name:
            SOURCE_VERSION,
          url: SOURCE_URL,
          license:
            "Public domain",
          boundaryView:
            "Natural Earth default de facto boundaries",
        },
        generatedCount:
          sortedEntries.length,
        skipped,
        duplicateCodes,
        countries:
          sortedManifest,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const generatedTs = `/*
 * AUTO-GENERATED by scripts/generate-country-maps.mjs
 *
 * Source: ${SOURCE_VERSION}
 * License: Public domain
 *
 * Do not edit by hand.
 */
export interface CountryMapAsset {
  code: string;
  iso3: string | null;
  name: string;
  adm0A3: string | null;
  file: string;
}

export const COUNTRY_MAP_ASSETS = ${JSON.stringify(
    sortedManifest,
    null,
    2,
  )} as const satisfies Record<string, CountryMapAsset>;

export const resolveCountryMapAsset = (
  code: string,
): CountryMapAsset | null => {
  const normalized =
    String(code ?? "")
      .trim()
      .toUpperCase();

  return (
    (
      COUNTRY_MAP_ASSETS as Record<
        string,
        CountryMapAsset
      >
    )[normalized] ??
    null
  );
};

export const hasCountryMapAsset = (
  code: string,
): boolean =>
  resolveCountryMapAsset(code) !== null;
`;

  fs.writeFileSync(
    manifestTsPath,
    generatedTs,
    "utf8",
  );

  console.log("");
  console.log(
    `Generated ${sortedEntries.length} local country SVGs.`,
  );
  console.log(
    `Skipped ${skipped.length} Natural Earth features without a usable ISO-2/renderable shape.`,
  );
  console.log(
    `Duplicate ISO-2 features skipped: ${duplicateCodes.length}.`,
  );
  console.log(
    `Assets: ${publicOutputDir}`,
  );
  console.log(
    `Manifest: ${manifestJsonPath}`,
  );
  console.log(
    `TypeScript resolver: ${manifestTsPath}`,
  );
};

await main();