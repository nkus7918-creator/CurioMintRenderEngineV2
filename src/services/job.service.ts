import { RenderJob } from "../types/job";

const jobs = new Map<string, RenderJob>();

export function createJob(job: RenderJob) {
  jobs.set(job.id, job);
}

export function getJob(jobId: string) {
  return jobs.get(jobId);
}

export function updateJob(
  jobId: string,
  updates: Partial<RenderJob>
) {
  const job = jobs.get(jobId);

  if (!job) {
    return;
  }

  jobs.set(jobId, {
    ...job,
    ...updates,
  });
}