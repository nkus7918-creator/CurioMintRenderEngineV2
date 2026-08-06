import type {
  Request,
  Response,
} from "express";

import {
  RenderQueueFullError,
} from "../jobs/queue";

import {
  createRenderJob,
} from "../services/render.service";

import {
  validateTemplateRenderRequest,
} from "../validation/validateTemplateRenderRequest";

export async function renderController(
  req: Request,
  res: Response,
) {
  const validation =
    validateTemplateRenderRequest(
      req.body,
    );

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message:
        validation.message,
    });
  }

  try {
    const job =
      await createRenderJob(
        validation.request,
      );

    return res.status(202).json(
      job,
    );
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
