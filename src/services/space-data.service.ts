import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const EXOPLANET_TAP_URL =
  "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

const JPL_CAD_URL =
  "https://ssd-api.jpl.nasa.gov/cad.api";

const CACHE_ROOT = path.resolve(
  "/app/media-cache",
  "structured-data",
  "space",
);

const EXOPLANET_CACHE_DIR = path.join(
  CACHE_ROOT,
  "exoplanets",
);

const CLOSE_APPROACH_CACHE_DIR = path.join(
  CACHE_ROOT,
  "close-approaches",
);

const EXOPLANET_CACHE_TTL_MS =
  24 * 60 * 60 * 1000;

const CURRENT_CLOSE_APPROACH_CACHE_TTL_MS =
  60 * 60 * 1000;

const HISTORICAL_CLOSE_APPROACH_CACHE_TTL_MS =
  30 * 24 * 60 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 30_000;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (NASA-JPL documentary data resolver)";

const AU_KM = 149_597_870.7;
const LUNAR_DISTANCE_KM = 384_400;

type JsonCacheEnvelope<T> = {
  fetchedAt: string;
  expiresAt: string;
  key: string;
  data: T;
};

type ExoplanetTapRow = {
  pl_name?: string | null;
  hostname?: string | null;
  discoverymethod?: string | null;
  disc_year?: number | null;
  disc_facility?: string | null;
  pl_orbper?: number | null;
  pl_orbsmax?: number | null;
  pl_rade?: number | null;
  pl_bmasse?: number | null;
  pl_eqt?: number | null;
  st_teff?: number | null;
  st_rad?: number | null;
  st_mass?: number | null;
  sy_dist?: number | null;
  sy_snum?: number | null;
  sy_pnum?: number | null;
  pl_controv_flag?: number | null;
};

type JplCadPayload = {
  signature?: {
    source?: string;
    version?: string;
  };
  count?: number | string;
  total?: number | string;
  fields?: string[];
  data?: Array<Array<string | number | null>>;
};

export type CurioMintExoplanet = {
  name: string;
  hostStar: string | null;

  discovery: {
    method: string | null;
    year: number | null;
    facility: string | null;
  };

  orbit: {
    periodDays: number | null;
    semiMajorAxisAu: number | null;
  };

  planet: {
    radiusEarth: number | null;
    massEarth: number | null;
    equilibriumTemperatureK: number | null;
    controversial: boolean;
  };

  host: {
    effectiveTemperatureK: number | null;
    radiusSolar: number | null;
    massSolar: number | null;
  };

  system: {
    distanceParsec: number | null;
    starCount: number | null;
    planetCount: number | null;
  };
};

export type CurioMintCloseApproach = {
  designation: string | null;
  fullName: string | null;
  orbitId: string | null;

  closeApproachTimeTdb: string | null;
  julianDateTdb: number | null;

  body: string;

  distance: {
    au: number | null;
    minimumAu: number | null;
    maximumAu: number | null;
    km: number | null;
    lunarDistances: number | null;
  };

  velocity: {
    relativeKmPerSecond: number | null;
    infinityKmPerSecond: number | null;
  };

  absoluteMagnitudeH: number | null;
  diameterKm: number | null;
  diameterSigmaKm: number | null;
  timeUncertainty: string | null;
};

const ensureCacheDirs = async () => {
  await Promise.all([
    fs.mkdir(EXOPLANET_CACHE_DIR, { recursive: true }),
    fs.mkdir(CLOSE_APPROACH_CACHE_DIR, { recursive: true }),
  ]);
};

const cacheFile = (
  directory: string,
  key: string,
) =>
  path.join(
    directory,
    `${crypto
      .createHash("sha256")
      .update(key)
      .digest("hex")
      .slice(0, 32)}.json`,
  );

const readCache = async <T>(
  filePath: string,
): Promise<{
  envelope: JsonCacheEnvelope<T>;
  expired: boolean;
} | null> => {
  try {
    const envelope = JSON.parse(
      await fs.readFile(filePath, "utf8"),
    ) as JsonCacheEnvelope<T>;

    const expiresAt = Date.parse(envelope.expiresAt);

    return {
      envelope,
      expired:
        !Number.isFinite(expiresAt) ||
        expiresAt <= Date.now(),
    };
  } catch {
    return null;
  }
};

const writeCache = async <T>({
  filePath,
  key,
  data,
  ttlMs,
}: {
  filePath: string;
  key: string;
  data: T;
  ttlMs: number;
}) => {
  const now = Date.now();

  const envelope: JsonCacheEnvelope<T> = {
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    key,
    data,
  };

  await fs.writeFile(
    filePath,
    JSON.stringify(envelope, null, 2) + "\n",
    "utf8",
  );
};

const numberOrNull = (
  value: unknown,
): number | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const stringOrNull = (
  value: unknown,
): string | null => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text
    ? text
    : null;
};

const fetchJson = async <T>(
  url: string,
): Promise<T> => {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Space data API HTTP ${response.status} ${response.statusText} for ${url}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeExoplanet = (
  row: ExoplanetTapRow,
): CurioMintExoplanet => ({
  name: String(row.pl_name ?? ""),
  hostStar: stringOrNull(row.hostname),

  discovery: {
    method: stringOrNull(row.discoverymethod),
    year: numberOrNull(row.disc_year),
    facility: stringOrNull(row.disc_facility),
  },

  orbit: {
    periodDays: numberOrNull(row.pl_orbper),
    semiMajorAxisAu: numberOrNull(row.pl_orbsmax),
  },

  planet: {
    radiusEarth: numberOrNull(row.pl_rade),
    massEarth: numberOrNull(row.pl_bmasse),
    equilibriumTemperatureK: numberOrNull(row.pl_eqt),
    controversial: Number(row.pl_controv_flag ?? 0) === 1,
  },

  host: {
    effectiveTemperatureK: numberOrNull(row.st_teff),
    radiusSolar: numberOrNull(row.st_rad),
    massSolar: numberOrNull(row.st_mass),
  },

  system: {
    distanceParsec: numberOrNull(row.sy_dist),
    starCount: numberOrNull(row.sy_snum),
    planetCount: numberOrNull(row.sy_pnum),
  },
});

const escapeAdqlLiteral = (
  value: string,
) =>
  value.replace(/'/g, "''");

const EXOPLANET_COLUMNS = [
  "pl_name",
  "hostname",
  "discoverymethod",
  "disc_year",
  "disc_facility",
  "pl_orbper",
  "pl_orbsmax",
  "pl_rade",
  "pl_bmasse",
  "pl_eqt",
  "st_teff",
  "st_rad",
  "st_mass",
  "sy_dist",
  "sy_snum",
  "sy_pnum",
  "pl_controv_flag",
].join(",");

const makeTapUrl = (
  adql: string,
) => {
  const params = new URLSearchParams({
    query: adql,
    format: "json",
  });

  return `${EXOPLANET_TAP_URL}?${params.toString()}`;
};

const cachedExoplanetQuery = async (
  adql: string,
) => {
  await ensureCacheDirs();

  const url = makeTapUrl(adql);
  const key = `exoplanet:${adql}`;
  const filePath = cacheFile(
    EXOPLANET_CACHE_DIR,
    key,
  );

  const cached =
    await readCache<ExoplanetTapRow[]>(
      filePath,
    );

  if (cached && !cached.expired) {
    return {
      rows: cached.envelope.data,
      cacheHit: true,
      staleCache: false,
      sourceUrl: url,
    };
  }

  try {
    const rows =
      await fetchJson<ExoplanetTapRow[]>(
        url,
      );

    await writeCache({
      filePath,
      key,
      data: rows,
      ttlMs: EXOPLANET_CACHE_TTL_MS,
    });

    return {
      rows,
      cacheHit: false,
      staleCache: false,
      sourceUrl: url,
    };
  } catch (error) {
    if (cached) {
      return {
        rows: cached.envelope.data,
        cacheHit: true,
        staleCache: true,
        sourceUrl: url,
      };
    }

    throw error;
  }
};

const optionalFinite = ({
  value,
  fieldName,
  min,
  max,
}: {
  value: unknown;
  fieldName: string;
  min?: number;
  max?: number;
}): number | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${fieldName} must be a finite number`,
    );
  }

  if (
    min !== undefined &&
    parsed < min
  ) {
    throw new Error(
      `${fieldName} must be >= ${min}`,
    );
  }

  if (
    max !== undefined &&
    parsed > max
  ) {
    throw new Error(
      `${fieldName} must be <= ${max}`,
    );
  }

  return parsed;
};

const optionalText = (
  value: unknown,
): string | undefined => {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  const text = String(value).trim();

  return text
    ? text
    : undefined;
};

export const searchExoplanets = async (
  raw: Record<string, unknown>,
) => {
  const queryText = optionalText(raw.query);
  const discoveryMethod =
    optionalText(raw.discoveryMethod);

  const minRadiusEarth = optionalFinite({
    value: raw.minRadiusEarth,
    fieldName: "minRadiusEarth",
    min: 0,
  });

  const maxRadiusEarth = optionalFinite({
    value: raw.maxRadiusEarth,
    fieldName: "maxRadiusEarth",
    min: 0,
  });

  const minMassEarth = optionalFinite({
    value: raw.minMassEarth,
    fieldName: "minMassEarth",
    min: 0,
  });

  const maxMassEarth = optionalFinite({
    value: raw.maxMassEarth,
    fieldName: "maxMassEarth",
    min: 0,
  });

  const minTemperatureK = optionalFinite({
    value: raw.minEquilibriumTemperatureK,
    fieldName: "minEquilibriumTemperatureK",
    min: 0,
  });

  const maxTemperatureK = optionalFinite({
    value: raw.maxEquilibriumTemperatureK,
    fieldName: "maxEquilibriumTemperatureK",
    min: 0,
  });

  const discoveredAfter = optionalFinite({
    value: raw.discoveredAfter,
    fieldName: "discoveredAfter",
    min: 1988,
    max: 2200,
  });

  const discoveredBefore = optionalFinite({
    value: raw.discoveredBefore,
    fieldName: "discoveredBefore",
    min: 1988,
    max: 2200,
  });

  const limit =
    raw.limit === undefined
      ? 25
      : Number(raw.limit);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error(
      "limit must be an integer between 1 and 100",
    );
  }

  const allowedOrderBy = [
    "name",
    "distance",
    "discovery-year-desc",
    "radius-desc",
    "mass-desc",
  ] as const;

  type OrderBy =
    (typeof allowedOrderBy)[number];

  const orderBy =
    raw.orderBy === undefined
      ? "name"
      : String(raw.orderBy);

  if (
    !allowedOrderBy.includes(
      orderBy as OrderBy,
    )
  ) {
    throw new Error(
      "orderBy must be name, distance, discovery-year-desc, radius-desc, or mass-desc",
    );
  }

  const clauses: string[] = [];

  if (queryText) {
    const escaped =
      escapeAdqlLiteral(queryText);

    clauses.push(
      `(pl_name like '%${escaped}%' or hostname like '%${escaped}%')`,
    );
  }

  if (discoveryMethod) {
    clauses.push(
      `discoverymethod='${escapeAdqlLiteral(discoveryMethod)}'`,
    );
  }

  if (minRadiusEarth !== undefined) {
    clauses.push(
      `pl_rade>=${minRadiusEarth}`,
    );
  }

  if (maxRadiusEarth !== undefined) {
    clauses.push(
      `pl_rade<=${maxRadiusEarth}`,
    );
  }

  if (minMassEarth !== undefined) {
    clauses.push(
      `pl_bmasse>=${minMassEarth}`,
    );
  }

  if (maxMassEarth !== undefined) {
    clauses.push(
      `pl_bmasse<=${maxMassEarth}`,
    );
  }

  if (minTemperatureK !== undefined) {
    clauses.push(
      `pl_eqt>=${minTemperatureK}`,
    );
  }

  if (maxTemperatureK !== undefined) {
    clauses.push(
      `pl_eqt<=${maxTemperatureK}`,
    );
  }

  if (discoveredAfter !== undefined) {
    clauses.push(
      `disc_year>=${Math.trunc(discoveredAfter)}`,
    );
  }

  if (discoveredBefore !== undefined) {
    clauses.push(
      `disc_year<=${Math.trunc(discoveredBefore)}`,
    );
  }

  const orderClause =
    orderBy === "distance"
      ? "sy_dist asc"
      : orderBy === "discovery-year-desc"
        ? "disc_year desc"
        : orderBy === "radius-desc"
          ? "pl_rade desc"
          : orderBy === "mass-desc"
            ? "pl_bmasse desc"
            : "pl_name asc";

  const whereClause =
    clauses.length > 0
      ? ` where ${clauses.join(" and ")}`
      : "";

  const adql =
    `select top ${limit} ${EXOPLANET_COLUMNS} from pscomppars${whereClause} order by ${orderClause}`;

  const result =
    await cachedExoplanetQuery(
      adql,
    );

  return {
    success: true,

    query: {
      query: queryText ?? null,
      discoveryMethod:
        discoveryMethod ?? null,
      minRadiusEarth:
        minRadiusEarth ?? null,
      maxRadiusEarth:
        maxRadiusEarth ?? null,
      minMassEarth:
        minMassEarth ?? null,
      maxMassEarth:
        maxMassEarth ?? null,
      minEquilibriumTemperatureK:
        minTemperatureK ?? null,
      maxEquilibriumTemperatureK:
        maxTemperatureK ?? null,
      discoveredAfter:
        discoveredAfter ?? null,
      discoveredBefore:
        discoveredBefore ?? null,
      orderBy,
      limit,
    },

    count: result.rows.length,

    planets:
      result.rows.map(
        normalizeExoplanet,
      ),

    cache: {
      hit: result.cacheHit,
      stale: result.staleCache,
    },

    source: {
      provider:
        "NASA Exoplanet Archive",

      service:
        "Table Access Protocol (TAP)",

      table:
        "PSCompPars",

      queryUrl:
        result.sourceUrl,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,
    },
  };
};

export const resolveExoplanet = async (
  rawPlanetName: unknown,
) => {
  const planetName =
    optionalText(rawPlanetName);

  if (!planetName) {
    throw new Error(
      "planetName is required",
    );
  }

  const escaped =
    escapeAdqlLiteral(
      planetName,
    );

  const adql =
    `select top 1 ${EXOPLANET_COLUMNS} from pscomppars where pl_name='${escaped}'`;

  const result =
    await cachedExoplanetQuery(
      adql,
    );

  const row =
    result.rows[0];

  if (!row) {
    throw new Error(
      `Exoplanet "${planetName}" was not found`,
    );
  }

  return {
    success: true,

    planet:
      normalizeExoplanet(
        row,
      ),

    cache: {
      hit:
        result.cacheHit,

      stale:
        result.staleCache,
    },

    source: {
      provider:
        "NASA Exoplanet Archive",

      service:
        "Table Access Protocol (TAP)",

      table:
        "PSCompPars",

      queryUrl:
        result.sourceUrl,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,
    },
  };
};

const normalizeDateOnly = (
  value: unknown,
  fieldName: string,
): string => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value.trim(),
    )
  ) {
    throw new Error(
      `${fieldName} must use YYYY-MM-DD`,
    );
  }

  const text = value.trim();

  if (
    !Number.isFinite(
      Date.parse(`${text}T00:00:00Z`),
    )
  ) {
    throw new Error(
      `${fieldName} is invalid`,
    );
  }

  return text;
};

const booleanOrUndefined = (
  value: unknown,
): boolean | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  throw new Error(
    "boolean filter must be true or false",
  );
};

const getCadField = (
  row: Array<string | number | null>,
  fields: string[],
  fieldName: string,
) => {
  const index =
    fields.indexOf(fieldName);

  return index >= 0
    ? row[index]
    : null;
};

const normalizeCloseApproach = (
  row: Array<string | number | null>,
  fields: string[],
  fallbackBody: string,
): CurioMintCloseApproach => {
  const distanceAu =
    numberOrNull(
      getCadField(
        row,
        fields,
        "dist",
      ),
    );

  const body =
    stringOrNull(
      getCadField(
        row,
        fields,
        "body",
      ),
    ) ??
    fallbackBody;

  return {
    designation:
      stringOrNull(
        getCadField(
          row,
          fields,
          "des",
        ),
      ),

    fullName:
      stringOrNull(
        getCadField(
          row,
          fields,
          "fullname",
        ),
      ),

    orbitId:
      stringOrNull(
        getCadField(
          row,
          fields,
          "orbit_id",
        ),
      ),

    closeApproachTimeTdb:
      stringOrNull(
        getCadField(
          row,
          fields,
          "cd",
        ),
      ),

    julianDateTdb:
      numberOrNull(
        getCadField(
          row,
          fields,
          "jd",
        ),
      ),

    body,

    distance: {
      au:
        distanceAu,

      minimumAu:
        numberOrNull(
          getCadField(
            row,
            fields,
            "dist_min",
          ),
        ),

      maximumAu:
        numberOrNull(
          getCadField(
            row,
            fields,
            "dist_max",
          ),
        ),

      km:
        distanceAu === null
          ? null
          : distanceAu * AU_KM,

      lunarDistances:
        distanceAu === null
          ? null
          : (
              distanceAu *
              AU_KM
            ) /
            LUNAR_DISTANCE_KM,
    },

    velocity: {
      relativeKmPerSecond:
        numberOrNull(
          getCadField(
            row,
            fields,
            "v_rel",
          ),
        ),

      infinityKmPerSecond:
        numberOrNull(
          getCadField(
            row,
            fields,
            "v_inf",
          ),
        ),
    },

    absoluteMagnitudeH:
      numberOrNull(
        getCadField(
          row,
          fields,
          "h",
        ),
      ),

    diameterKm:
      numberOrNull(
        getCadField(
          row,
          fields,
          "diameter",
        ),
      ),

    diameterSigmaKm:
      numberOrNull(
        getCadField(
          row,
          fields,
          "diameter_sigma",
        ),
      ),

    timeUncertainty:
      stringOrNull(
        getCadField(
          row,
          fields,
          "t_sigma_f",
        ),
      ),
  };
};

export const searchCloseApproaches = async (
  raw: Record<string, unknown>,
) => {
  await ensureCacheDirs();

  const dateMin =
    normalizeDateOnly(
      raw.dateMin,
      "dateMin",
    );

  const dateMax =
    normalizeDateOnly(
      raw.dateMax,
      "dateMax",
    );

  if (dateMin > dateMax) {
    throw new Error(
      "dateMin must be before or equal to dateMax",
    );
  }

  const body =
    optionalText(
      raw.body,
    ) ??
    "Earth";

  const designation =
    optionalText(
      raw.designation,
    );

  const maxDistanceAu =
    optionalFinite({
      value:
        raw.maxDistanceAu,

      fieldName:
        "maxDistanceAu",

      min: 0,
    });

  const maxDistanceLunar =
    optionalFinite({
      value:
        raw.maxDistanceLunar,

      fieldName:
        "maxDistanceLunar",

      min: 0,
    });

  if (
    maxDistanceAu !== undefined &&
    maxDistanceLunar !== undefined
  ) {
    throw new Error(
      "use either maxDistanceAu or maxDistanceLunar, not both",
    );
  }

  const pha =
    booleanOrUndefined(
      raw.pha,
    );

  const neo =
    booleanOrUndefined(
      raw.neo,
    );

  const kind =
    optionalText(
      raw.kind,
    );

  const allowedSort = [
    "date",
    "-date",
    "dist",
    "-dist",
    "v-rel",
    "-v-rel",
    "h",
    "-h",
    "object",
    "-object",
  ];

  const sort =
    raw.sort === undefined
      ? "dist"
      : String(
          raw.sort,
        );

  if (
    !allowedSort.includes(
      sort,
    )
  ) {
    throw new Error(
      "sort is invalid",
    );
  }

  const limit =
    raw.limit === undefined
      ? 50
      : Number(
          raw.limit,
        );

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 500
  ) {
    throw new Error(
      "limit must be an integer between 1 and 500",
    );
  }

  const params =
    new URLSearchParams({
      "date-min":
        dateMin,

      "date-max":
        dateMax,

      body,

      sort,

      limit:
        String(limit),

      diameter:
        "true",

      fullname:
        "true",
    });

  if (designation) {
    params.set(
      "des",
      designation,
    );
  }

  if (
    maxDistanceAu !==
      undefined
  ) {
    params.set(
      "dist-max",
      String(
        maxDistanceAu,
      ),
    );
  }

  if (
    maxDistanceLunar !==
      undefined
  ) {
    params.set(
      "dist-max",
      `${maxDistanceLunar}LD`,
    );
  }

  if (pha === true) {
    params.set(
      "pha",
      "true",
    );
  }

  if (neo !== undefined) {
    params.set(
      "neo",
      neo
        ? "true"
        : "false",
    );
  }

  if (kind) {
    params.set(
      "kind",
      kind,
    );
  }

  const sourceUrl =
    `${JPL_CAD_URL}?${params.toString()}`;

  const key =
    `cad:${sourceUrl}`;

  const filePath =
    cacheFile(
      CLOSE_APPROACH_CACHE_DIR,
      key,
    );

  const cached =
    await readCache<JplCadPayload>(
      filePath,
    );

  let payload:
    JplCadPayload;

  let cacheHit =
    false;

  let staleCache =
    false;

  if (
    cached &&
    !cached.expired
  ) {
    payload =
      cached.envelope.data;

    cacheHit =
      true;
  } else {
    try {
      payload =
        await fetchJson<JplCadPayload>(
          sourceUrl,
        );

      const historical =
        Date.parse(
          `${dateMax}T00:00:00Z`,
        ) <
        Date.now() -
          7 *
            24 *
            60 *
            60 *
            1000;

      await writeCache({
        filePath,
        key,
        data:
          payload,

        ttlMs:
          historical
            ? HISTORICAL_CLOSE_APPROACH_CACHE_TTL_MS
            : CURRENT_CLOSE_APPROACH_CACHE_TTL_MS,
      });
    } catch (error) {
      if (!cached) {
        throw error;
      }

      payload =
        cached.envelope.data;

      cacheHit =
        true;

      staleCache =
        true;
    }
  }

  const fields =
    Array.isArray(
      payload.fields,
    )
      ? payload.fields
      : [];

  const data =
    Array.isArray(
      payload.data,
    )
      ? payload.data
      : [];

  return {
    success: true,

    query: {
      dateMin,
      dateMax,
      body,
      designation:
        designation ?? null,
      maxDistanceAu:
        maxDistanceAu ?? null,
      maxDistanceLunar:
        maxDistanceLunar ?? null,
      pha:
        pha ?? null,
      neo:
        neo ?? null,
      kind:
        kind ?? null,
      sort,
      limit,
    },

    count:
      data.length,

    total:
      numberOrNull(
        payload.total ??
          payload.count,
      ),

    closeApproaches:
      data.map(
        (row) =>
          normalizeCloseApproach(
            row,
            fields,
            body,
          ),
      ),

    cache: {
      hit:
        cacheHit,

      stale:
        staleCache,
    },

    source: {
      provider:
        "NASA/JPL Solar System Dynamics",

      service:
        "SBDB Close-Approach Data API",

      apiVersion:
        payload.signature
          ?.version ??
        null,

      sourceName:
        payload.signature
          ?.source ??
        null,

      queryUrl:
        sourceUrl,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,
    },
  };
};

export const getSpaceDataStatus = async () => {
  await ensureCacheDirs();

  const [
    exoplanetFiles,
    closeApproachFiles,
  ] =
    await Promise.all([
      fs.readdir(
        EXOPLANET_CACHE_DIR,
      ),

      fs.readdir(
        CLOSE_APPROACH_CACHE_DIR,
      ),
    ]);

  return {
    available: true,

    cacheDirectory:
      CACHE_ROOT,

    adapters: {
      exoplanets: {
        provider:
          "NASA Exoplanet Archive",

        service:
          "TAP",

        table:
          "PSCompPars",

        authenticationRequired:
          false,

        cachedQueries:
          exoplanetFiles.length,

        cacheTtlHours:
          24,
      },

      closeApproaches: {
        provider:
          "NASA/JPL Solar System Dynamics",

        service:
          "SBDB Close-Approach Data API",

        authenticationRequired:
          false,

        cachedQueries:
          closeApproachFiles.length,

        currentCacheTtlHours:
          1,

        historicalCacheTtlDays:
          30,
      },
    },

    renderRuntimeExternalCalls:
      0,
  };
};