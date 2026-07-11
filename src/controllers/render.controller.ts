import { Request, Response } from "express";
import { createRenderJob } from "../services/render.service";
import { RenderRequest } from "../types/render";

export async function renderController(req: Request, res: Response) {
  const body = req.body as RenderRequest;

  if (!body.templateId) {
    return res.status(400).json({
      success: false,
      message: "templateId is required",
    }); 
  }

  if (!body.props) {
    return res.status(400).json({
      success: false,
      message: "props is required",
    });
  }

  try {
    const job = await createRenderJob(body);
    return res.json(job);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}