type UnknownRecord = Record<string, unknown>;

type StatisticConfig = {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  description?: string;
};

type MapConfig = {
  title?: string;
  subtitle?: string;
  mapStyle?: "political" | "relief" | "blank";

  markers: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
  }>;
};

type TimelineConfig = {
  title?: string;
  activeIndex?: number;

  events: Array<{
    year: string;
    title: string;
  }>;
};

type AutoInfographics = {
  statistic?: StatisticConfig;
  map?: MapConfig;
  timeline?: TimelineConfig;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPath = (root: unknown, path: string[]): unknown => {
  let current: unknown = root;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
};

const firstText = (root: unknown, paths: string[][]): string | undefined => {
  for (const path of paths) {
    const value = getPath(root, path);

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

const firstFinite = (root: unknown, paths: string[][]): number | undefined => {
  for (const path of paths) {
    const value = getPath(root, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const firstArray = (
  root: unknown,
  paths: string[][],
): unknown[] | undefined => {
  for (const path of paths) {
    const value = getPath(root, path);

    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const longitudeToMapX = (longitude: number): number =>
  clamp(((longitude + 180) / 360) * 100, 0, 100);

const latitudeToMapY = (latitude: number): number =>
  clamp(((90 - latitude) / 180) * 100, 0, 100);

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const createCoordinateMap = ({
  id,
  label,
  latitude,
  longitude,
  title,
  subtitle,
  mapStyle = "political",
}: {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  mapStyle?: "political" | "relief" | "blank";
}): AutoInfographics => ({
  map: {
    title,
    subtitle,
    mapStyle,

    markers: [
      {
        id,
        label,

        x: longitudeToMapX(longitude),

        y: latitudeToMapY(latitude),
      },
    ],
  },
});

const buildVolcanoInfographic = (data: unknown): AutoInfographics | null => {
  const name = firstText(data, [["volcano", "name"], ["name"]]) ?? "Volcano";

  const region = firstText(data, [["volcano", "region"], ["region"]]);

  const alertLevel = firstText(data, [
    ["volcano", "status", "alertLevel"],
    ["status", "alertLevel"],
  ]);

  const latitude = firstFinite(data, [
    ["volcano", "coordinates", "latitude"],
    ["coordinates", "latitude"],
  ]);

  const longitude = firstFinite(data, [
    ["volcano", "coordinates", "longitude"],
    ["coordinates", "longitude"],
  ]);

  if (latitude !== undefined && longitude !== undefined) {
    return createCoordinateMap({
      id: `volcano-${name}`,

      label: name,

      latitude,
      longitude,

      title: name,

      subtitle:
        [region, alertLevel ? `Alert: ${alertLevel}` : undefined]
          .filter(Boolean)
          .join(" · ") || undefined,

      mapStyle: "relief",
    });
  }

  if (alertLevel) {
    return {
      statistic: {
        label: "Volcano alert",
        value: alertLevel,
        description: name,
      },
    };
  }

  return null;
};

const buildEarthquakeEventInfographic = (
  data: unknown,
): AutoInfographics | null => {
  const magnitude = firstFinite(data, [["event", "magnitude"], ["magnitude"]]);

  const place =
    firstText(data, [
      ["event", "place"],
      ["event", "location", "name"],
      ["place"],
    ]) ?? "Earthquake";

  const latitude = firstFinite(data, [
    ["event", "coordinates", "latitude"],
    ["event", "location", "latitude"],
    ["coordinates", "latitude"],
  ]);

  const longitude = firstFinite(data, [
    ["event", "coordinates", "longitude"],
    ["event", "location", "longitude"],
    ["coordinates", "longitude"],
  ]);

  if (latitude !== undefined && longitude !== undefined) {
    return createCoordinateMap({
      id: firstText(data, [["event", "id"], ["id"]]) ?? "earthquake",

      label: magnitude !== undefined ? `M${formatNumber(magnitude)}` : place,

      latitude,
      longitude,

      title:
        magnitude !== undefined
          ? `Magnitude ${formatNumber(magnitude)}`
          : "Earthquake",

      subtitle: place,

      mapStyle: "relief",
    });
  }

  if (magnitude !== undefined) {
    return {
      statistic: {
        label: "Magnitude",
        value: formatNumber(magnitude),
        description: place,
      },
    };
  }

  return null;
};

const buildConflictEventInfographic = (
  data: unknown,
): AutoInfographics | null => {
  const event = isRecord(getPath(data, ["event"]))
    ? getPath(data, ["event"])
    : data;

  const conflictName =
    firstText(event, [
      ["conflict", "name"],
      ["dyad", "name"],
    ]) ?? "Conflict event";

  const location = firstText(event, [
    ["location", "name"],
    ["location", "country"],
  ]);

  const latitude = firstFinite(event, [["location", "latitude"]]);

  const longitude = firstFinite(event, [["location", "longitude"]]);

  if (latitude !== undefined && longitude !== undefined) {
    return createCoordinateMap({
      id: String(firstFinite(event, [["id"]]) ?? "conflict"),

      label: location ?? conflictName,

      latitude,
      longitude,

      title: conflictName,

      subtitle: location,

      mapStyle: "political",
    });
  }

  const deaths = firstFinite(event, [["fatalities", "bestEstimate"]]);

  if (deaths !== undefined) {
    return {
      statistic: {
        label: "Estimated fatalities",
        value: formatCompactNumber(deaths),
        description: conflictName,
      },
    };
  }

  return null;
};

const buildCountryInfographic = (data: unknown): AutoInfographics | null => {
  const profile = getPath(data, ["profile"]) ?? data;

  const countryName =
    firstText(profile, [
      ["country", "name"],
      ["country", "countryName"],
    ]) ?? "Country";

  const population = firstFinite(profile, [
    ["indicators", "population", "value"],
    ["indicators", "population", "latest", "value"],
    ["population", "value"],
    ["population"],
  ]);

  if (population !== undefined) {
    return {
      statistic: {
        label: `${countryName} population`,
        value: formatCompactNumber(population),
      },
    };
  }

  const gdp = firstFinite(profile, [
    ["indicators", "gdpUsd", "value"],
    ["indicators", "gdpUsd", "latest", "value"],
    ["gdpUsd", "value"],
    ["gdpUsd"],
  ]);

  if (gdp !== undefined) {
    return {
      statistic: {
        label: `${countryName} GDP`,
        value: formatCompactNumber(gdp),
        prefix: "$",
      },
    };
  }

  return null;
};

const buildExoplanetInfographic = (data: unknown): AutoInfographics | null => {
  const planet =
    getPath(data, ["planet"]) ?? getPath(data, ["exoplanet"]) ?? data;

  const name = firstText(planet, [["name"], ["planetName"]]) ?? "Exoplanet";

  const radius = firstFinite(planet, [["radiusEarth"], ["radiusEarths"]]);

  if (radius !== undefined) {
    return {
      statistic: {
        label: `${name} radius`,
        value: formatNumber(radius),
        suffix: " × Earth",
      },
    };
  }

  const mass = firstFinite(planet, [["massEarth"], ["massEarths"]]);

  if (mass !== undefined) {
    return {
      statistic: {
        label: `${name} mass`,
        value: formatNumber(mass),
        suffix: " × Earth",
      },
    };
  }

  const temperature = firstFinite(planet, [
    ["equilibriumTemperatureK"],
    ["temperatureKelvin"],
  ]);

  if (temperature !== undefined) {
    return {
      statistic: {
        label: `${name} temperature`,

        value: formatNumber(temperature),

        suffix: " K",
      },
    };
  }

  return null;
};

const dateLabel = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 100000000000) {
      return new Date(value).toISOString().slice(0, 10);
    }

    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 10);
  }

  return undefined;
};

const buildConflictTimeline = (data: unknown): AutoInfographics | null => {
  const events = firstArray(data, [["events"], ["results"]]);

  if (!events?.length) {
    return null;
  }

  const timelineEvents = events
    .filter(isRecord)
    .slice(0, 5)
    .map((event) => {
      const when =
        dateLabel(event.year) ?? dateLabel(getPath(event, ["dates", "start"]));

      const conflict = firstText(event, [
        ["conflict", "name"],
        ["dyad", "name"],
      ]);

      const location = firstText(event, [
        ["location", "name"],
        ["location", "country"],
      ]);

      if (!when) {
        return null;
      }

      return {
        year: when,

        title:
          [conflict, location].filter(Boolean).join(" — ") || "Conflict event",
      };
    })
    .filter(
      (
        event,
      ): event is {
        year: string;
        title: string;
      } => event !== null,
    );

  if (timelineEvents.length === 0) {
    return null;
  }

  return {
    timeline: {
      title: "Conflict timeline",

      events: timelineEvents,
    },
  };
};

const buildGenericSearchStatistic = ({
  data,
  label,
}: {
  data: unknown;
  label: string;
}): AutoInfographics | null => {
  const count = firstFinite(data, [
    ["count"],
    ["returned"],
    ["totalMatches"],
    ["total"],
  ]);

  if (count === undefined) {
    return null;
  }

  return {
    statistic: {
      label,
      value: formatCompactNumber(count),
    },
  };
};

const buildFromResolution = (
  resolution: UnknownRecord,
): AutoInfographics | null => {
  if (resolution.ok !== true) {
    return null;
  }

  const kind = typeof resolution.kind === "string" ? resolution.kind : "";

  const data = resolution.data;

  switch (kind) {
    case "volcano":
      return buildVolcanoInfographic(data);

    case "earthquakeEvent":
      return buildEarthquakeEventInfographic(data);

    case "conflictEvent":
      return buildConflictEventInfographic(data);

    case "countryProfile":
      return buildCountryInfographic(data);

    case "exoplanet":
      return buildExoplanetInfographic(data);

    case "conflictSearch":
      return (
        buildConflictTimeline(data) ??
        buildGenericSearchStatistic({
          data,
          label: "Conflict events",
        })
      );

    case "earthquakeSearch":
      return buildGenericSearchStatistic({
        data,
        label: "Earthquakes",
      });

    case "exoplanetSearch":
      return buildGenericSearchStatistic({
        data,
        label: "Exoplanets",
      });

    case "closeApproachSearch":
      return buildGenericSearchStatistic({
        data,
        label: "Close approaches",
      });

    case "naturalEventSearch":
      return buildGenericSearchStatistic({
        data,
        label: "Natural events",
      });

    case "volcanoSearch":
      return buildGenericSearchStatistic({
        data,
        label: "Volcanoes",
      });

    default:
      return null;
  }
};

const enrichSection = (section: unknown): unknown => {
  if (!isRecord(section)) {
    return section;
  }

  /*
   * Never overwrite manually authored infographic content.
   *
   * One visible infographic treatment per section is intentional:
   * InfographicLayer renders several supported cards in the same
   * visual region, so auto-generating multiple types could overlap.
   */
  if (
    isRecord(section.infographics) &&
    Object.keys(section.infographics).length > 0
  ) {
    return section;
  }

  if (!Array.isArray(section.structuredDataResolved)) {
    return section;
  }

  for (const resolution of section.structuredDataResolved) {
    if (!isRecord(resolution)) {
      continue;
    }

    const infographics = buildFromResolution(resolution);

    if (!infographics) {
      continue;
    }

    return {
      ...section,

      infographics,
    };
  }

  return section;
};

const enrichChapter = (chapter: unknown): unknown => {
  if (!isRecord(chapter)) {
    return chapter;
  }

  if (!Array.isArray(chapter.sections)) {
    return chapter;
  }

  return {
    ...chapter,

    sections: chapter.sections.map(enrichSection),
  };
};

/**
 * Converts already resolved structured documentary data into the
 * template's existing infographic contract.
 *
 * No network calls happen here. All provider work must have already
 * completed in structured-data-enrichment.service.ts.
 *
 * Chapter-based payloads are preferred when chapters exist so the
 * final production documentary structure is enriched directly.
 */
export const enrichStructuredDataInfographicsInRenderProps = (
  props: UnknownRecord,
): UnknownRecord => {
  if (Array.isArray(props.chapters) && props.chapters.length > 0) {
    return {
      ...props,

      chapters: props.chapters.map(enrichChapter),
    };
  }

  if (!Array.isArray(props.sections)) {
    return props;
  }

  return {
    ...props,

    sections: props.sections.map(enrichSection),
  };
};
