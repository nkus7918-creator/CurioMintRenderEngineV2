import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_0_countries.geojson";

const SOURCE_VERSION =
  "Natural Earth v5.1.1";

const WIDTH = 1200;
const HEIGHT = 600;

const currentFile =
  fileURLToPath(
    import.meta.url,
  );

const repoRoot =
  path.resolve(
    path.dirname(currentFile),
    "..",
  );

const outputRoot =
  path.join(
    repoRoot,
    "public",
    "assets",
    "Maps",
    "Locator",
  );

const overlayDir =
  path.join(
    outputRoot,
    "Countries",
  );

const manifestTsPath =
  path.join(
    repoRoot,
    "src",
    "templates",
    "curiomint-documentary",
    "maps",
    "countryLocatorManifest.generated.ts",
  );

const ensureDir = (dir) => {
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    },
  );
};

const normalizeCode = (
  value,
) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const isIso2 = (
  value,
) =>
  /^[A-Z]{2}$/.test(value);

const pickIso2 = (
  properties,
) => {
  const candidates = [
    properties.ISO_A2_EH,
    properties.ISO_A2,
    properties.WB_A2,
    properties.POSTAL,
  ]
    .map(normalizeCode)
    .filter(isIso2);

  return (
    candidates[0] ??
    null
  );
};

const pickName = (
  properties,
) =>
  String(
    properties.NAME_EN ??
      properties.ADMIN ??
      properties.NAME_LONG ??
      properties.NAME ??
      "Unknown",
  ).trim();

const escapeXml = (
  value,
) =>
  String(value)
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&apos;",
    );

const clamp = (
  value,
  min,
  max,
) =>
  Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );

const projectPoint = (
  longitude,
  latitude,
) => {
  const lon =
    clamp(
      Number(longitude),
      -180,
      180,
    );

  const lat =
    clamp(
      Number(latitude),
      -90,
      90,
    );

  return {
    x:
      ((lon + 180) /
        360) *
      WIDTH,

    y:
      ((90 - lat) /
        180) *
      HEIGHT,
  };
};

const format = (
  value,
) =>
  Number(
    value.toFixed(2),
  );

const geometryToPolygons = (
  geometry,
) => {
  if (!geometry) {
    return [];
  }

  if (
    geometry.type ===
    "Polygon"
  ) {
    return [
      geometry.coordinates,
    ];
  }

  if (
    geometry.type ===
    "MultiPolygon"
  ) {
    return geometry.coordinates;
  }

  return [];
};

const ringToPath = (
  ring,
) => {
  if (
    !Array.isArray(ring) ||
    ring.length < 3
  ) {
    return "";
  }

  const points = [];

  for (
    const coordinate of ring
  ) {
    if (
      !Array.isArray(
        coordinate,
      ) ||
      coordinate.length < 2
    ) {
      continue;
    }

    const longitude =
      Number(coordinate[0]);

    const latitude =
      Number(coordinate[1]);

    if (
      !Number.isFinite(
        longitude,
      ) ||
      !Number.isFinite(
        latitude,
      )
    ) {
      continue;
    }

    points.push(
      projectPoint(
        longitude,
        latitude,
      ),
    );
  }

  if (
    points.length < 3
  ) {
    return "";
  }

  const parts = [
    `M ${format(points[0].x)} ${format(points[0].y)}`,
  ];

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    parts.push(
      `L ${format(points[index].x)} ${format(points[index].y)}`,
    );
  }

  parts.push("Z");

  return parts.join(" ");
};

const geometryToPath = (
  geometry,
) => {
  const polygons =
    geometryToPolygons(
      geometry,
    );

  const parts = [];

  for (
    const polygon of polygons
  ) {
    for (
      const ring of polygon
    ) {
      const path =
        ringToPath(ring);

      if (path) {
        parts.push(path);
      }
    }
  }

  return parts.join(" ");
};

const getFallbackCenter = (
  geometry,
) => {
  const points = [];

  for (
    const polygon of
    geometryToPolygons(
      geometry,
    )
  ) {
    for (
      const ring of polygon
    ) {
      for (
        const coordinate of ring
      ) {
        if (
          !Array.isArray(
            coordinate,
          ) ||
          coordinate.length < 2
        ) {
          continue;
        }

        const lon =
          Number(
            coordinate[0],
          );

        const lat =
          Number(
            coordinate[1],
          );

        if (
          Number.isFinite(lon) &&
          Number.isFinite(lat)
        ) {
          points.push({
            lon,
            lat,
          });
        }
      }
    }
  }

  if (
    points.length === 0
  ) {
    return {
      lon: 0,
      lat: 0,
    };
  }

  const minLon =
    Math.min(
      ...points.map(
        (point) =>
          point.lon,
      ),
    );

  const maxLon =
    Math.max(
      ...points.map(
        (point) =>
          point.lon,
      ),
    );

  const minLat =
    Math.min(
      ...points.map(
        (point) =>
          point.lat,
      ),
    );

  const maxLat =
    Math.max(
      ...points.map(
        (point) =>
          point.lat,
      ),
    );

  return {
    lon:
      (minLon + maxLon) /
      2,

    lat:
      (minLat + maxLat) /
      2,
  };
};

const getMarker = (
  feature,
) => {
  const properties =
    feature.properties ??
    {};

  const labelLon =
    Number(
      properties.LABEL_X,
    );

  const labelLat =
    Number(
      properties.LABEL_Y,
    );

  const fallback =
    getFallbackCenter(
      feature.geometry,
    );

  const longitude =
    Number.isFinite(
      labelLon,
    )
      ? labelLon
      : fallback.lon;

  const latitude =
    Number.isFinite(
      labelLat,
    )
      ? labelLat
      : fallback.lat;

  const projected =
    projectPoint(
      longitude,
      latitude,
    );

  return {
    xPercent:
      Number(
        (
          (projected.x /
            WIDTH) *
          100
        ).toFixed(3),
      ),

    yPercent:
      Number(
        (
          (projected.y /
            HEIGHT) *
          100
        ).toFixed(3),
      ),
  };
};

const fetchDataset =
  async () => {
    console.log(
      `Downloading ${SOURCE_VERSION} for locator maps...`,
    );

    const response =
      await fetch(
        SOURCE_URL,
        {
          headers: {
            "User-Agent":
              "CurioMintRenderEngineV2-country-locator-generator",
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

const createWorldBaseSvg = (
  paths,
) => `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${WIDTH} ${HEIGHT}"
>
  <metadata>
    CurioMint world locator base.
    Source: ${SOURCE_VERSION}, public domain.
  </metadata>
  <rect
    width="${WIDTH}"
    height="${HEIGHT}"
    fill="#11151A"
  />
  <g
    fill="#323841"
    stroke="#626A75"
    stroke-width="1.1"
    stroke-linejoin="round"
    fill-rule="evenodd"
    clip-rule="evenodd"
  >
    ${paths
      .map(
        (pathData) =>
          `<path d="${pathData}" />`,
      )
      .join("\n    ")}
  </g>
</svg>
`;

const createCountryOverlaySvg = ({
  name,
  code,
  pathData,
}) => `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${WIDTH} ${HEIGHT}"
  role="img"
  aria-label="${escapeXml(name)} location"
>
  <title>${escapeXml(name)}</title>
  <metadata>
    CurioMint locator highlight.
    Source: ${SOURCE_VERSION}, public domain.
    Country code: ${escapeXml(code)}.
  </metadata>
  <path
    d="${pathData}"
    fill="#D9B75E"
    stroke="#FFF7D6"
    stroke-width="2.2"
    stroke-linejoin="round"
    fill-rule="evenodd"
    clip-rule="evenodd"
    vector-effect="non-scaling-stroke"
  />
</svg>
`;

const main = async () => {
  ensureDir(outputRoot);
  ensureDir(overlayDir);

  const dataset =
    await fetchDataset();

  const worldPaths = [];
  const manifest = {};
  const seenCodes =
    new Set();

  for (
    const feature of
    dataset.features
  ) {
    const pathData =
      geometryToPath(
        feature.geometry,
      );

    if (!pathData) {
      continue;
    }

    worldPaths.push(
      pathData,
    );

    const properties =
      feature.properties ??
      {};

    const code =
      pickIso2(
        properties,
      );

    if (
      !code ||
      seenCodes.has(code)
    ) {
      continue;
    }

    seenCodes.add(code);

    const name =
      pickName(
        properties,
      );

    const marker =
      getMarker(feature);

    const fileName =
      `${code.toLowerCase()}.svg`;

    fs.writeFileSync(
      path.join(
        overlayDir,
        fileName,
      ),
      createCountryOverlaySvg({
        name,
        code,
        pathData,
      }),
      "utf8",
    );

    manifest[code] = {
      code,
      name,
      file:
        `assets/Maps/Locator/Countries/${fileName}`,
      markerXPercent:
        marker.xPercent,
      markerYPercent:
        marker.yPercent,
    };
  }

  const sortedEntries =
    Object.entries(
      manifest,
    ).sort(
      ([a], [b]) =>
        a.localeCompare(b),
    );

  if (
    sortedEntries.length <
    200
  ) {
    throw new Error(
      `Only ${sortedEntries.length} locator overlays were generated.`,
    );
  }

  fs.writeFileSync(
    path.join(
      outputRoot,
      "world-base.svg",
    ),
    createWorldBaseSvg(
      worldPaths,
    ),
    "utf8",
  );

  const sortedManifest =
    Object.fromEntries(
      sortedEntries,
    );

  const generatedTs = `/*
 * AUTO-GENERATED by scripts/generate-country-locator-maps.mjs
 *
 * Source: ${SOURCE_VERSION}
 * License: Public domain
 *
 * Do not edit by hand.
 */
export interface CountryLocatorAsset {
  code: string;
  name: string;
  file: string;
  markerXPercent: number;
  markerYPercent: number;
}

export const COUNTRY_LOCATOR_WORLD_BASE =
  "assets/Maps/Locator/world-base.svg";

export const COUNTRY_LOCATOR_ASSETS = ${JSON.stringify(
    sortedManifest,
    null,
    2,
  )} as const satisfies Record<string, CountryLocatorAsset>;

export const resolveCountryLocatorAsset = (
  code: string,
): CountryLocatorAsset | null => {
  const normalized =
    String(code ?? "")
      .trim()
      .toUpperCase();

  return (
    (
      COUNTRY_LOCATOR_ASSETS as Record<
        string,
        CountryLocatorAsset
      >
    )[normalized] ??
    null
  );
};
`;

  fs.writeFileSync(
    manifestTsPath,
    generatedTs,
    "utf8",
  );

  console.log("");
  console.log(
    `Generated ${sortedEntries.length} country locator overlays.`,
  );
  console.log(
    `World base: ${path.join(outputRoot, "world-base.svg")}`,
  );
  console.log(
    `Manifest: ${manifestTsPath}`,
  );
};

await main();