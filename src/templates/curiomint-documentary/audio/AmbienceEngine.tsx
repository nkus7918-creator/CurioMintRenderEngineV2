import {
    Audio,
    interpolate,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import {
    ambienceManifest,
    type AmbienceTheme,
  } from "../../../generated/ambienceManifest";
  
  import { pickDeterministicItem } from "./randomSelector";
  
  type AmbienceEngineProps = {
    theme?: AmbienceTheme;
    seed: string;
    volume?: number;
    fadeInDurationInSeconds?: number;
    fadeOutDurationInSeconds?: number;
  };
  
  export const AmbienceEngine = ({
    theme = "nature",
    seed,
    volume = 0.06,
    fadeInDurationInSeconds = 2,
    fadeOutDurationInSeconds = 2,
  }: AmbienceEngineProps) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
  
    const tracks = ambienceManifest[theme];
  
    const selectedTrack = pickDeterministicItem({
      items: [...tracks],
      seed: `${seed}:ambience:${theme}`,
    });
  
    if (!selectedTrack) {
      return null;
    }
  
    const fadeInFrames = Math.max(
      1,
      Math.round(fadeInDurationInSeconds * fps),
    );
  
    const fadeOutFrames = Math.max(
      1,
      Math.round(fadeOutDurationInSeconds * fps),
    );
  
    const fadeOutStartFrame = Math.max(
      fadeInFrames,
      durationInFrames - fadeOutFrames,
    );
  
    const resolvedVolume = interpolate(
      frame,
      [
        0,
        fadeInFrames,
        fadeOutStartFrame,
        durationInFrames,
      ],
      [0, volume, volume, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <Audio
        src={staticFile(selectedTrack)}
        volume={resolvedVolume}
        loop
      />
    );
  };