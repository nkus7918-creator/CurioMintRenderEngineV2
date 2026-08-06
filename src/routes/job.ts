import fs from "fs";
import path from "path";

import { Router } from "express";

import { getJob } from "../services/job.service";

const router = Router();

const getFinalEligibilityError = (
  job: NonNullable<ReturnType<typeof getJob>>,
): string | null => {
  if (job.status !== "completed") {
    return "Render is not completed.";
  }

  if (!job.output) {
    return "Completed job has no output file.";
  }

  if (job.renderType !== "video") {
    return "Only video artifacts can be uploaded to YouTube.";
  }

  if (job.renderPreset !== "final") {
    return "Preview artifacts cannot be uploaded to YouTube.";
  }

  if (job.finalEligible !== true) {
    return "Artifact did not pass final upload eligibility checks.";
  }

  return null;
};

router.get("/:jobId/final-artifact", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      eligible: false,
      message: "Job not found",
    });
  }

  const eligibilityError = getFinalEligibilityError(job);

  if (eligibilityError) {
    return res.status(409).json({
      success: false,
      eligible: false,
      jobId: job.id,
      status: job.status,
      renderPreset: job.renderPreset,
      finalEligible: job.finalEligible ?? false,
      width: job.width,
      height: job.height,
      message: eligibilityError,
    });
  }

  return res.json({
    success: true,
    eligible: true,
    jobId: job.id,

    artifact: {
      outputFileName: job.outputFileName,

      renderPreset: job.renderPreset,

      finalEligible: job.finalEligible,

      templateId: job.templateId,

      compositionId: job.compositionId,

      width: job.width,

      height: job.height,

      fps: job.fps,

      durationInFrames: job.durationInFrames,

      durationInSeconds: job.durationInSeconds,

      inputHash: job.inputHash,
    },

    finalDownloadPath: `/jobs/${job.id}/final-download`,
  });
});

router.get("/:jobId/final-download", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const eligibilityError = getFinalEligibilityError(job);

  if (eligibilityError) {
    return res.status(409).json({
      success: false,
      eligible: false,
      renderPreset: job.renderPreset,
      finalEligible: job.finalEligible ?? false,
      message: eligibilityError,
    });
  }

  const resolvedOutput = path.resolve(job.output!);

  if (!fs.existsSync(resolvedOutput)) {
    return res.status(410).json({
      success: false,
      message: "Artifact metadata exists, but the output file is missing.",
    });
  }

  return res.download(
    resolvedOutput,
    job.outputFileName ?? path.basename(resolvedOutput),
  );
});

router.get("/:jobId/download", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  if (job.status !== "completed" || !job.output) {
    return res.status(400).json({
      success: false,
      message: "Render not completed yet",
    });
  }

  const resolvedOutput = path.resolve(job.output);

  if (!fs.existsSync(resolvedOutput)) {
    return res.status(410).json({
      success: false,
      message: "Output file is missing",
    });
  }

  /*
   * Genel download endpoint'i preview
   * incelemesi için kullanılabilir.
   *
   * YouTube zinciri yalnızca
   * final-download kullanmalıdır.
   */
  return res.download(
    resolvedOutput,
    job.outputFileName ?? path.basename(resolvedOutput),
  );
});

router.get("/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  return res.json(job);
});

export default router;
