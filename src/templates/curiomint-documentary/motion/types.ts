export type CameraMotionPreset =
  | "none"
  | "slowPush"
  | "slowPull"
  | "driftLeft"
  | "driftRight"
  | "driftUp"
  | "driftDown";

export type CameraMotionConfig = {
  preset?: CameraMotionPreset;
  intensity?: number;
};