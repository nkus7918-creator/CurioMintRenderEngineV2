import {
  Router,
} from "express";

import {
  getStructuredDataStatus,
  resolveStructuredCountryProfile,
} from "../services/structured-data.service";

const router =
  Router();

router.get(
  "/status",
  async (_req, res) => {
    try {
      return res.json(
        await getStructuredDataStatus(),
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
  "/country-profile",
  async (req, res) => {
    try {
      const profile =
        await resolveStructuredCountryProfile({
          countryCode:
            req.body
              ?.countryCode,

          year:
            req.body?.year,

          indicators:
            req.body
              ?.indicators,
        });

      return res.json({
        success: true,
        ...profile,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const clientError =
        message.includes(
          "countryCode",
        ) ||
        message.includes(
          "year must",
        ) ||
        message.includes(
          "indicators must",
        ) ||
        message.includes(
          "Unsupported indicator",
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