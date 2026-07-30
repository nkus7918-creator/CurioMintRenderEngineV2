import {
    Easing,
    interpolate,
  } from "remotion";
  
  import { resolveCameraMotion } from "./resolveCameraMotion";
  import type { CameraMotionConfig } from "./types";
  
  type GetMotionValuesProps = {
    frame: number;
    durationInFrames: number;
    motion?: CameraMotionConfig;
    seed?: string;
  };
  
  export type MotionValues = {
    scale: number;
    translateX: number;
    translateY: number;
    rotation: number;
  };
  
  const CAMERA_EASING = Easing.bezier(
    0.42,
    0,
    0.58,
    1,
  );
  
  const clampDelay = (delay?: number) => {
    if (typeof delay !== "number") {
      return 0;
    }
  
    return Math.min(
      Math.max(delay, 0),
      0.9,
    );
  };
  
  const interpolateMotionValue = ({
    frame,
    startFrame,
    endFrame,
    from,
    to,
  }: {
    frame: number;
    startFrame: number;
    endFrame: number;
    from: number;
    to: number;
  }) => {
    const safeEndFrame = Math.max(
      startFrame + 1,
      endFrame,
    );
  
    return interpolate(
      frame,
      [startFrame, safeEndFrame],
      [from, to],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: CAMERA_EASING,
      },
    );
  };
  
  export const getMotionValues = ({
    frame,
    durationInFrames,
    motion,
    seed,
  }: GetMotionValuesProps): MotionValues => {
    const safeDuration = Math.max(
      1,
      durationInFrames,
    );
  
    const endFrame = Math.max(
      1,
      safeDuration - 1,
    );
  
    const camera = resolveCameraMotion(
      motion,
      motion?.seed ?? seed,
    );
  
    const positionDelay = clampDelay(
      motion?.overlap?.positionDelay,
    );
  
    const rotationDelay = clampDelay(
      motion?.overlap?.rotationDelay,
    );
  
    const positionStartFrame = Math.round(
      endFrame * positionDelay,
    );
  
    const rotationStartFrame = Math.round(
      endFrame * rotationDelay,
    );
  
    return {
      scale: interpolateMotionValue({
        frame,
        startFrame: 0,
        endFrame,
        from: camera.startScale,
        to: camera.endScale,
      }),
  
      translateX: interpolateMotionValue({
        frame,
        startFrame: positionStartFrame,
        endFrame,
        from: camera.startX,
        to: camera.endX,
      }),
  
      translateY: interpolateMotionValue({
        frame,
        startFrame: positionStartFrame,
        endFrame,
        from: camera.startY,
        to: camera.endY,
      }),
  
      rotation: interpolateMotionValue({
        frame,
        startFrame: rotationStartFrame,
        endFrame,
        from: camera.startRotation,
        to: camera.endRotation,
      }),
    };
  };