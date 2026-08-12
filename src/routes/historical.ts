import { Router } from "express";

import {
  getCliopatriaStatus,
  resolveCliopatriaMap,
} from "../services/cliopatria.service";

import {
  detectHistoricalMaps,
  getHistoricalMapDetectorStatus,
  type HistoricalMapDetectorSection,
} from "../services/historical-map-detector.service";

const router = Router();

router.get("/status", (_req, res) => {
  return res.json({
    cliopatria: getCliopatriaStatus(),

    detector: getHistoricalMapDetectorStatus(),
  });
});

router.post("/resolve", (req, res) => {
  const entity = String(req.body?.entity ?? "").trim();

  const year = Number(req.body?.year);

  if (!entity) {
    return res.status(400).json({
      success: false,

      message: "entity is required",
    });
  }

  if (!Number.isInteger(year)) {
    return res.status(400).json({
      success: false,

      message: "year must be an integer",
    });
  }

  try {
    const result = resolveCliopatriaMap(entity, year);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,

      entity,
      year,

      message: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/detect", (req, res) => {
  const rawSections = req.body?.sections;

  if (!Array.isArray(rawSections)) {
    return res.status(400).json({
      success: false,

      message: "sections must be an array",
    });
  }

  const sections: HistoricalMapDetectorSection[] = rawSections.map(
    (rawSection, index) => {
      const section =
        rawSection &&
        typeof rawSection === "object" &&
        !Array.isArray(rawSection)
          ? (rawSection as Record<string, unknown>)
          : {};

      return {
        id: String(section.id ?? `section-${index}`).trim(),

        title: typeof section.title === "string" ? section.title : null,

        subject: typeof section.subject === "string" ? section.subject : null,

        narrationText:
          typeof section.narrationText === "string"
            ? section.narrationText
            : typeof section.narration === "string"
              ? section.narration
              : null,
      };
    },
  );

  try {
    const decisions = detectHistoricalMaps(sections);

    return res.json({
      success: true,

      decisions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
