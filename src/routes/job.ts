import { Router } from "express";
import path from "path";
import { getJob } from "../services/job.service";

const router = Router();

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

  return res.download(path.resolve(job.output));
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