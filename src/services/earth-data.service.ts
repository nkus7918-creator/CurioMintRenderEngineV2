import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const EONET_API =
  "https://eonet.gsfc.nasa.gov/api/v3";

const USGS_VOLCANO_GEOJSON =
  "https://volcanoes.usgs.gov/vsc/api/volcanoApi/geojson";

const CACHE_ROOT = path.resolve(
  "/app/media-cache",
  "structured-data",
  "earth",
);

const EONET_CACHE_DIR = path.join(
  CACHE_ROOT,
  "eonet",
);

const VOLCANO_CACHE_DIR = path.join(
  CACHE_ROOT,
  "volcanoes",
);

const REQUEST_TIMEOUT_MS = 30_000;

const CURRENT_EVENT_CACHE_TTL_MS =
  60 * 60 * 1000;

const HISTORICAL_EVENT_CACHE_TTL_MS =
  30 * 24 * 60 * 60 * 1000;

const VOLCANO_CACHE_TTL_MS =
  30 * 60 * 1000;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (NASA-EONET USGS-volcano documentary data resolver)";

type CacheEnvelope<T> = {
  fetchedAt: string;
  expiresAt: string;
  key: string;
  data: T;
};

type EonetCategory = {
  id?: string;
  title?: string;
};

type EonetSource = {
  id?: string;
  url?: string;
  source?: string;
};

type EonetGeometry = {
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
  magnitudeDescription?: string | null;
  date?: string | null;
  type?: string | null;
  coordinates?: unknown;
};

type EonetEvent = {
  id?: string;
  title?: string;
  description?: string | null;
  link?: string;
  closed?: string | null;
  categories?: EonetCategory[];
  sources?: EonetSource[];
  geometry?: EonetGeometry[];
};

type EonetEventsResponse = {
  title?: string;
  description?: string;
  link?: string;
  events?: EonetEvent[];
};

type UsgsVolcanoFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: [number?, number?];
  };
  properties?: {
    volcanoName?: string | null;
    vnum?: string | null;
    volcanoCd?: string | null;
    volcanoUrl?: string | null;
    volcanoImage?: string | null;
    obs?: string | null;
    region?: string | null;
    noticeId?: string | null;
    noticeSynopsis?: string | null;
    noticeUrl?: string | null;
    alertLevel?: string | null;
    colorCode?: string | null;
    statusIconUrl?: string | null;
    alertDate?: string | null;
    colorDate?: string | null;
    nvewsThreat?: string | null;
  };
};

type UsgsVolcanoGeoJson = {
  type?: string;
  features?: UsgsVolcanoFeature[];
};

export type CurioMintNaturalEvent = {
  id: string;
  title: string;
  description: string | null;

  status: {
    open: boolean;
    closedAt: string | null;
  };

  categories: Array<{
    id: string | null;
    title: string | null;
  }>;

  sources: Array<{
    id: string | null;
    url: string | null;
  }>;

  observations: Array<{
    date: string | null;

    geometryType:
      string
      | null;

    coordinates:
      unknown;

    magnitude: {
      value:
        number
        | null;

      unit:
        string
        | null;

      description:
        string
        | null;
    };
  }>;

  apiLink: string | null;
};

export type CurioMintVolcanoStatus = {
  name:
    string
    | null;

  vnum:
    string
    | null;

  volcanoCode:
    string
    | null;

  observatory:
    string
    | null;

  region:
    string
    | null;

  coordinates: {
    latitude:
      number
      | null;

    longitude:
      number
      | null;
  };

  status: {
    alertLevel:
      string
      | null;

    colorCode:
      string
      | null;

    alertDate:
      string
      | null;

    colorDate:
      string
      | null;

    nvewsThreat:
      string
      | null;
  };

  notice: {
    id:
      string
      | null;

    synopsis:
      string
      | null;

    url:
      string
      | null;
  };

  profileUrl:
    string
    | null;

  imageUrl:
    string
    | null;
};

const ensureCacheDirs = async () => {
  await Promise.all([
    fs.mkdir(
      EONET_CACHE_DIR,
      {
        recursive: true,
      },
    ),

    fs.mkdir(
      VOLCANO_CACHE_DIR,
      {
        recursive: true,
      },
    ),
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
  envelope:
    CacheEnvelope<T>;

  expired: boolean;
} | null> => {
  try {
    const envelope =
      JSON.parse(
        await fs.readFile(
          filePath,
          "utf8",
        ),
      ) as CacheEnvelope<T>;

    const expiresAt =
      Date.parse(
        envelope.expiresAt,
      );

    return {
      envelope,

      expired:
        !Number.isFinite(
          expiresAt,
        ) ||
        expiresAt <=
          Date.now(),
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
  const now =
    Date.now();

  const envelope:
    CacheEnvelope<T> = {
    fetchedAt:
      new Date(now)
        .toISOString(),

    expiresAt:
      new Date(
        now + ttlMs,
      ).toISOString(),

    key,
    data,
  };

  await fs.writeFile(
    filePath,
    JSON.stringify(
      envelope,
      null,
      2,
    ) + "\n",
    "utf8",
  );
};

const fetchJson = async <T>(
  url: string,
): Promise<T> => {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              USER_AGENT,
          },
        },
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Earth data API HTTP ${response.status} ${response.statusText} for ${url}`,
      );
    }

    return await response.json() as T;
  } finally {
    clearTimeout(
      timeout,
    );
  }
};

const stringOrNull = (
  value: unknown,
):
  string
  | null => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .trim();

  return text
    ? text
    : null;
};

const numberOrNull = (
  value: unknown,
):
  number
  | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : null;
};

const normalizeDateOnly = (
  value: unknown,
  fieldName: string,
):
  string
  | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const text =
    String(value)
      .trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      text,
    )
  ) {
    throw new Error(
      `${fieldName} must use YYYY-MM-DD`,
    );
  }

  if (
    !Number.isFinite(
      Date.parse(
        `${text}T00:00:00Z`,
      ),
    )
  ) {
    throw new Error(
      `${fieldName} is invalid`,
    );
  }

  return text;
};

const optionalText = (
  value: unknown,
):
  string
  | undefined => {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  const text =
    String(value)
      .trim();

  return text
    ? text
    : undefined;
};

const optionalInteger = ({
  value,
  fieldName,
  min,
  max,
}: {
  value: unknown;
  fieldName: string;
  min?: number;
  max?: number;
}):
  number
  | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isInteger(
      number,
    )
  ) {
    throw new Error(
      `${fieldName} must be an integer`,
    );
  }

  if (
    min !== undefined &&
    number < min
  ) {
    throw new Error(
      `${fieldName} must be >= ${min}`,
    );
  }

  if (
    max !== undefined &&
    number > max
  ) {
    throw new Error(
      `${fieldName} must be <= ${max}`,
    );
  }

  return number;
};

const normalizeNaturalEvent = (
  event:
    EonetEvent,
): CurioMintNaturalEvent => ({
  id:
    String(
      event.id ??
        "",
    ),

  title:
    String(
      event.title ??
        "",
    ),

  description:
    stringOrNull(
      event.description,
    ),

  status: {
    open:
      !event.closed,

    closedAt:
      stringOrNull(
        event.closed,
      ),
  },

  categories:
    Array.isArray(
      event.categories,
    )
      ? event.categories.map(
          (
            category,
          ) => ({
            id:
              stringOrNull(
                category.id,
              ),

            title:
              stringOrNull(
                category.title,
              ),
          }),
        )
      : [],

  sources:
    Array.isArray(
      event.sources,
    )
      ? event.sources.map(
          (
            source,
          ) => ({
            id:
              stringOrNull(
                source.id,
              ),

            url:
              stringOrNull(
                source.url ??
                  source.source,
              ),
          }),
        )
      : [],

  observations:
    Array.isArray(
      event.geometry,
    )
      ? event.geometry.map(
          (
            geometry,
          ) => ({
            date:
              stringOrNull(
                geometry.date,
              ),

            geometryType:
              stringOrNull(
                geometry.type,
              ),

            coordinates:
              geometry.coordinates ??
              null,

            magnitude: {
              value:
                numberOrNull(
                  geometry.magnitudeValue,
                ),

              unit:
                stringOrNull(
                  geometry.magnitudeUnit,
                ),

              description:
                stringOrNull(
                  geometry.magnitudeDescription,
                ),
            },
          }),
        )
      : [],

  apiLink:
    stringOrNull(
      event.link,
    ),
});

export const searchNaturalEvents = async (
  raw:
    Record<
      string,
      unknown
    >,
) => {
  await ensureCacheDirs();

  const category =
    optionalText(
      raw.category,
    );

  const source =
    optionalText(
      raw.source,
    );

  const start =
    normalizeDateOnly(
      raw.start,
      "start",
    );

  const end =
    normalizeDateOnly(
      raw.end,
      "end",
    );

  if (
    start &&
    end &&
    start > end
  ) {
    throw new Error(
      "start must be before or equal to end",
    );
  }

  const days =
    optionalInteger({
      value:
        raw.days,

      fieldName:
        "days",

      min: 1,
      max: 3650,
    });

  if (
    days !== undefined &&
    (
      start !== undefined ||
      end !== undefined
    )
  ) {
    throw new Error(
      "use either days or start/end date filters, not both",
    );
  }

  const allowedStatus =
    [
      "open",
      "closed",
      "all",
    ];

  const status =
    raw.status ===
      undefined
      ? "all"
      : String(
          raw.status,
        );

  if (
    !allowedStatus.includes(
      status,
    )
  ) {
    throw new Error(
      "status must be open, closed, or all",
    );
  }

  const limit =
    raw.limit ===
      undefined
      ? 100
      : Number(
          raw.limit,
        );

  if (
    !Number.isInteger(
      limit,
    ) ||
    limit < 1 ||
    limit > 500
  ) {
    throw new Error(
      "limit must be an integer between 1 and 500",
    );
  }

  const params =
    new URLSearchParams({
      status,
      limit:
        String(
          limit,
        ),
    });

  if (category) {
    params.set(
      "category",
      category,
    );
  }

  if (source) {
    params.set(
      "source",
      source,
    );
  }

  if (
    days !== undefined
  ) {
    params.set(
      "days",
      String(days),
    );
  }

  if (start) {
    params.set(
      "start",
      start,
    );
  }

  if (end) {
    params.set(
      "end",
      end,
    );
  }

  const sourceUrl =
    `${EONET_API}/events?${params.toString()}`;

  const key =
    `events:${sourceUrl}`;

  const filePath =
    cacheFile(
      EONET_CACHE_DIR,
      key,
    );

  const cached =
    await readCache<EonetEventsResponse>(
      filePath,
    );

  let payload:
    EonetEventsResponse;

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
        await fetchJson<EonetEventsResponse>(
          sourceUrl,
        );

      const historical =
        end !== undefined &&
        Date.parse(
          `${end}T00:00:00Z`,
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
            ? HISTORICAL_EVENT_CACHE_TTL_MS
            : CURRENT_EVENT_CACHE_TTL_MS,
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

  const events =
    Array.isArray(
      payload.events,
    )
      ? payload.events.map(
          normalizeNaturalEvent,
        )
      : [];

  return {
    success: true,

    query: {
      category:
        category ?? null,

      source:
        source ?? null,

      status,
      days:
        days ?? null,

      start:
        start ?? null,

      end:
        end ?? null,

      limit,
    },

    count:
      events.length,

    events,

    cache: {
      hit:
        cacheHit,

      stale:
        staleCache,
    },

    source: {
      provider:
        "NASA Earth Observatory Natural Event Tracker",

      abbreviation:
        "NASA EONET",

      apiVersion:
        "v3",

      queryUrl:
        sourceUrl,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,
    },
  };
};

const normalizeVolcano = (
  feature:
    UsgsVolcanoFeature,
): CurioMintVolcanoStatus => {
  const properties =
    feature.properties ??
    {};

  const coordinates =
    feature.geometry
      ?.coordinates ??
    [];

  return {
    name:
      stringOrNull(
        properties.volcanoName,
      ),

    vnum:
      stringOrNull(
        properties.vnum,
      ),

    volcanoCode:
      stringOrNull(
        properties.volcanoCd,
      ),

    observatory:
      stringOrNull(
        properties.obs,
      ),

    region:
      stringOrNull(
        properties.region,
      ),

    coordinates: {
      latitude:
        numberOrNull(
          coordinates[1],
        ),

      longitude:
        numberOrNull(
          coordinates[0],
        ),
    },

    status: {
      alertLevel:
        stringOrNull(
          properties.alertLevel,
        ),

      colorCode:
        stringOrNull(
          properties.colorCode,
        ),

      alertDate:
        stringOrNull(
          properties.alertDate,
        ),

      colorDate:
        stringOrNull(
          properties.colorDate,
        ),

      nvewsThreat:
        stringOrNull(
          properties.nvewsThreat,
        ),
    },

    notice: {
      id:
        stringOrNull(
          properties.noticeId,
        ),

      synopsis:
        stringOrNull(
          properties.noticeSynopsis,
        ),

      url:
        stringOrNull(
          properties.noticeUrl,
        ),
    },

    profileUrl:
      stringOrNull(
        properties.volcanoUrl,
      ),

    imageUrl:
      stringOrNull(
        properties.volcanoImage,
      ),
  };
};

const getVolcanoDataset = async () => {
  await ensureCacheDirs();

  const key =
    "usgs-volcano-status-geojson";

  const filePath =
    cacheFile(
      VOLCANO_CACHE_DIR,
      key,
    );

  const cached =
    await readCache<UsgsVolcanoGeoJson>(
      filePath,
    );

  if (
    cached &&
    !cached.expired
  ) {
    return {
      payload:
        cached.envelope.data,

      cacheHit: true,
      staleCache: false,
    };
  }

  try {
    const payload =
      await fetchJson<UsgsVolcanoGeoJson>(
        USGS_VOLCANO_GEOJSON,
      );

    await writeCache({
      filePath,
      key,
      data:
        payload,

      ttlMs:
        VOLCANO_CACHE_TTL_MS,
    });

    return {
      payload,
      cacheHit: false,
      staleCache: false,
    };
  } catch (error) {
    if (cached) {
      return {
        payload:
          cached.envelope.data,

        cacheHit: true,
        staleCache: true,
      };
    }

    throw error;
  }
};

const normalizeSearchText = (
  value:
    string
    | null,
) =>
  (
    value ??
    ""
  )
    .trim()
    .toLocaleLowerCase(
      "en-US",
    );

export const searchVolcanoes = async (
  raw:
    Record<
      string,
      unknown
    >,
) => {
  const query =
    optionalText(
      raw.query,
    );

  const region =
    optionalText(
      raw.region,
    );

  const observatory =
    optionalText(
      raw.observatory,
    );

  const alertLevel =
    optionalText(
      raw.alertLevel,
    );

  const colorCode =
    optionalText(
      raw.colorCode,
    );

  const threat =
    optionalText(
      raw.threat,
    );

  const limit =
    raw.limit ===
      undefined
      ? 100
      : Number(
          raw.limit,
        );

  if (
    !Number.isInteger(
      limit,
    ) ||
    limit < 1 ||
    limit > 500
  ) {
    throw new Error(
      "limit must be an integer between 1 and 500",
    );
  }

  const result =
    await getVolcanoDataset();

  const features =
    Array.isArray(
      result.payload
        .features,
    )
      ? result.payload
          .features
      : [];

  const volcanoes =
    features
      .map(
        normalizeVolcano,
      )
      .filter(
        (
          volcano,
        ) => {
          if (query) {
            const needle =
              normalizeSearchText(
                query,
              );

            const haystack =
              [
                volcano.name,
                volcano.vnum,
                volcano.volcanoCode,
                volcano.region,
                volcano.notice.synopsis,
              ]
                .map(
                  normalizeSearchText,
                )
                .join(
                  " ",
                );

            if (
              !haystack.includes(
                needle,
              )
            ) {
              return false;
            }
          }

          if (
            region &&
            normalizeSearchText(
              volcano.region,
            ) !==
              normalizeSearchText(
                region,
              )
          ) {
            return false;
          }

          if (
            observatory &&
            normalizeSearchText(
              volcano.observatory,
            ) !==
              normalizeSearchText(
                observatory,
              )
          ) {
            return false;
          }

          if (
            alertLevel &&
            normalizeSearchText(
              volcano.status
                .alertLevel,
            ) !==
              normalizeSearchText(
                alertLevel,
              )
          ) {
            return false;
          }

          if (
            colorCode &&
            normalizeSearchText(
              volcano.status
                .colorCode,
            ) !==
              normalizeSearchText(
                colorCode,
              )
          ) {
            return false;
          }

          if (
            threat &&
            normalizeSearchText(
              volcano.status
                .nvewsThreat,
            ) !==
              normalizeSearchText(
                threat,
              )
          ) {
            return false;
          }

          return true;
        },
      )
      .slice(
        0,
        limit,
      );

  return {
    success: true,

    query: {
      query:
        query ?? null,

      region:
        region ?? null,

      observatory:
        observatory ?? null,

      alertLevel:
        alertLevel ?? null,

      colorCode:
        colorCode ?? null,

      threat:
        threat ?? null,

      limit,
    },

    count:
      volcanoes.length,

    volcanoes,

    cache: {
      hit:
        result.cacheHit,

      stale:
        result.staleCache,
    },

    source: {
      provider:
        "U.S. Geological Survey",

      program:
        "Volcano Hazards Program",

      service:
        "USGS Volcano API",

      queryUrl:
        USGS_VOLCANO_GEOJSON,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,

      supportNote:
        "USGS states this API is freely available but does not guarantee continuing support.",
    },
  };
};

export const resolveVolcano = async (
  rawIdentifier: unknown,
) => {
  const identifier =
    optionalText(
      rawIdentifier,
    );

  if (!identifier) {
    throw new Error(
      "volcano identifier is required",
    );
  }

  const result =
    await getVolcanoDataset();

  const needle =
    normalizeSearchText(
      identifier,
    );

  const feature =
    (
      Array.isArray(
        result.payload
          .features,
      )
        ? result.payload
            .features
        : []
    ).find(
      (
        candidate,
      ) => {
        const volcano =
          normalizeVolcano(
            candidate,
          );

        return (
          normalizeSearchText(
            volcano.vnum,
          ) ===
            needle ||
          normalizeSearchText(
            volcano.volcanoCode,
          ) ===
            needle ||
          normalizeSearchText(
            volcano.name,
          ) ===
            needle
        );
      },
    );

  if (!feature) {
    throw new Error(
      `USGS volcano "${identifier}" was not found`,
    );
  }

  return {
    success: true,

    volcano:
      normalizeVolcano(
        feature,
      ),

    cache: {
      hit:
        result.cacheHit,

      stale:
        result.staleCache,
    },

    source: {
      provider:
        "U.S. Geological Survey",

      program:
        "Volcano Hazards Program",

      service:
        "USGS Volcano API",

      queryUrl:
        USGS_VOLCANO_GEOJSON,

      authenticationRequired:
        false,

      renderRuntimeExternalCalls:
        0,
    },
  };
};

export const getEarthDataStatus = async () => {
  await ensureCacheDirs();

  const [
    eonetFiles,
    volcanoFiles,
  ] =
    await Promise.all([
      fs.readdir(
        EONET_CACHE_DIR,
      ),

      fs.readdir(
        VOLCANO_CACHE_DIR,
      ),
    ]);

  return {
    available: true,

    cacheDirectory:
      CACHE_ROOT,

    adapters: {
      naturalEvents: {
        provider:
          "NASA EONET",

        apiVersion:
          "v3",

        authenticationRequired:
          false,

        cachedQueries:
          eonetFiles.length,

        currentCacheTtlHours:
          1,

        historicalCacheTtlDays:
          30,
      },

      volcanoes: {
        provider:
          "U.S. Geological Survey",

        program:
          "Volcano Hazards Program",

        authenticationRequired:
          false,

        cachedQueries:
          volcanoFiles.length,

        cacheTtlMinutes:
          30,
      },
    },

    renderRuntimeExternalCalls:
      0,
  };
};