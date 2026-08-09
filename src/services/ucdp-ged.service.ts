import fs from "fs/promises";
import path from "path";

const UCDP_VERSION = "26.1";

const DATA_ROOT =
  process.env.UCDP_GED_DATA_DIR
    ? path.resolve(
        process.env.UCDP_GED_DATA_DIR,
      )
    : path.resolve(
        process.cwd(),
        ".data",
        "ucdp-ged",
        UCDP_VERSION,
      );

const MANIFEST_PATH =
  path.join(
    DATA_ROOT,
    "manifest.json",
  );

const EVENT_INDEX_PATH =
  path.join(
    DATA_ROOT,
    "event-index.json",
  );

const YEARS_DIR =
  path.join(
    DATA_ROOT,
    "years",
  );

type UcdpManifest = {
  dataset:
    "UCDP Georeferenced Event Dataset";

  abbreviation:
    "UCDP GED";

  version: string;

  generatedAt: string;

  sourceUrl: string;

  coverageStart: string;
  coverageEnd: string;

  recordCount: number;

  years:
    Record<
      string,
      number
    >;

  citations:
    string[];
};

type UcdpLocalEventRecord = {
  id: number;
  year: number;

  code_status:
    string
    | null;

  type_of_violence:
    number;

  conflict_new_id:
    number
    | null;

  conflict_name:
    string
    | null;

  dyad_new_id:
    number
    | null;

  dyad_name:
    string
    | null;

  side_a_new_id:
    number
    | null;

  side_a:
    string
    | null;

  side_b_new_id:
    number
    | null;

  side_b:
    string
    | null;

  country:
    string
    | null;

  country_id:
    number
    | null;

  region:
    string
    | null;

  where_coordinates:
    string
    | null;

  where_description:
    string
    | null;

  adm_1:
    string
    | null;

  adm_2:
    string
    | null;

  latitude:
    number
    | null;

  longitude:
    number
    | null;

  where_prec:
    number
    | null;

  date_start:
    string;

  date_end:
    string;

  date_prec:
    number
    | null;

  deaths_a:
    number;

  deaths_b:
    number;

  deaths_civilians:
    number;

  deaths_unknown:
    number;

  best:
    number;

  high:
    number;

  low:
    number;

  source_article:
    string
    | null;

  source_original:
    string
    | null;

  source_headline:
    string
    | null;
};

export type CurioMintConflictViolenceType =
  | 1
  | 2
  | 3;

export type CurioMintConflictEvent = {
  id: number;
  year: number;

  violenceType: {
    id:
      CurioMintConflictViolenceType;

    label:
      | "state-based conflict"
      | "non-state conflict"
      | "one-sided violence";
  };

  conflict: {
    id:
      number
      | null;

    name:
      string
      | null;
  };

  dyad: {
    id:
      number
      | null;

    name:
      string
      | null;
  };

  actors: Array<{
    side:
      "A"
      | "B";

    id:
      number
      | null;

    name:
      string
      | null;
  }>;

  location: {
    country:
      string
      | null;

    countryId:
      number
      | null;

    region:
      string
      | null;

    admin1:
      string
      | null;

    admin2:
      string
      | null;

    name:
      string
      | null;

    description:
      string
      | null;

    latitude:
      number
      | null;

    longitude:
      number
      | null;

    precision:
      number
      | null;
  };

  dates: {
    start: string;
    end: string;

    precision:
      number
      | null;
  };

  fatalities: {
    sideA: number;
    sideB: number;
    civilians: number;
    unknown: number;

    bestEstimate: number;
    lowEstimate: number;
    highEstimate: number;
  };

  codingStatus:
    string
    | null;

  sourceReferences: {
    article:
      string
      | null;

    original:
      string
      | null;

    headline:
      string
      | null;
  };
};

export type UcdpConflictOrderBy =
  | "date-desc"
  | "date-asc"
  | "deaths-desc"
  | "deaths-asc";

export type UcdpConflictSearchInput = {
  startDate: string;
  endDate: string;

  country?: string;
  countryId?: number;

  region?: string;

  typeOfViolence?:
    CurioMintConflictViolenceType[];

  conflictId?: number;
  actorId?: number;

  minBestDeaths?: number;

  orderBy:
    UcdpConflictOrderBy;

  limit: number;
};

let manifestCache:
  UcdpManifest
  | null = null;

let eventIndexCache:
  Record<
    string,
    number
  >
  | null = null;

const yearCache =
  new Map<
    number,
    UcdpLocalEventRecord[]
  >();

const readJson = async <T>(
  filePath: string,
): Promise<T> => {
  return JSON.parse(
    await fs.readFile(
      filePath,
      "utf8",
    ),
  ) as T;
};

const loadManifest =
  async (): Promise<UcdpManifest> => {
    if (manifestCache) {
      return manifestCache;
    }

    const manifest =
      await readJson<UcdpManifest>(
        MANIFEST_PATH,
      );

    if (
      manifest.version !==
      UCDP_VERSION
    ) {
      throw new Error(
        `UCDP GED version mismatch: expected ${UCDP_VERSION}, found ${manifest.version}`,
      );
    }

    manifestCache =
      manifest;

    return manifest;
  };

const loadEventIndex =
  async () => {
    if (eventIndexCache) {
      return eventIndexCache;
    }

    eventIndexCache =
      await readJson<
        Record<
          string,
          number
        >
      >(
        EVENT_INDEX_PATH,
      );

    return eventIndexCache;
  };

const loadYear =
  async (
    year: number,
  ): Promise<
    UcdpLocalEventRecord[]
  > => {
    const cached =
      yearCache.get(
        year,
      );

    if (cached) {
      return cached;
    }

    const filePath =
      path.join(
        YEARS_DIR,
        `${year}.jsonl`,
      );

    let text:
      string;

    try {
      text =
        await fs.readFile(
          filePath,
          "utf8",
        );
    } catch (error) {
      const code =
        (
          error as
            NodeJS.ErrnoException
        ).code;

      if (
        code ===
        "ENOENT"
      ) {
        yearCache.set(
          year,
          [],
        );

        return [];
      }

      throw error;
    }

    const events =
      text
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim()
              .length > 0,
        )
        .map(
          (line) =>
            JSON.parse(
              line,
            ) as
              UcdpLocalEventRecord,
        );

    yearCache.set(
      year,
      events,
    );

    return events;
  };

const normalizeIsoDate = (
  value: unknown,
  fieldName: string,
): string => {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} is required`,
    );
  }

  const trimmed =
    value.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      trimmed,
    )
  ) {
    throw new Error(
      `${fieldName} must use YYYY-MM-DD`,
    );
  }

  const parsed =
    Date.parse(
      `${trimmed}T00:00:00Z`,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    throw new Error(
      `${fieldName} is invalid`,
    );
  }

  return trimmed;
};

const optionalInteger = ({
  value,
  fieldName,
  min,
}: {
  value: unknown;

  fieldName: string;

  min?: number;
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

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed,
    )
  ) {
    throw new Error(
      `${fieldName} must be an integer`,
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

  return parsed;
};

const optionalString = (
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
    String(
      value,
    ).trim();

  return text
    ? text
    : undefined;
};

const normalizeViolenceTypes = (
  value: unknown,
):
  CurioMintConflictViolenceType[]
  | undefined => {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  const raw =
    Array.isArray(
      value,
    )
      ? value
      : [value];

  const output:
    CurioMintConflictViolenceType[] =
    [];

  for (
    const item of raw
  ) {
    const parsed =
      Number(item);

    if (
      parsed !== 1 &&
      parsed !== 2 &&
      parsed !== 3
    ) {
      throw new Error(
        "typeOfViolence values must be 1, 2, or 3",
      );
    }

    if (
      !output.includes(
        parsed,
      )
    ) {
      output.push(
        parsed,
      );
    }
  }

  return output;
};

const normalizeSearchInput = (
  raw:
    Record<
      string,
      unknown
    >,
): UcdpConflictSearchInput => {
  const startDate =
    normalizeIsoDate(
      raw.startDate,
      "startDate",
    );

  const endDate =
    normalizeIsoDate(
      raw.endDate,
      "endDate",
    );

  if (
    startDate >
    endDate
  ) {
    throw new Error(
      "startDate must be before or equal to endDate",
    );
  }

  const country =
    optionalString(
      raw.country,
    );

  const region =
    optionalString(
      raw.region,
    );

  const countryId =
    optionalInteger({
      value:
        raw.countryId,

      fieldName:
        "countryId",
    });

  const conflictId =
    optionalInteger({
      value:
        raw.conflictId,

      fieldName:
        "conflictId",
    });

  const actorId =
    optionalInteger({
      value:
        raw.actorId,

      fieldName:
        "actorId",
    });

  const minBestDeaths =
    optionalInteger({
      value:
        raw.minBestDeaths,

      fieldName:
        "minBestDeaths",

      min: 0,
    });

  const typeOfViolence =
    normalizeViolenceTypes(
      raw.typeOfViolence,
    );

  const allowedOrderBy:
    UcdpConflictOrderBy[] = [
    "date-desc",
    "date-asc",
    "deaths-desc",
    "deaths-asc",
  ];

  const orderByRaw =
    raw.orderBy ===
      undefined
      ? "deaths-desc"
      : String(
          raw.orderBy,
        );

  if (
    !allowedOrderBy.includes(
      orderByRaw as
        UcdpConflictOrderBy,
    )
  ) {
    throw new Error(
      "orderBy must be date-desc, date-asc, deaths-desc, or deaths-asc",
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

  return {
    startDate,
    endDate,

    ...(country
      ? {
          country,
        }
      : {}),

    ...(countryId !==
    undefined
      ? {
          countryId,
        }
      : {}),

    ...(region
      ? {
          region,
        }
      : {}),

    ...(typeOfViolence
      ? {
          typeOfViolence,
        }
      : {}),

    ...(conflictId !==
    undefined
      ? {
          conflictId,
        }
      : {}),

    ...(actorId !==
    undefined
      ? {
          actorId,
        }
      : {}),

    ...(minBestDeaths !==
    undefined
      ? {
          minBestDeaths,
        }
      : {}),

    orderBy:
      orderByRaw as
        UcdpConflictOrderBy,

    limit,
  };
};

const violenceLabel = (
  value: number,
):
  CurioMintConflictEvent[
    "violenceType"
  ]["label"] => {
  if (value === 2) {
    return "non-state conflict";
  }

  if (value === 3) {
    return "one-sided violence";
  }

  return "state-based conflict";
};

const normalizeEvent = (
  event:
    UcdpLocalEventRecord,
): CurioMintConflictEvent => {
  const type =
    (
      event.type_of_violence ===
        2 ||
      event.type_of_violence ===
        3
        ? event.type_of_violence
        : 1
    ) as
      CurioMintConflictViolenceType;

  return {
    id:
      event.id,

    year:
      event.year,

    violenceType: {
      id:
        type,

      label:
        violenceLabel(
          type,
        ),
    },

    conflict: {
      id:
        event
          .conflict_new_id,

      name:
        event
          .conflict_name,
    },

    dyad: {
      id:
        event
          .dyad_new_id,

      name:
        event
          .dyad_name,
    },

    actors: [
      {
        side:
          "A",

        id:
          event
            .side_a_new_id,

        name:
          event.side_a,
      },
      {
        side:
          "B",

        id:
          event
            .side_b_new_id,

        name:
          event.side_b,
      },
    ],

    location: {
      country:
        event.country,

      countryId:
        event
          .country_id,

      region:
        event.region,

      admin1:
        event.adm_1,

      admin2:
        event.adm_2,

      name:
        event
          .where_coordinates,

      description:
        event
          .where_description,

      latitude:
        event.latitude,

      longitude:
        event.longitude,

      precision:
        event.where_prec,
    },

    dates: {
      start:
        event.date_start,

      end:
        event.date_end,

      precision:
        event.date_prec,
    },

    fatalities: {
      sideA:
        event.deaths_a,

      sideB:
        event.deaths_b,

      civilians:
        event
          .deaths_civilians,

      unknown:
        event
          .deaths_unknown,

      bestEstimate:
        event.best,

      lowEstimate:
        event.low,

      highEstimate:
        event.high,
    },

    codingStatus:
      event.code_status,

    sourceReferences: {
      article:
        event
          .source_article,

      original:
        event
          .source_original,

      headline:
        event
          .source_headline,
    },
  };
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

const matchesSearch = (
  event:
    UcdpLocalEventRecord,

  query:
    UcdpConflictSearchInput,
) => {
  /*
   * Inclusive event-overlap semantics:
   * an event is included if its coded date range overlaps
   * the requested date range.
   */
  if (
    event.date_end <
      query.startDate ||
    event.date_start >
      query.endDate
  ) {
    return false;
  }

  if (
    query.countryId !==
      undefined &&
    event.country_id !==
      query.countryId
  ) {
    return false;
  }

  if (
    query.country &&
    normalizeSearchText(
      event.country,
    ) !==
      normalizeSearchText(
        query.country,
      )
  ) {
    return false;
  }

  if (
    query.region &&
    normalizeSearchText(
      event.region,
    ) !==
      normalizeSearchText(
        query.region,
      )
  ) {
    return false;
  }

  if (
    query.typeOfViolence &&
    !query.typeOfViolence.includes(
      event.type_of_violence as
        CurioMintConflictViolenceType,
    )
  ) {
    return false;
  }

  if (
    query.conflictId !==
      undefined &&
    event.conflict_new_id !==
      query.conflictId
  ) {
    return false;
  }

  if (
    query.actorId !==
      undefined &&
    event.side_a_new_id !==
      query.actorId &&
    event.side_b_new_id !==
      query.actorId
  ) {
    return false;
  }

  if (
    query.minBestDeaths !==
      undefined &&
    event.best <
      query.minBestDeaths
  ) {
    return false;
  }

  return true;
};

const sortEvents = (
  events:
    UcdpLocalEventRecord[],

  orderBy:
    UcdpConflictOrderBy,
) => {
  return events.sort(
    (
      a,
      b,
    ) => {
      switch (
        orderBy
      ) {
        case "date-asc":
          return (
            a.date_start
              .localeCompare(
                b.date_start,
              ) ||
            a.id -
              b.id
          );

        case "date-desc":
          return (
            b.date_start
              .localeCompare(
                a.date_start,
              ) ||
            a.id -
              b.id
          );

        case "deaths-asc":
          return (
            a.best -
              b.best ||
            a.id -
              b.id
          );

        case "deaths-desc":
        default:
          return (
            b.best -
              a.best ||
            a.id -
              b.id
          );
      }
    },
  );
};

const sourceMetadata = (
  manifest:
    UcdpManifest,
) => ({
  provider:
    "Uppsala Conflict Data Program" as const,

  dataset:
    "UCDP Georeferenced Event Dataset" as const,

  abbreviation:
    "UCDP GED" as const,

  version:
    manifest.version,

  coverage: {
    start:
      manifest
        .coverageStart,

    end:
      manifest
        .coverageEnd,
  },

  sourceUrl:
    manifest.sourceUrl,

  citations:
    manifest.citations,

  authenticationRequired:
    false as const,

  runtimeExternalCalls:
    0 as const,
});

export const searchUcdpConflictEvents =
  async (
    raw:
      Record<
        string,
        unknown
      >,
  ) => {
    const manifest =
      await loadManifest();

    const query =
      normalizeSearchInput(
        raw,
      );

    const startYear =
      Number(
        query.startDate
          .slice(
            0,
            4,
          ),
      );

    const endYear =
      Number(
        query.endDate
          .slice(
            0,
            4,
          ),
      );

    const coverageStartYear =
      Number(
        manifest
          .coverageStart
          .slice(
            0,
            4,
          ),
      );

    const coverageEndYear =
      Number(
        manifest
          .coverageEnd
          .slice(
            0,
            4,
          ),
      );

    const firstYear =
      Math.max(
        startYear,
        coverageStartYear,
      );

    const lastYear =
      Math.min(
        endYear,
        coverageEndYear,
      );

    const matched:
      UcdpLocalEventRecord[] =
      [];

    if (
      firstYear <=
      lastYear
    ) {
      for (
        let year =
          firstYear;
        year <=
          lastYear;
        year += 1
      ) {
        const events =
          await loadYear(
            year,
          );

        for (
          const event of
          events
        ) {
          if (
            matchesSearch(
              event,
              query,
            )
          ) {
            matched.push(
              event,
            );
          }
        }
      }
    }

    sortEvents(
      matched,
      query.orderBy,
    );

    const totalMatches =
      matched.length;

    const selected =
      matched.slice(
        0,
        query.limit,
      );

    return {
      success: true,

      query,

      totalMatches,

      returned:
        selected.length,

      events:
        selected.map(
          normalizeEvent,
        ),

      cache: {
        loadedYears:
          Array.from(
            yearCache.keys(),
          ).sort(
            (
              a,
              b,
            ) =>
              a -
              b,
          ),

        loadedYearCount:
          yearCache.size,
      },

      source:
        sourceMetadata(
          manifest,
        ),
    };
  };

export const resolveUcdpConflictEvent =
  async (
    rawId: unknown,
  ) => {
    const id =
      Number(
        rawId,
      );

    if (
      !Number.isInteger(
        id,
      ) ||
      id < 1
    ) {
      throw new Error(
        "eventId must be a positive integer",
      );
    }

    const manifest =
      await loadManifest();

    const eventIndex =
      await loadEventIndex();

    const year =
      eventIndex[
        String(id)
      ];

    if (
      !year
    ) {
      throw new Error(
        `UCDP GED event "${id}" was not found`,
      );
    }

    const events =
      await loadYear(
        year,
      );

    const event =
      events.find(
        (candidate) =>
          candidate.id ===
          id,
      );

    if (!event) {
      throw new Error(
        `UCDP GED event "${id}" was not found`,
      );
    }

    return {
      success: true,

      event:
        normalizeEvent(
          event,
        ),

      source:
        sourceMetadata(
          manifest,
        ),
    };
  };

export const getUcdpConflictStatus =
  async () => {
    try {
      const manifest =
        await loadManifest();

      return {
        available: true,

        dataDirectory:
          DATA_ROOT,

        recordCount:
          manifest
            .recordCount,

        years:
          manifest.years,

        loadedYears:
          Array.from(
            yearCache.keys(),
          ).sort(
            (
              a,
              b,
            ) =>
              a -
              b,
          ),

        loadedYearCount:
          yearCache.size,

        source:
          sourceMetadata(
            manifest,
          ),
      };
    } catch (error) {
      const code =
        (
          error as
            NodeJS.ErrnoException
        ).code;

      if (
        code ===
        "ENOENT"
      ) {
        return {
          available: false,

          dataDirectory:
            DATA_ROOT,

          message:
            "UCDP GED local dataset is not provisioned",

          requiredVersion:
            UCDP_VERSION,

          provisionCommands: {
            windows:
              "powershell -ExecutionPolicy Bypass -File .\\scripts\\provision-ucdp-ged-local.ps1",

            linux:
              "bash scripts/provision-ucdp-ged-vps.sh",
          },

          runtimeExternalCalls:
            0,
        };
      }

      throw error;
    }
  };