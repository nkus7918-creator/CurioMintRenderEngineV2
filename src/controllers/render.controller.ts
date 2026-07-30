import { Request, Response } from "express";

import { validateDocumentaryAssets } from "../validation/validateDocumentaryAssets";

import { createRenderJob } from "../services/render.service";
import type { RenderRequest } from "../types/render";
import { validateRenderRequest } from "../validation/validateRenderRequest";

export async function renderController(
  req: Request,
  res: Response,
) {
  const body = req.body as RenderRequest;

  const validation = validateRenderRequest(body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const assetValidation = validateDocumentaryAssets(body.props);

  if (!assetValidation.valid) {
    return res.status(400).json({
      success: false,
      message: assetValidation.message,
    });
  }

  try {
    const job = await createRenderJob(body);

    return res.json(job);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}