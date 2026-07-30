export type CameraMotionPreset =
    | "none"
    | "slowPush"
    | "slowPull"
    | "driftLeft"
    | "driftRight"
    | "driftUp"
    | "driftDown"
    | "kenBurnsIn"
    | "kenBurnsOut"
    | "kenBurnsLeft"
    | "kenBurnsRight"
    | "kenBurns"
    ;

export type MotionOverlapConfig = {
    positionDelay?: number;
    rotationDelay?: number;
};

export type CameraMotionConfig = {
    preset: CameraMotionPreset;
    intensity?: number;
    seed?: string;
    overlap?: MotionOverlapConfig;
};


export type CameraMotionValues = {
    startScale: number;
    endScale: number;
    startX: number;
    endX: number;
    startY: number;
    endY: number;
    startRotation: number;
    endRotation: number;
};