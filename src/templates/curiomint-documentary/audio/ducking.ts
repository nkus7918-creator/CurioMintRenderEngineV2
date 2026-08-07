export type AudioFrameInterval = {
    startFrame: number;
  
    endFrame: number;
  };
  
  type DuckingMultiplierInput = {
    frame: number;
  
    fps: number;
  
    intervals: AudioFrameInterval[];
  
    duckedLevel: number;
  
    attackInSeconds: number;
  
    releaseInSeconds: number;
  };
  
  export const clampAudioVolume = (
    value: number,
  ): number => {
    if (!Number.isFinite(value)) {
      return 0;
    }
  
    return Math.min(
      1,
      Math.max(0, value),
    );
  };
  
  const linearProgress = (
    value: number,
    start: number,
    end: number,
  ): number => {
    if (end <= start) {
      return value >= end
        ? 1
        : 0;
    }
  
    return clampAudioVolume(
      (value - start) /
        (end - start),
    );
  };
  
  export const getNarrationDuckingMultiplier =
    ({
      frame,
      fps,
      intervals,
      duckedLevel,
      attackInSeconds,
      releaseInSeconds,
    }: DuckingMultiplierInput): number => {
      const resolvedDuckedLevel =
        clampAudioVolume(
          duckedLevel,
        );
  
      if (
        intervals.length === 0
      ) {
        return 1;
      }
  
      const attackFrames =
        Math.max(
          0,
          Math.round(
            attackInSeconds *
              fps,
          ),
        );
  
      const releaseFrames =
        Math.max(
          0,
          Math.round(
            releaseInSeconds *
              fps,
          ),
        );
  
      let multiplier = 1;
  
      for (
        const interval of
        intervals
      ) {
        const startFrame =
          Math.max(
            0,
            interval.startFrame,
          );
  
        const endFrame =
          Math.max(
            startFrame,
            interval.endFrame,
          );
  
        let intervalMultiplier =
          1;
  
        if (
          frame >= startFrame &&
          frame < endFrame
        ) {
          intervalMultiplier =
            resolvedDuckedLevel;
        } else if (
          attackFrames > 0 &&
          frame >=
            startFrame -
              attackFrames &&
          frame < startFrame
        ) {
          const progress =
            linearProgress(
              frame,
              startFrame -
                attackFrames,
              startFrame,
            );
  
          intervalMultiplier =
            1 -
            progress *
              (
                1 -
                resolvedDuckedLevel
              );
        } else if (
          releaseFrames > 0 &&
          frame >= endFrame &&
          frame <
            endFrame +
              releaseFrames
        ) {
          const progress =
            linearProgress(
              frame,
              endFrame,
              endFrame +
                releaseFrames,
            );
  
          intervalMultiplier =
            resolvedDuckedLevel +
            progress *
              (
                1 -
                resolvedDuckedLevel
              );
        }
  
        multiplier =
          Math.min(
            multiplier,
            intervalMultiplier,
          );
      }
  
      return clampAudioVolume(
        multiplier,
      );
    };