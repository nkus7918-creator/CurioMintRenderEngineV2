import {
  Router,
} from "express";

import {
  getWikimediaResolverStatus,
  resolveWikimediaVisual,
  searchWikimediaVisuals,
  type WikimediaOrientation,
  type WikimediaVisualKind,
} from "../services/wikimedia.service";

const router =
  Router();

const VALID_KINDS =
  new Set<WikimediaVisualKind>([
    "person",
    "artifact",
    "building",
    "place",
    "event",
    "general",
  ]);

const VALID_ORIENTATIONS =
  new Set<WikimediaOrientation>([
    "landscape",
    "portrait",
    "square",
    "any",
  ]);

const parseKind = (
  value: unknown,
): WikimediaVisualKind => {
  const kind =
    String(
      value ??
        "general",
    ) as WikimediaVisualKind;

  return VALID_KINDS.has(
    kind,
  )
    ? kind
    : "general";
};

const parseOrientation = (
  value: unknown,
): WikimediaOrientation => {
  const orientation =
    String(
      value ??
        "landscape",
    ) as WikimediaOrientation;

  return VALID_ORIENTATIONS.has(
    orientation,
  )
    ? orientation
    : "landscape";
};

router.get(
  "/status",
  async (_req, res) => {
    try {
      return res.json(
        await getWikimediaResolverStatus(),
      );
    } catch (error) {
      return res
        .status(500)
        .json({
          available: false,

          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
    }
  },
);

router.post(
  "/search",
  async (req, res) => {
    const query =
      String(
        req.body?.query ??
          "",
      ).trim();

    if (!query) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "query is required",
        });
    }

    const preferredOrientation =
      parseOrientation(
        req.body
          ?.preferredOrientation,
      );

    const rawLimit =
      Number(
        req.body?.limit ??
          8,
      );

    const limit =
      Number.isFinite(
        rawLimit,
      )
        ? Math.max(
            1,
            Math.min(
              10,
              Math.round(
                rawLimit,
              ),
            ),
          )
        : 8;

    try {
      const candidates =
        await searchWikimediaVisuals({
          query,
          preferredOrientation,
          limit,
        });

      return res.json({
        success: true,
        query,
        preferredOrientation,
        candidateCount:
          candidates.length,
        acceptedCount:
          candidates.filter(
            (candidate) =>
              candidate.accepted,
          ).length,
        candidates,
      });
    } catch (error) {
      return res
        .status(502)
        .json({
          success: false,
          query,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
    }
  },
);

router.post(
  "/resolve",
  async (req, res) => {
    const query =
      String(
        req.body?.query ??
          "",
      ).trim();

    if (!query) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "query is required",
        });
    }

    const kind =
      parseKind(
        req.body?.kind,
      );

    const preferredOrientation =
      parseOrientation(
        req.body
          ?.preferredOrientation,
      );

    try {
      const result =
        await resolveWikimediaVisual({
          query,
          kind,
          preferredOrientation,
        });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          query,
          kind,
          preferredOrientation,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
    }
  },
);

export default router;