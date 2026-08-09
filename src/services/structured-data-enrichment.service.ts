import {
    resolveStructuredCountryProfile,
  } from "./structured-data.service";

  import {
    resolveUsgsEarthquakeEvent,
    searchUsgsEarthquakes,
  } from "./usgs-earthquake.service";

  import {
    resolveUcdpConflictEvent,
    searchUcdpConflictEvents,
  } from "./ucdp-ged.service";

  import {
    resolveExoplanet,
    searchCloseApproaches,
    searchExoplanets,
  } from "./space-data.service";

  import {
    resolveVolcano,
    searchNaturalEvents,
    searchVolcanoes,
  } from "./earth-data.service";

  type UnknownRecord = Record<string, unknown>;

  export type StructuredDataRequestKind =
    | "countryProfile"
    | "earthquakeSearch"
    | "earthquakeEvent"
    | "conflictSearch"
    | "conflictEvent"
    | "exoplanetSearch"
    | "exoplanet"
    | "closeApproachSearch"
    | "naturalEventSearch"
    | "volcanoSearch"
    | "volcano";

  export type StructuredDataResolution =
    | {
        kind: StructuredDataRequestKind;
        ok: true;
        data: unknown;
      }
    | {
        kind: string;
        ok: false;
        error: string;
      };

  const isRecord = (
    value: unknown,
  ): value is UnknownRecord =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);

  const optionalText = (
    value: unknown,
  ): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0
      ? trimmed
      : undefined;
  };

  const resolveRequest = async (
    request: UnknownRecord,
  ): Promise<StructuredDataResolution> => {
    const rawKind =
      optionalText(request.kind) ??
      "unknown";

    try {
      switch (rawKind) {
        case "countryProfile": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await resolveStructuredCountryProfile({
                countryCode:
                  request.countryCode,
                year:
                  request.year,
                indicators:
                  request.indicators,
              }),
          };
        }

        case "earthquakeSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchUsgsEarthquakes(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "earthquakeEvent": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await resolveUsgsEarthquakeEvent(
                request.eventId,
              ),
          };
        }

        case "conflictSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchUcdpConflictEvents(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "conflictEvent": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await resolveUcdpConflictEvent(
                request.eventId,
              ),
          };
        }

        case "exoplanetSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchExoplanets(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "exoplanet": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await resolveExoplanet(
                request.planetName,
              ),
          };
        }

        case "closeApproachSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchCloseApproaches(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "naturalEventSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchNaturalEvents(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "volcanoSearch": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await searchVolcanoes(
                isRecord(request.query)
                  ? request.query
                  : request,
              ),
          };
        }

        case "volcano": {
          return {
            kind: rawKind,
            ok: true,
            data:
              await resolveVolcano(
                request.identifier,
              ),
          };
        }

        default: {
          return {
            kind: rawKind,
            ok: false,
            error:
              `Unsupported structured data request kind: ${rawKind}`,
          };
        }
      }
    } catch (error) {
      return {
        kind: rawKind,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  };

  const enrichSection = async (
    section: unknown,
  ): Promise<unknown> => {
    if (!isRecord(section)) {
      return section;
    }

    const rawRequests =
      section.structuredDataRequests;

    if (rawRequests === undefined) {
      return section;
    }

    const requests = Array.isArray(rawRequests)
      ? rawRequests
      : [rawRequests];

    const validRequests =
      requests.filter(isRecord);

    if (validRequests.length === 0) {
      return {
        ...section,

        structuredDataResolved: [],
      };
    }

    const resolved =
      await Promise.all(
        validRequests.map(
          resolveRequest,
        ),
      );

    return {
      ...section,

      structuredDataResolved:
        resolved,
    };
  };

  /**
   * Resolves structured documentary data before Remotion begins rendering.
   *
   * External providers may only be contacted here, during render-job
   * preparation. Remotion itself receives the already resolved payload.
   *
   * The enrichment is intentionally fail-soft per request:
   * one unavailable structured-data source must not destroy an otherwise
   * renderable documentary.
   */
  export const enrichStructuredDataInRenderProps =
    async (
      props: UnknownRecord,
    ): Promise<UnknownRecord> => {
      if (!Array.isArray(props.sections)) {
        return props;
      }

      const sections =
        await Promise.all(
          props.sections.map(
            enrichSection,
          ),
        );

      return {
        ...props,

        sections,
      };
    };
