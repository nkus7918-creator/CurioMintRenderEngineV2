import { Router } from "express";
import { getJob } from "../services/job.service";

const router = Router();

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