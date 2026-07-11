export type JobStatus = "queued" | "rendering" | "completed" | "failed";

export interface RenderJob {
  id: string;
  status: JobStatus;
  progress: number;
  output?: string;
  error?: string;
  createdAt: Date;
}