export type JobStatus =
  | "queued"
  | "rendering"
  | "completed"
  | "failed"
  | "interrupted";

export type RenderPreset =
  | "preview"
  | "final";

export interface RenderJob {
  id: string;

  templateId: string;

  renderPreset: RenderPreset;

  status: JobStatus;

  progress: number;

  output?: string;

  error?: string;

  createdAt: Date;

  updatedAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  renderTimeMs?: number;
}