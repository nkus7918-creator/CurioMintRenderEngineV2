import {
  Router,
} from "express";

import {
  getEarthDataStatus,
  resolveVolcano,
  searchNaturalEvents,
  searchVolcanoes,
} from "../services/earth-data.service";

const router =
  Router();

router.get(
  "/status",
  async (_req, res) => {
    try {
      return res.json(
        await getEarthDataStatus(),
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
  "/events/search",
  async (req, res) => {
    try {
      return res.json(
        await searchNaturalEvents(
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
          "must use YYYY-MM-DD",
        ) ||
        message.includes(
          "is invalid",
        ) ||
        message.includes(
          "start must",
        ) ||
        message.includes(
          "use either days",
        ) ||
        message.includes(
          "status must",
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

router.post(
  "/volcanoes/search",
  async (req, res) => {
    try {
      return res.json(
        await searchVolcanoes(
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

router.get(
  "/volcanoes/:identifier",
  async (req, res) => {
    try {
      return res.json(
        await resolveVolcano(
          req.params.identifier,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "identifier is required",
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

export default router;