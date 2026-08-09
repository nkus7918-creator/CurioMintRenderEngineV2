import {
  Router,
} from "express";

import {
  getCliopatriaStatus,
  resolveCliopatriaMap,
} from "../services/cliopatria.service";

const router =
  Router();

router.get(
  "/status",
  (_req, res) => {
    return res.json(
      getCliopatriaStatus(),
    );
  },
);

router.post(
  "/resolve",
  (req, res) => {
    const entity =
      String(
        req.body?.entity ??
          "",
      ).trim();

    const year =
      Number(
        req.body?.year,
      );

    if (!entity) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "entity is required",
        });
    }

    if (
      !Number.isInteger(
        year,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "year must be an integer",
        });
    }

    try {
      const result =
        resolveCliopatriaMap(
          entity,
          year,
        );

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          entity,
          year,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
    }
  },
);

export default router;