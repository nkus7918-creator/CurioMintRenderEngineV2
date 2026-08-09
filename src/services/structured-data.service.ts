import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const WORLD_BANK_API = "https://api.worldbank.org/v2";

const CACHE_ROOT = path.resolve(
  "/app/media-cache",
  "structured-data",
  "world-bank",
);

const COUNTRY_CACHE_DIR = path.join(CACHE_ROOT, "countries");

const INDICATOR_CACHE_DIR = path.join(CACHE_ROOT, "indicators");

const REQUEST_TIMEOUT_MS = 25_000;

const LATEST_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const HISTORICAL_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (structured documentary data resolver)";

export type CurioMintIndicatorKey =
  | "population"
  | "gdpUsd"
  | "gdpPerCapitaUsd"
  | "lifeExpectancyYears"
  | "urbanPopulationPct"
  | "internetUsersPct";

type IndicatorDefinition = {
  key: CurioMintIndicatorKey;

  code: string;
  label: string;

  unit: "people" | "usd" | "usd-per-person" | "years" | "percent";

  decimals: number;
};

export const CURATED_WORLD_BANK_INDICATORS: Record<
  CurioMintIndicatorKey,
  IndicatorDefinition
> = {
  population: {
    key: "population",

    code: "SP.POP.TOTL",

    label: "Population",

    unit: "people",

    decimals: 0,
  },

  gdpUsd: {
    key: "gdpUsd",

    code: "NY.GDP.MKTP.CD",

    label: "GDP (current US$)",

    unit: "usd",

    decimals: 0,
  },

  gdpPerCapitaUsd: {
    key: "gdpPerCapitaUsd",

    code: "NY.GDP.PCAP.CD",

    label: "GDP per capita (current US$)",

    unit: "usd-per-person",

    decimals: 0,
  },

  lifeExpectancyYears: {
    key: "lifeExpectancyYears",

    code: "SP.DYN.LE00.IN",

    label: "Life expectancy at birth",

    unit: "years",

    decimals: 1,
  },

  urbanPopulationPct: {
    key: "urbanPopulationPct",

    code: "SP.URB.TOTL.IN.ZS",

    label: "Urban population",

    unit: "percent",

    decimals: 1,
  },

  internetUsersPct: {
    key: "internetUsersPct",

    code: "IT.NET.USER.ZS",

    label: "Individuals using the Internet",

    unit: "percent",

    decimals: 1,
  },
};

const DEFAULT_INDICATORS: CurioMintIndicatorKey[] = [
  "population",
  "gdpUsd",
  "gdpPerCapitaUsd",
  "lifeExpectancyYears",
  "urbanPopulationPct",
  "internetUsersPct",
];

type WorldBankCountry = {
  id?: string;
  iso2Code?: string;
  name?: string;

  region?: {
    id?: string;
    iso2code?: string;
    value?: string;
  };

  adminregion?: {
    id?: string;
    iso2code?: string;
    value?: string;
  };

  incomeLevel?: {
    id?: string;
    iso2code?: string;
    value?: string;
  };

  lendingType?: {
    id?: string;
    iso2code?: string;
    value?: string;
  };

  capitalCity?: string;
  longitude?: string;
  latitude?: string;
};

type WorldBankIndicatorObservation = {
  indicator?: {
    id?: string;
    value?: string;
  };

  country?: {
    id?: string;
    value?: string;
  };

  countryiso3code?: string;

  date?: string;

  value?: number | null;

  unit?: string;
  obs_status?: string;
  decimal?: number;
};

type JsonCacheEnvelope<T> = {
  source: "World Bank V2 API";

  fetchedAt: string;
  expiresAt: string;

  key: string;

  data: T;
};

export type StructuredCountryProfile = {
  country: {
    iso2Code: string;
    iso3Code: string;

    name: string;
    capital: string | null;

    region: {
      id: string | null;
      name: string | null;
    };

    adminRegion: {
      id: string | null;
      name: string | null;
    };

    incomeLevel: {
      id: string | null;
      name: string | null;
    };

    lendingType: {
      id: string | null;
      name: string | null;
    };

    coordinates: {
      latitude: number | null;
      longitude: number | null;
    };
  };

  requestedYear: number | null;

  indicators: Partial<
    Record<
      CurioMintIndicatorKey,
      {
        key: CurioMintIndicatorKey;

        code: string;
        label: string;

        value: number | null;

        formattedValue: string | null;

        year: number | null;

        unit: IndicatorDefinition["unit"];

        source: "World Bank Indicators API";

        sourceUrl: string;

        cacheHit: boolean;
        staleCache: boolean;
      }
    >
  >;

  source: {
    provider: "World Bank";

    apiVersion: "v2";

    countryApi: string;

    indicatorsApi: string;

    authenticationRequired: false;
  };
};

const ensureCacheDirs = async () => {
  await Promise.all([
    fs.mkdir(COUNTRY_CACHE_DIR, {
      recursive: true,
    }),

    fs.mkdir(INDICATOR_CACHE_DIR, {
      recursive: true,
    }),
  ]);
};

const normalizeCountryCode = (value: unknown): string => {
  const code = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    throw new Error("countryCode must be a 2-letter ISO-style country code");
  }

  return code;
};

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const parseYear = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const year = Number(value);

  if (!Number.isInteger(year) || year < 1960 || year > 2100) {
    throw new Error("year must be an integer between 1960 and 2100");
  }

  return year;
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

  const envelope: JsonCacheEnvelope<T> = {
    source: "World Bank V2 API",

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

const fetchWorldBankJson = async (url: string): Promise<unknown> => {
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
        `World Bank API HTTP ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const readWorldBankPayloadRows = <T>(payload: unknown): T[] => {
  if (
    !Array.isArray(payload) ||
    payload.length < 2 ||
    !Array.isArray(payload[1])
  ) {
    return [];
  }

  return payload[1] as T[];
};

const getCountry = async (
  countryCode: string,
): Promise<{
  country: WorldBankCountry;

  cacheHit: boolean;
  staleCache: boolean;
}> => {
  await ensureCacheDirs();

  const key = `country:${countryCode}`;

  const filePath = cacheFile(COUNTRY_CACHE_DIR, key);

  const cached = await readCache<WorldBankCountry>(filePath);

  if (cached && !cached.expired) {
    return {
      country: cached.envelope.data,

      cacheHit: true,
      staleCache: false,
    };
  }

  const url = `${WORLD_BANK_API}/country/${encodeURIComponent(countryCode)}?format=json`;

  try {
    const payload = await fetchWorldBankJson(url);

    const rows = readWorldBankPayloadRows<WorldBankCountry>(payload);

    const country = rows[0];

    if (!country || !country.iso2Code || !country.name) {
      throw new Error(`World Bank country "${countryCode}" was not found`);
    }

    await writeCache({
      filePath,
      key,
      data: country,

      ttlMs: HISTORICAL_CACHE_TTL_MS,
    });

    return {
      country,
      cacheHit: false,
      staleCache: false,
    };
  } catch (error) {
    if (cached) {
      return {
        country: cached.envelope.data,

        cacheHit: true,
        staleCache: true,
      };
    }

    throw error;
  }
};

const formatCompactNumber = (value: number, decimals = 1): string => {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(decimals)}T`;
  }

  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }

  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }

  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
};

const formatIndicatorValue = (
  value: number,
  definition: IndicatorDefinition,
): string => {
  switch (definition.unit) {
    case "people":
      return formatCompactNumber(value, 1);

    case "usd":
      return `$${formatCompactNumber(value, 1)}`;

    case "usd-per-person":
      return `$${Math.round(value).toLocaleString("en-US")}`;

    case "years":
      return `${value.toFixed(definition.decimals)} years`;

    case "percent":
      return `${value.toFixed(definition.decimals)}%`;
  }
};

const getIndicatorObservation = async ({
  countryCode,
  definition,
  year,
}: {
  countryCode: string;

  definition: IndicatorDefinition;

  year: number | null;
}): Promise<{
  observation: WorldBankIndicatorObservation | null;

  cacheHit: boolean;
  staleCache: boolean;

  sourceUrl: string;
}> => {
  await ensureCacheDirs();

  const periodKey = year === null ? "latest" : String(year);

  const key = `indicator:${countryCode}:${definition.code}:${periodKey}`;

  const filePath = cacheFile(INDICATOR_CACHE_DIR, key);

  const cached = await readCache<WorldBankIndicatorObservation | null>(
    filePath,
  );

  if (cached && !cached.expired) {
    const sourceUrl = buildIndicatorUrl({
      countryCode,
      indicatorCode: definition.code,
      year,
    });

    return {
      observation: cached.envelope.data,

      cacheHit: true,
      staleCache: false,

      sourceUrl,
    };
  }

  const sourceUrl = buildIndicatorUrl({
    countryCode,
    indicatorCode: definition.code,
    year,
  });

  try {
    const payload = await fetchWorldBankJson(sourceUrl);

    const rows =
      readWorldBankPayloadRows<WorldBankIndicatorObservation>(payload);

    const observation =
      rows.find(
        (row) => typeof row.value === "number" && Number.isFinite(row.value),
      ) ?? null;

    await writeCache({
      filePath,
      key,
      data: observation,

      ttlMs: year === null ? LATEST_CACHE_TTL_MS : HISTORICAL_CACHE_TTL_MS,
    });

    return {
      observation,
      cacheHit: false,
      staleCache: false,

      sourceUrl,
    };
  } catch (error) {
    if (cached) {
      return {
        observation: cached.envelope.data,

        cacheHit: true,
        staleCache: true,

        sourceUrl,
      };
    }

    throw error;
  }
};

const buildIndicatorUrl = ({
  countryCode,
  indicatorCode,
  year,
}: {
  countryCode: string;
  indicatorCode: string;
  year: number | null;
}) => {
  const params = new URLSearchParams({
    format: "json",
    per_page: "100",
  });

  if (year === null) {
    const currentYear = new Date().getUTCFullYear();

    params.set("date", `${currentYear - 10}:${currentYear}`);
  } else {
    params.set("date", String(year));
  }

  return (
    `${WORLD_BANK_API}/country/` +
    `${encodeURIComponent(countryCode)}/indicator/` +
    `${encodeURIComponent(indicatorCode)}?` +
    params.toString()
  );
};

const normalizeIndicatorKeys = (value: unknown): CurioMintIndicatorKey[] => {
  if (value === null || value === undefined) {
    return [...DEFAULT_INDICATORS];
  }

  if (!Array.isArray(value)) {
    throw new Error("indicators must be an array");
  }

  const output: CurioMintIndicatorKey[] = [];

  for (const raw of value) {
    const key = String(raw) as CurioMintIndicatorKey;

    if (
      !Object.prototype.hasOwnProperty.call(CURATED_WORLD_BANK_INDICATORS, key)
    ) {
      throw new Error(`Unsupported indicator "${String(raw)}"`);
    }

    if (!output.includes(key)) {
      output.push(key);
    }
  }

  return output;
};

export const resolveStructuredCountryProfile = async ({
  countryCode: rawCountryCode,

  year: rawYear,

  indicators: rawIndicators,
}: {
  countryCode: unknown;

  year?: unknown;

  indicators?: unknown;
}): Promise<StructuredCountryProfile> => {
  const countryCode = normalizeCountryCode(rawCountryCode);

  const year = parseYear(rawYear);

  const indicatorKeys = normalizeIndicatorKeys(rawIndicators);

  const countryResult = await getCountry(countryCode);

  const observations = await Promise.all(
    indicatorKeys.map(async (key) => {
      const definition = CURATED_WORLD_BANK_INDICATORS[key];

      const result = await getIndicatorObservation({
        countryCode,

        definition,

        year,
      });

      const value =
        typeof result.observation?.value === "number"
          ? result.observation.value
          : null;

      const observationYear = result.observation?.date
        ? Number(result.observation.date)
        : null;

      return {
        key,

        data: {
          key,

          code: definition.code,

          label: definition.label,

          value,

          formattedValue:
            value === null ? null : formatIndicatorValue(value, definition),

          year: Number.isInteger(observationYear) ? observationYear : null,

          unit: definition.unit,

          source: "World Bank Indicators API" as const,

          sourceUrl: result.sourceUrl,

          cacheHit: result.cacheHit,

          staleCache: result.staleCache,
        },
      };
    }),
  );

  const country = countryResult.country;

  const indicators: StructuredCountryProfile["indicators"] = {};

  for (const observation of observations) {
    indicators[observation.key] = observation.data;
  }

  return {
    country: {
      iso2Code: String(country.iso2Code ?? countryCode).toUpperCase(),

      iso3Code: String(country.id ?? "").toUpperCase(),

      name: String(country.name ?? countryCode),

      capital: country.capitalCity ? String(country.capitalCity) : null,

      region: {
        id: country.region?.id ? String(country.region.id) : null,

        name: country.region?.value ? String(country.region.value) : null,
      },

      adminRegion: {
        id: country.adminregion?.id ? String(country.adminregion.id) : null,

        name: country.adminregion?.value
          ? String(country.adminregion.value)
          : null,
      },

      incomeLevel: {
        id: country.incomeLevel?.id ? String(country.incomeLevel.id) : null,

        name: country.incomeLevel?.value
          ? String(country.incomeLevel.value)
          : null,
      },

      lendingType: {
        id: country.lendingType?.id ? String(country.lendingType.id) : null,

        name: country.lendingType?.value
          ? String(country.lendingType.value)
          : null,
      },

      coordinates: {
        latitude: numberOrNull(country.latitude),

        longitude: numberOrNull(country.longitude),
      },
    },

    requestedYear: year,

    indicators,

    source: {
      provider: "World Bank",

      apiVersion: "v2",

      countryApi: `${WORLD_BANK_API}/country/${countryCode}?format=json`,

      indicatorsApi: `${WORLD_BANK_API}/country/${countryCode}/indicator/{indicator}?format=json`,

      authenticationRequired: false,
    },
  };
};

export const getStructuredDataStatus = async () => {
  await ensureCacheDirs();

  const [countryCache, indicatorCache] = await Promise.all([
    fs.readdir(COUNTRY_CACHE_DIR),

    fs.readdir(INDICATOR_CACHE_DIR),
  ]);

  return {
    available: true,

    provider: "World Bank",

    apiVersion: "v2",

    authenticationRequired: false,

    cacheDirectory: CACHE_ROOT,

    cachedCountryProfiles: countryCache.length,

    cachedIndicatorQueries: indicatorCache.length,

    curatedIndicators: Object.values(CURATED_WORLD_BANK_INDICATORS),

    latestCacheTtlDays: 7,

    historicalCacheTtlDays: 30,

    renderRuntimeExternalCalls: 0,
  };
};
