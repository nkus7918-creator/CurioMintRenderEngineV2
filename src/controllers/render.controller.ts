import type {
  Request,
  Response,
} from "express";

import { RenderQueueFullError } from "../jobs/queue";

import { createRenderJob } from "../services/render.service";

import type { RenderRequest } from "../types/render";

import { validateDocumentaryAssets } from "../validation/validateDocumentaryAssets";
import { validateRenderRequest } from "../validation/validateRenderRequest";

export async function renderController(
  req: Request,
  res: Response,
) {
  const body = req.body as RenderRequest;

  const validation =
    validateRenderRequest(body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  if (
    body.templateId ===
    "curiomint-documentary"
  ) {
    const assetValidation =
      validateDocumentaryAssets(
        body.props,
      );

    if (!assetValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          assetValidation.message,
      });
    }
  }

  try {
    const job =
      await createRenderJob(body);

    return res.status(202).json(job);
  } catch (error) {
    if (
      error instanceof
      RenderQueueFullError
    ) {
      res.setHeader(
        "Retry-After",
        "30",
      );

      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Render job creation failed:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown render error",
    });
  }
}