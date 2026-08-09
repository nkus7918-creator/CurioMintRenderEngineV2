import {
  Router,
} from "express";

import {
  getUcdpConflictStatus,
  resolveUcdpConflictEvent,
  searchUcdpConflictEvents,
} from "../services/ucdp-ged.service";

const router =
  Router();

router.get(
  "/status",
  async (_req, res) => {
    try {
      const status =
        await getUcdpConflictStatus();

      return res
        .status(
          status.available
            ? 200
            : 503,
        )
        .json(
          status,
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
    try {
      return res.json(
        await searchUcdpConflictEvents(
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
          "startDate",
        ) ||
        message.includes(
          "endDate",
        ) ||
        message.includes(
          "countryId",
        ) ||
        message.includes(
          "conflictId",
        ) ||
        message.includes(
          "actorId",
        ) ||
        message.includes(
          "minBestDeaths",
        ) ||
        message.includes(
          "typeOfViolence",
        ) ||
        message.includes(
          "orderBy",
        ) ||
        message.includes(
          "limit must",
        );

      return res
        .status(
          clientError
            ? 400
            : 503,
        )
        .json({
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
      return res.json(
        await resolveUcdpConflictEvent(
          req.params.eventId,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "positive integer",
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
              : 503,
        )
        .json({
          success: false,
          message,
        });
    }
  },
);

export default router;