import type { RenderType } from "./template";

export type JobStatus =
  | "queued"
  | "rendering"
  | "completed"
  | "failed"
  | "interrupted";

export type RenderPreset = "preview" | "final";

export interface RenderJob {
  id: string;

  templateId: string;

  schemaVersion: string;

  compositionId: string;

  renderType: RenderType;

  renderPreset: RenderPreset;

  status: JobStatus;

  progress: number;

  inputHash?: string;

  output?: string;

  outputFileName?: string;

  finalEligible?: boolean;

  width?: number;

  height?: number;

  fps?: number;

  durationInFrames?: number;

  durationInSeconds?: number;

  error?: string;

  createdAt: Date;

  updatedAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  renderTimeMs?: number;
}
