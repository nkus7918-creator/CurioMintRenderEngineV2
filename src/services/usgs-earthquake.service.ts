import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const USGS_EVENT_API = "https://earthquake.usgs.gov/fdsnws/event/1";

const CACHE_ROOT = path.resolve(
  "/app/media-cache",
  "structured-data",
  "usgs-earthquakes",
);

const SEARCH_CACHE_DIR = path.join(CACHE_ROOT, "searches");
const EVENT_CACHE_DIR = path.join(CACHE_ROOT, "events");

const REQUEST_TIMEOUT_MS = 30_000;
const CURRENT_CACHE_TTL_MS = 60 * 60 * 1000;
const HISTORICAL_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (USGS earthquake documentary data resolver)";

export type UsgsEarthquakeOrderBy =
  | "time"
  | "time-asc"
  | "magnitude"
  | "magnitude-asc";

export type UsgsEarthquakeSearchInput = {
  startTime: string;
  endTime: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepthKm?: number;
  maxDepthKm?: number;
  latitude?: number;
  longitude?: number;
  maxRadiusKm?: number;
  minSignificance?: number;
  orderBy?: UsgsEarthquakeOrderBy;
  limit?: number;
};

type UsgsGeoJsonFeatureCollection = {
  type?: string;
  metadata?: {
    generated?: number;
    url?: string;
    title?: string;
    api?: string;
    count?: number;
    status?: number;
  };
  features?: UsgsGeoJsonFeature[];
};

type UsgsGeoJsonFeature = {
  type?: string;
  id?: string;
  properties?: {
    mag?: number | null;
    place?: string | null;
    time?: number | null;
    updated?: number | null;
    url?: string | null;
    detail?: string | null;
    felt?: number | null;
    cdi?: number | null;
    mmi?: number | null;
    alert?: string | null;
    status?: string | null;
    tsunami?: number | null;
    sig?: number | null;
    net?: string | null;
    code?: string | null;
    magType?: string | null;
    type?: string | null;
  };
  geometry?: {
    type?: string;
    coordinates?: [number?, number?, number?];
  };
};

type CacheEnvelope<T> = {
  source: "USGS FDSN Event Web Service";
  fetchedAt: string;
  expiresAt: string;
  key: string;
  data: T;
};

export type CurioMintEarthquakeEvent = {
  id: string;
  magnitude: number | null;
  magnitudeType: string | null;
  place: string | null;
  time: string | null;
  updatedAt: string | null;
  depthKm: number | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  impact: {
    feltReports: number | null;
    communityIntensity: number | null;
    estimatedIntensity: number | null;
    alert: string | null;
    significance: number | null;
    tsunami: boolean;
  };
  status: string | null;
  eventType: string | null;
  network: string | null;
  officialUrl: string | null;
  detailUrl: string | null;
};

export type CurioMintEarthquakeSearchResult = {
  query: UsgsEarthquakeSearchInput;
  count: number;
  generatedAt: string | null;
  events: CurioMintEarthquakeEvent[];
  cache: {
    hit: boolean;
    stale: boolean;
  };
  source: {
    provider: "U.S. Geological Survey";
    catalog: "ANSS Comprehensive Earthquake Catalog (ComCat)";
    api: "FDSN Event Web Service v1";
    queryUrl: string;
    authenticationRequired: false;
  };
};

const ensureCacheDirs = async () => {
  await Promise.all([
    fs.mkdir(SEARCH_CACHE_DIR, { recursive: true }),
    fs.mkdir(EVENT_CACHE_DIR, { recursive: true }),
  ]);
};

const cacheFile = (directory: string, key: string) =>
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
  envelope: CacheEnvelope<T>;
  expired: boolean;
} | null> => {
  try {
    const envelope = JSON.parse(
      await fs.readFile(filePath, "utf8"),
    ) as CacheEnvelope<T>;

    const expiresAt = Date.parse(envelope.expiresAt);

    return {
      envelope,
      expired: !Number.isFinite(expiresAt) || expiresAt <= Date.now(),
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

  const envelope: CacheEnvelope<T> = {
    source: "USGS FDSN Event Web Service",
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

  return envelope;
};

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const epochToIso = (value: unknown): string | null => {
  const epoch = numberOrNull(value);

  if (epoch === null) {
    return null;
  }

  const date = new Date(epoch);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeDateInput = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = new Date(value.trim());

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO8601 date/time`);
  }

  return parsed.toISOString();
};

const optionalNumber = ({
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
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a finite number`);
  }

  if (min !== undefined && parsed < min) {
    throw new Error(`${fieldName} must be >= ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`${fieldName} must be <= ${max}`);
  }

  return parsed;
};

const normalizeSearchInput = (
  raw: Record<string, unknown>,
): UsgsEarthquakeSearchInput => {
  const startTime = normalizeDateInput(raw.startTime, "startTime");
  const endTime = normalizeDateInput(raw.endTime, "endTime");

  if (Date.parse(startTime) > Date.parse(endTime)) {
    throw new Error("startTime must be before or equal to endTime");
  }

  const minMagnitude = optionalNumber({
    value: raw.minMagnitude,
    fieldName: "minMagnitude",
  });

  const maxMagnitude = optionalNumber({
    value: raw.maxMagnitude,
    fieldName: "maxMagnitude",
  });

  if (
    minMagnitude !== undefined &&
    maxMagnitude !== undefined &&
    minMagnitude > maxMagnitude
  ) {
    throw new Error("minMagnitude must be <= maxMagnitude");
  }

  const minDepthKm = optionalNumber({
    value: raw.minDepthKm,
    fieldName: "minDepthKm",
    min: -100,
    max: 1000,
  });

  const maxDepthKm = optionalNumber({
    value: raw.maxDepthKm,
    fieldName: "maxDepthKm",
    min: -100,
    max: 1000,
  });

  if (
    minDepthKm !== undefined &&
    maxDepthKm !== undefined &&
    minDepthKm > maxDepthKm
  ) {
    throw new Error("minDepthKm must be <= maxDepthKm");
  }

  const latitude = optionalNumber({
    value: raw.latitude,
    fieldName: "latitude",
    min: -90,
    max: 90,
  });

  const longitude = optionalNumber({
    value: raw.longitude,
    fieldName: "longitude",
    min: -180,
    max: 180,
  });

  const maxRadiusKm = optionalNumber({
    value: raw.maxRadiusKm,
    fieldName: "maxRadiusKm",
    min: 0,
    max: 20001.6,
  });

  const suppliedCircleValues = [latitude, longitude, maxRadiusKm].filter(
    (value) => value !== undefined,
  ).length;

  if (suppliedCircleValues !== 0 && suppliedCircleValues !== 3) {
    throw new Error(
      "latitude, longitude, and maxRadiusKm must be supplied together",
    );
  }

  const minSignificance = optionalNumber({
    value: raw.minSignificance,
    fieldName: "minSignificance",
    min: 0,
  });

  const allowedOrderBy: UsgsEarthquakeOrderBy[] = [
    "time",
    "time-asc",
    "magnitude",
    "magnitude-asc",
  ];

  const orderByRaw =
    raw.orderBy === undefined ? "magnitude" : String(raw.orderBy);

  if (!allowedOrderBy.includes(orderByRaw as UsgsEarthquakeOrderBy)) {
    throw new Error(
      "orderBy must be time, time-asc, magnitude, or magnitude-asc",
    );
  }

  const rawLimit = raw.limit === undefined ? 50 : Number(raw.limit);

  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 500) {
    throw new Error("limit must be an integer between 1 and 500");
  }

  return {
    startTime,
    endTime,
    ...(minMagnitude !== undefined ? { minMagnitude } : {}),
    ...(maxMagnitude !== undefined ? { maxMagnitude } : {}),
    ...(minDepthKm !== undefined ? { minDepthKm } : {}),
    ...(maxDepthKm !== undefined ? { maxDepthKm } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(maxRadiusKm !== undefined ? { maxRadiusKm } : {}),
    ...(minSignificance !== undefined ? { minSignificance } : {}),
    orderBy: orderByRaw as UsgsEarthquakeOrderBy,
    limit: rawLimit,
  };
};

const buildSearchUrl = (query: UsgsEarthquakeSearchInput) => {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: query.startTime,
    endtime: query.endTime,
    orderby: query.orderBy ?? "magnitude",
    limit: String(query.limit ?? 50),
    eventtype: "earthquake",
    jsonerror: "true",
  });

  if (query.minMagnitude !== undefined) {
    params.set("minmagnitude", String(query.minMagnitude));
  }

  if (query.maxMagnitude !== undefined) {
    params.set("maxmagnitude", String(query.maxMagnitude));
  }

  if (query.minDepthKm !== undefined) {
    params.set("mindepth", String(query.minDepthKm));
  }

  if (query.maxDepthKm !== undefined) {
    params.set("maxdepth", String(query.maxDepthKm));
  }

  if (
    query.latitude !== undefined &&
    query.longitude !== undefined &&
    query.maxRadiusKm !== undefined
  ) {
    params.set("latitude", String(query.latitude));
    params.set("longitude", String(query.longitude));
    params.set("maxradiuskm", String(query.maxRadiusKm));
  }

  if (query.minSignificance !== undefined) {
    params.set("minsig", String(query.minSignificance));
  }

  return `${USGS_EVENT_API}/query?${params.toString()}`;
};

const buildEventUrl = (eventId: string) => {
  const params = new URLSearchParams({
    format: "geojson",
    eventid: eventId,
    jsonerror: "true",
  });

  return `${USGS_EVENT_API}/query?${params.toString()}`;
};

const fetchUsgsJson = async (
  url: string,
): Promise<UsgsGeoJsonFeatureCollection> => {
  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
        `USGS API HTTP ${response.status} ${response.statusText} for ${url}`,
      );
    }

    return (await response.json()) as UsgsGeoJsonFeatureCollection;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeFeature = (
  feature: UsgsGeoJsonFeature,
): CurioMintEarthquakeEvent => {
  const coordinates = feature.geometry?.coordinates ?? [];
  const properties = feature.properties ?? {};

  return {
    id: String(feature.id ?? properties.code ?? ""),
    magnitude: numberOrNull(properties.mag),
    magnitudeType: properties.magType ? String(properties.magType) : null,
    place: properties.place ? String(properties.place) : null,
    time: epochToIso(properties.time),
    updatedAt: epochToIso(properties.updated),
    depthKm: numberOrNull(coordinates[2]),
    coordinates: {
      latitude: numberOrNull(coordinates[1]),
      longitude: numberOrNull(coordinates[0]),
    },
    impact: {
      feltReports: numberOrNull(properties.felt),
      communityIntensity: numberOrNull(properties.cdi),
      estimatedIntensity: numberOrNull(properties.mmi),
      alert: properties.alert ? String(properties.alert) : null,
      significance: numberOrNull(properties.sig),
      tsunami: Number(properties.tsunami ?? 0) === 1,
    },
    status: properties.status ? String(properties.status) : null,
    eventType: properties.type ? String(properties.type) : null,
    network: properties.net ? String(properties.net) : null,
    officialUrl: properties.url ? String(properties.url) : null,
    detailUrl: properties.detail ? String(properties.detail) : null,
  };
};

const ttlForSearch = (query: UsgsEarthquakeSearchInput) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return Date.parse(query.endTime) < sevenDaysAgo
    ? HISTORICAL_CACHE_TTL_MS
    : CURRENT_CACHE_TTL_MS;
};

const buildSearchResult = ({
  query,
  queryUrl,
  payload,
  cacheHit,
  staleCache,
}: {
  query: UsgsEarthquakeSearchInput;
  queryUrl: string;
  payload: UsgsGeoJsonFeatureCollection;
  cacheHit: boolean;
  staleCache: boolean;
}): CurioMintEarthquakeSearchResult => {
  const events = Array.isArray(payload.features)
    ? payload.features.map(normalizeFeature)
    : [];

  return {
    query,
    count: events.length,
    generatedAt: epochToIso(payload.metadata?.generated),
    events,
    cache: {
      hit: cacheHit,
      stale: staleCache,
    },
    source: {
      provider: "U.S. Geological Survey",
      catalog: "ANSS Comprehensive Earthquake Catalog (ComCat)",
      api: "FDSN Event Web Service v1",
      queryUrl,
      authenticationRequired: false,
    },
  };
};

export const searchUsgsEarthquakes = async (
  raw: Record<string, unknown>,
): Promise<CurioMintEarthquakeSearchResult> => {
  await ensureCacheDirs();

  const query = normalizeSearchInput(raw);
  const queryUrl = buildSearchUrl(query);
  const key = `search:${JSON.stringify(query)}`;
  const filePath = cacheFile(SEARCH_CACHE_DIR, key);
  const cached = await readCache<UsgsGeoJsonFeatureCollection>(filePath);

  if (cached && !cached.expired) {
    return buildSearchResult({
      query,
      queryUrl,
      payload: cached.envelope.data,
      cacheHit: true,
      staleCache: false,
    });
  }

  try {
    const payload = await fetchUsgsJson(queryUrl);

    await writeCache({
      filePath,
      key,
      data: payload,
      ttlMs: ttlForSearch(query),
    });

    return buildSearchResult({
      query,
      queryUrl,
      payload,
      cacheHit: false,
      staleCache: false,
    });
  } catch (error) {
    if (cached) {
      return buildSearchResult({
        query,
        queryUrl,
        payload: cached.envelope.data,
        cacheHit: true,
        staleCache: true,
      });
    }

    throw error;
  }
};

const normalizeEventId = (value: unknown): string => {
  const eventId = String(value ?? "").trim();

  if (!/^[A-Za-z0-9._-]{3,80}$/.test(eventId)) {
    throw new Error("eventId is invalid");
  }

  return eventId;
};

export const resolveUsgsEarthquakeEvent = async (
  rawEventId: unknown,
): Promise<{
  event: CurioMintEarthquakeEvent;
  cache: {
    hit: boolean;
    stale: boolean;
  };
  source: {
    provider: "U.S. Geological Survey";
    catalog: "ANSS Comprehensive Earthquake Catalog (ComCat)";
    api: "FDSN Event Web Service v1";
    queryUrl: string;
    authenticationRequired: false;
  };
}> => {
  await ensureCacheDirs();

  const eventId = normalizeEventId(rawEventId);
  const queryUrl = buildEventUrl(eventId);
  const key = `event:${eventId}`;
  const filePath = cacheFile(EVENT_CACHE_DIR, key);
  const cached = await readCache<UsgsGeoJsonFeatureCollection>(filePath);

  const makeResponse = (
    payload: UsgsGeoJsonFeatureCollection,
    hit: boolean,
    stale: boolean,
  ) => {
    const feature = Array.isArray(payload.features)
      ? payload.features[0]
      : payload.type === "Feature"
        ? (payload as unknown as UsgsGeoJsonFeature)
        : undefined;

    if (!feature) {
      throw new Error(`USGS earthquake event "${eventId}" was not found`);
    }

    return {
      event: normalizeFeature(feature),
      cache: {
        hit,
        stale,
      },
      source: {
        provider: "U.S. Geological Survey" as const,
        catalog: "ANSS Comprehensive Earthquake Catalog (ComCat)" as const,
        api: "FDSN Event Web Service v1" as const,
        queryUrl,
        authenticationRequired: false as const,
      },
    };
  };

  if (cached && !cached.expired) {
    return makeResponse(cached.envelope.data, true, false);
  }

  try {
    const payload = await fetchUsgsJson(queryUrl);

    await writeCache({
      filePath,
      key,
      data: payload,
      ttlMs: HISTORICAL_CACHE_TTL_MS,
    });

    return makeResponse(payload, false, false);
  } catch (error) {
    if (cached) {
      return makeResponse(cached.envelope.data, true, true);
    }

    throw error;
  }
};

export const getUsgsEarthquakeStatus = async () => {
  await ensureCacheDirs();

  const [searches, events] = await Promise.all([
    fs.readdir(SEARCH_CACHE_DIR),
    fs.readdir(EVENT_CACHE_DIR),
  ]);

  return {
    available: true,
    provider: "U.S. Geological Survey",
    catalog: "ANSS Comprehensive Earthquake Catalog (ComCat)",
    api: "FDSN Event Web Service v1",
    authenticationRequired: false,
    cacheDirectory: CACHE_ROOT,
    cachedSearches: searches.length,
    cachedEvents: events.length,
    currentCacheTtlHours: 1,
    historicalCacheTtlDays: 30,
    maxResultsPerSearch: 500,
    renderRuntimeExternalCalls: 0,
  };
};
