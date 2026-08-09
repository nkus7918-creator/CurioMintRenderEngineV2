import {
  Router,
} from "express";

import {
  getSpaceDataStatus,
  resolveExoplanet,
  searchCloseApproaches,
  searchExoplanets,
} from "../services/space-data.service";

const router =
  Router();

router.get(
  "/status",
  async (_req, res) => {
    try {
      return res.json(
        await getSpaceDataStatus(),
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
  "/exoplanets/search",
  async (req, res) => {
    try {
      return res.json(
        await searchExoplanets(
          req.body ?? {},
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "must be",
        ) ||
        message.includes(
          "orderBy",
        );

      return res
        .status(
          clientError
            ? 400
            : 502,
        )
        .json({
          success: false,
          message,
        });
    }
  },
);

router.post(
  "/exoplanets/resolve",
  async (req, res) => {
    try {
      return res.json(
        await resolveExoplanet(
          req.body?.planetName,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "planetName is required",
        );

      const notFound =
        message.includes(
          "was not found",
        );

      return res
        .status(
          clientError
            ? 400
            : notFound
              ? 404
              : 502,
        )
        .json({
          success: false,
          message,
        });
    }
  },
);

router.post(
  "/close-approaches/search",
  async (req, res) => {
    try {
      return res.json(
        await searchCloseApproaches(
          req.body ?? {},
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "dateMin",
        ) ||
        message.includes(
          "dateMax",
        ) ||
        message.includes(
          "maxDistance",
        ) ||
        message.includes(
          "boolean filter",
        ) ||
        message.includes(
          "sort is invalid",
        ) ||
        message.includes(
          "limit must",
        );

      return res
        .status(
          clientError
            ? 400
            : 502,
        )
        .json({
          success: false,
          message,
        });
    }
  },
);

export default router;