import {
  createHash,
} from "crypto";

import fs from "fs";
import path from "path";

import {
  env,
} from "../config/env";

const CLIOPATRIA_VERSION =
  "v0.2.0";

const CLIOPATRIA_DATA_DIR =
  path.resolve(
    process.cwd(),
    ".data",
    "cliopatria",
    CLIOPATRIA_VERSION,
  );

const CLIOPATRIA_INDEX_PATH =
  path.join(
    CLIOPATRIA_DATA_DIR,
    "index.json",
  );

const CLIOPATRIA_ENTITIES_DIR =
  path.join(
    CLIOPATRIA_DATA_DIR,
    "entities",
  );

const HISTORICAL_MAP_CACHE_DIR =
  path.resolve(
    "/app/media-cache",
    "historical-maps",
  );

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 600;

type JsonRecord =
  Record<string, unknown>;

type CliopatriaCatalogEntity = {
  id: string;
  name: string;
  normalizedName: string;
  wikidata: string | null;
  wikipedia: string | null;
  firstYear: number;
  lastYear: number;
  recordCount: number;
  file: string;
};

type CliopatriaIndex = {
  source?: JsonRecord;
  stats?: JsonRecord;
  entities: CliopatriaCatalogEntity[];
};

type CliopatriaGeometry = {
  type?: string;
  coordinates?: unknown;
};

type CliopatriaRecord = {
  featureIndex?: number;
  name: string;
  fromYear: number;
  toYear: number;
  areaKm2?: number | null;
  type?: string | null;
  wikipedia?: string | null;
  wikidata?: string | null;
  seshatId?: string | null;
  geometry: CliopatriaGeometry;
};

type CliopatriaEntityFile = {
  entity: {
    id: string;
    name: string;
    normalizedName: string;
    wikidata?: string | null;
    wikipedia?: string | null;
    firstYear: number;
    lastYear: number;
  };

  records: CliopatriaRecord[];
};

export type HistoricalMapResolution = {
  entityQuery: string;
  year: number;

  entity: {
    id: string;
    name: string;
    wikidata: string | null;
    wikipedia: string | null;
  };

  fromYear: number;
  toYear: number;
  areaKm2: number | null;

  matchedRecordCount: number;

  mapPath: string;
  mapUrl: string;

  sourceCredit: string;
};

let indexCache:
  | CliopatriaIndex
  | null = null;

const isRecord = (
  value: unknown,
): value is JsonRecord =>
  Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value),
  );

const normalizeText = (
  value: unknown,
): string =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

const clamp = (
  value: number,
  min: number,
  max: number,
): number =>
  Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );

const formatNumber = (
  value: number,
): number =>
  Number(
    value.toFixed(2),
  );

const projectPoint = (
  longitude: number,
  latitude: number,
) => ({
  x:
    ((clamp(
      longitude,
      -180,
      180,
    ) +
      180) /
      360) *
    MAP_WIDTH,

  y:
    ((90 -
      clamp(
        latitude,
        -90,
        90,
      )) /
      180) *
    MAP_HEIGHT,
});

const toPolygons = (
  geometry: CliopatriaGeometry,
): unknown[][][] => {
  if (
    geometry.type ===
      "Polygon" &&
    Array.isArray(
      geometry.coordinates,
    )
  ) {
    return [
      geometry.coordinates as unknown[][],
    ];
  }

  if (
    geometry.type ===
      "MultiPolygon" &&
    Array.isArray(
      geometry.coordinates,
    )
  ) {
    return geometry.coordinates as unknown[][][];
  }

  return [];
};

const splitRingAtDateLine = (
  ring: unknown[],
): Array<
  Array<[number, number]>
> => {
  const segments:
    Array<
      Array<[number, number]>
    > = [];

  let current:
    Array<[number, number]> =
    [];

  let previousLongitude:
    | number
    | null = null;

  for (const rawPoint of ring) {
    if (
      !Array.isArray(rawPoint) ||
      rawPoint.length < 2
    ) {
      continue;
    }

    const longitude =
      Number(rawPoint[0]);

    const latitude =
      Number(rawPoint[1]);

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

    if (
      previousLongitude !==
        null &&
      Math.abs(
        longitude -
          previousLongitude,
      ) > 180 &&
      current.length >= 3
    ) {
      segments.push(current);
      current = [];
    }

    current.push([
      longitude,
      latitude,
    ]);

    previousLongitude =
      longitude;
  }

  if (current.length >= 3) {
    segments.push(current);
  }

  return segments;
};

const ringToPath = (
  ring: unknown[],
): string => {
  const segments =
    splitRingAtDateLine(ring);

  const pathParts:
    string[] = [];

  for (const segment of segments) {
    const points =
      segment.map(
        ([
          longitude,
          latitude,
        ]) =>
          projectPoint(
            longitude,
            latitude,
          ),
      );

    if (points.length < 3) {
      continue;
    }

    pathParts.push(
      `M ${formatNumber(points[0].x)} ${formatNumber(points[0].y)}`,
    );

    for (
      let index = 1;
      index < points.length;
      index += 1
    ) {
      pathParts.push(
        `L ${formatNumber(points[index].x)} ${formatNumber(points[index].y)}`,
      );
    }

    pathParts.push("Z");
  }

  return pathParts.join(" ");
};

const geometryToPath = (
  geometry: CliopatriaGeometry,
): string => {
  const pathParts:
    string[] = [];

  for (
    const polygon of
    toPolygons(geometry)
  ) {
    for (const rawRing of polygon) {
      if (!Array.isArray(rawRing)) {
        continue;
      }

      const pathData =
        ringToPath(rawRing);

      if (pathData) {
        pathParts.push(
          pathData,
        );
      }
    }
  }

  return pathParts.join(" ");
};

const escapeXml = (
  value: unknown,
): string =>
  String(value ?? "")
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

const loadIndex = ():
  CliopatriaIndex => {
  if (indexCache) {
    return indexCache;
  }

  if (
    !fs.existsSync(
      CLIOPATRIA_INDEX_PATH,
    )
  ) {
    throw new Error(
      `Cliopatria local index is missing at ${CLIOPATRIA_INDEX_PATH}.`,
    );
  }

  const parsed =
    JSON.parse(
      fs.readFileSync(
        CLIOPATRIA_INDEX_PATH,
        "utf8",
      ),
    ) as CliopatriaIndex;

  if (
    !Array.isArray(
      parsed.entities,
    )
  ) {
    throw new Error(
      "Cliopatria index has no entities array.",
    );
  }

  indexCache = parsed;

  return parsed;
};

const loadEntity = (
  entity:
    CliopatriaCatalogEntity,
): CliopatriaEntityFile => {
  const entityPath =
    path.join(
      CLIOPATRIA_ENTITIES_DIR,
      entity.file,
    );

  if (
    !fs.existsSync(
      entityPath,
    )
  ) {
    throw new Error(
      `Cliopatria entity file is missing: ${entity.file}`,
    );
  }

  return JSON.parse(
    fs.readFileSync(
      entityPath,
      "utf8",
    ),
  ) as CliopatriaEntityFile;
};

const scoreEntity = (
  entity:
    CliopatriaCatalogEntity,
  normalizedQuery: string,
  year: number,
): number => {
  let score = 0;

  if (
    entity.normalizedName ===
    normalizedQuery
  ) {
    score += 1000;
  } else if (
    entity.normalizedName.startsWith(
      normalizedQuery,
    )
  ) {
    score += 600;
  } else if (
    entity.normalizedName.includes(
      normalizedQuery,
    )
  ) {
    score += 450;
  } else if (
    normalizedQuery.includes(
      entity.normalizedName,
    )
  ) {
    score += 300;
  }

  if (
    entity.firstYear <= year &&
    entity.lastYear >= year
  ) {
    score += 250;
  }

  score -=
    Math.abs(
      entity.normalizedName.length -
        normalizedQuery.length,
    );

  return score;
};

const findCandidates = (
  query: string,
  year: number,
): CliopatriaCatalogEntity[] => {
  const index =
    loadIndex();

  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  return index.entities
    .map((entity) => ({
      entity,
      score:
        scoreEntity(
          entity,
          normalizedQuery,
          year,
        ),
    }))
    .filter(
      ({ score }) =>
        score > 0,
    )
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(0, 20)
    .map(
      ({ entity }) =>
        entity,
    );
};

const createHistoricalSvg = ({
  entityName,
  year,
  records,
}: {
  entityName: string;
  year: number;
  records: CliopatriaRecord[];
}): string => {
  const paths =
    records
      .map((record) =>
        geometryToPath(
          record.geometry,
        ),
      )
      .filter(Boolean);

  if (paths.length === 0) {
    throw new Error(
      "Matched Cliopatria record has no renderable polygon geometry.",
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}"
  role="img"
  aria-label="${escapeXml(entityName)} historical boundary"
>
  <title>${escapeXml(entityName)} â€” ${escapeXml(year)}</title>
  <metadata>
    Historical boundary data: Cliopatria / Seshat Global History Databank.
    License: CC BY 4.0.
    CurioMint rendered overlay for year ${escapeXml(year)}.
  </metadata>

  <defs>
    <filter
      id="historical-glow"
      x="-30%"
      y="-30%"
      width="160%"
      height="160%"
    >
      <feGaussianBlur
        stdDeviation="4"
        result="blur"
      />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g
    fill="#D9B75E"
    fill-opacity="0.72"
    stroke="#FFF0B8"
    stroke-width="2.4"
    stroke-linejoin="round"
    fill-rule="evenodd"
    clip-rule="evenodd"
    filter="url(#historical-glow)"
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
};

const writeCachedSvg = ({
  entityId,
  entityName,
  year,
  records,
}: {
  entityId: string;
  entityName: string;
  year: number;
  records: CliopatriaRecord[];
}) => {
  fs.mkdirSync(
    HISTORICAL_MAP_CACHE_DIR,
    {
      recursive: true,
    },
  );

  const periodFingerprint =
    records
      .map(
        (record) =>
          `${record.fromYear}:${record.toYear}:${record.seshatId ?? ""}`,
      )
      .sort()
      .join("|");

  const hash =
    createHash("sha1")
      .update(
        `${entityId}|${year}|${periodFingerprint}`,
      )
      .digest("hex")
      .slice(0, 12);

  const fileName =
    `${entityId}-${year}-${hash}.svg`;

  const absolutePath =
    path.join(
      HISTORICAL_MAP_CACHE_DIR,
      fileName,
    );

  if (
    !fs.existsSync(
      absolutePath,
    )
  ) {
    fs.writeFileSync(
      absolutePath,
      createHistoricalSvg({
        entityName,
        year,
        records,
      }),
      "utf8",
    );
  }

  return {
    fileName,
    absolutePath,
    mapPath:
      `/media-cache/historical-maps/${fileName}`,
    mapUrl:
      `http://127.0.0.1:${env.port}/media-cache/historical-maps/${fileName}`,
  };
};

export const getCliopatriaStatus =
  () => {
    const available =
      fs.existsSync(
        CLIOPATRIA_INDEX_PATH,
      );

    if (!available) {
      return {
        available: false,
        version:
          CLIOPATRIA_VERSION,
        dataDirectory:
          CLIOPATRIA_DATA_DIR,
      };
    }

    try {
      const index =
        loadIndex();

      return {
        available: true,
        version:
          CLIOPATRIA_VERSION,
        dataDirectory:
          CLIOPATRIA_DATA_DIR,
        entityCount:
          index.entities.length,
        stats:
          index.stats ?? null,
      };
    } catch (error) {
      return {
        available: false,
        version:
          CLIOPATRIA_VERSION,
        dataDirectory:
          CLIOPATRIA_DATA_DIR,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  };

export const resolveCliopatriaMap =
  (
    entityQuery: string,
    year: number,
  ): HistoricalMapResolution => {
    const query =
      String(
        entityQuery ?? "",
      ).trim();

    if (!query) {
      throw new Error(
        "Historical map entity is required.",
      );
    }

    if (
      !Number.isInteger(year)
    ) {
      throw new Error(
        "Historical map year must be an integer.",
      );
    }

    const candidates =
      findCandidates(
        query,
        year,
      );

    if (
      candidates.length === 0
    ) {
      throw new Error(
        `No Cliopatria entity matched "${query}".`,
      );
    }

    for (
      const candidate of
      candidates
    ) {
      const entityData =
        loadEntity(
          candidate,
        );

      const matchingRecords =
        entityData.records.filter(
          (record) =>
            String(
              record.type ??
                "POLITY",
            ).toUpperCase() !==
              "RELATION" &&
            record.fromYear <=
              year &&
            record.toYear >=
              year,
        );

      if (
        matchingRecords.length ===
        0
      ) {
        continue;
      }

      const cache =
        writeCachedSvg({
          entityId:
            candidate.id,
          entityName:
            candidate.name,
          year,
          records:
            matchingRecords,
        });

      const fromYear =
        Math.min(
          ...matchingRecords.map(
            (record) =>
              record.fromYear,
          ),
        );

      const toYear =
        Math.max(
          ...matchingRecords.map(
            (record) =>
              record.toYear,
          ),
        );

      const areaValues =
        matchingRecords
          .map(
            (record) =>
              Number(
                record.areaKm2,
              ),
          )
          .filter(
            (value) =>
              Number.isFinite(
                value,
              ),
          );

      const areaKm2 =
        areaValues.length > 0
          ? areaValues.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            )
          : null;

      return {
        entityQuery:
          query,

        year,

        entity: {
          id:
            candidate.id,
          name:
            candidate.name,
          wikidata:
            candidate.wikidata ??
            null,
          wikipedia:
            candidate.wikipedia ??
            null,
        },

        fromYear,
        toYear,

        areaKm2,

        matchedRecordCount:
          matchingRecords.length,

        mapPath:
          cache.mapPath,

        mapUrl:
          cache.mapUrl,

        sourceCredit:
          "Historical boundary data: Cliopatria / Seshat Global History Databank, CC BY 4.0.",
      };
    }

    const candidateSummary =
      candidates
        .slice(0, 8)
        .map(
          (candidate) =>
            `${candidate.name} (${candidate.firstYear}..${candidate.lastYear})`,
        )
        .join(", ");

    throw new Error(
      `Cliopatria found entity candidates for "${query}", but none cover year ${year}. Candidates: ${candidateSummary}`,
    );
  };

const enrichSection = (
  section: unknown,
): unknown => {
  if (!isRecord(section)) {
    return section;
  }

  const infographics =
    isRecord(
      section.infographics,
    )
      ? section.infographics
      : null;

  if (!infographics) {
    return section;
  }

  const historicalMap =
    isRecord(
      infographics.historicalMap,
    )
      ? infographics.historicalMap
      : null;

  if (!historicalMap) {
    return section;
  }

  const entity =
    String(
      historicalMap.entity ??
        "",
    ).trim();

  const year =
    Number(
      historicalMap.year,
    );

  if (
    !entity ||
    !Number.isInteger(year)
  ) {
    return section;
  }

  try {
    const resolved =
      resolveCliopatriaMap(
        entity,
        year,
      );

    return {
      ...section,

      infographics: {
        ...infographics,

        historicalMap: {
          ...historicalMap,

          entity,

          year,

          mapUrl:
            resolved.mapUrl,

          resolvedName:
            resolved.entity.name,

          fromYear:
            resolved.fromYear,

          toYear:
            resolved.toYear,

          areaKm2:
            resolved.areaKm2 ??
            undefined,

          sourceCredit:
            resolved.sourceCredit,

          unresolvedReason:
            undefined,
        },
      },
    };
  } catch (error) {
    return {
      ...section,

      infographics: {
        ...infographics,

        historicalMap: {
          ...historicalMap,

          entity,

          year,

          mapUrl:
            undefined,

          unresolvedReason:
            error instanceof Error
              ? error.message
              : String(error),
        },
      },
    };
  }
};

export const enrichHistoricalMapsInRenderProps =
  (
    props:
      Record<string, unknown>,
  ): Record<string, unknown> => {
    const enriched:
      Record<string, unknown> = {
      ...props,
    };

    if (
      Array.isArray(
        props.sections,
      )
    ) {
      enriched.sections =
        props.sections.map(
          enrichSection,
        );
    }

    if (
      Array.isArray(
        props.chapters,
      )
    ) {
      enriched.chapters =
        props.chapters.map(
          (chapter) => {
            if (
              !isRecord(
                chapter,
              )
            ) {
              return chapter;
            }

            return {
              ...chapter,

              sections:
                Array.isArray(
                  chapter.sections,
                )
                  ? chapter.sections.map(
                      enrichSection,
                    )
                  : chapter.sections,
            };
          },
        );
    }

    return enriched;
  };