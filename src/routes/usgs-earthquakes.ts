import {
  Router,
} from "express";

import {
  getUsgsEarthquakeStatus,
  resolveUsgsEarthquakeEvent,
  searchUsgsEarthquakes,
} from "../services/usgs-earthquake.service";

const router = Router();

router.get(
  "/status",
  async (_req, res) => {
    try {
      return res.json(
        await getUsgsEarthquakeStatus(),
      );
    } catch (error) {
      return res.status(500).json({
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
    try {
      const result = await searchUsgsEarthquakes(
        req.body ?? {},
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes("startTime") ||
        message.includes("endTime") ||
        message.includes("Magnitude") ||
        message.includes("Depth") ||
        message.includes("latitude") ||
        message.includes("longitude") ||
        message.includes("maxRadiusKm") ||
        message.includes("minSignificance") ||
        message.includes("orderBy") ||
        message.includes("limit must");

      return res.status(clientError ? 400 : 502).json({
        success: false,
        message,
      });
    }
  },
);

router.get(
  "/event/:eventId",
  async (req, res) => {
    try {
      const result = await resolveUsgsEarthquakeEvent(
        req.params.eventId,
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError = message.includes(
        "eventId is invalid",
      );

      const notFound = message.includes(
        "was not found",
      );

      return res
        .status(clientError ? 400 : notFound ? 404 : 502)
        .json({
          success: false,
          message,
        });
    }
  },
);

export default router;