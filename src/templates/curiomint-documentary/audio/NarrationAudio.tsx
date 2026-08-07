import {
    Audio,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import {
    clampAudioVolume,
  } from "./ducking";
  
  import {
    audioMixer,
  } from "./mixer";
  
  type NarrationAudioProps = {
    src: string;
  
    durationInFrames: number;
  
    volume?: number;
  };
  
  export const NarrationAudio = ({
    src,
    durationInFrames,
    volume =
      audioMixer.narration,
  }: NarrationAudioProps) => {
    const frame =
      useCurrentFrame();
  
    const { fps } =
      useVideoConfig();
  
    const safeDuration =
      Math.max(
        1,
        durationInFrames,
      );
  
    const fadeInFrames =
      Math.max(
        1,
        Math.round(
          audioMixer
            .narrationFadeInSeconds *
            fps,
        ),
      );
  
    const fadeOutFrames =
      Math.max(
        1,
        Math.round(
          audioMixer
            .narrationFadeOutSeconds *
            fps,
        ),
      );
  
    const fadeInMultiplier =
      clampAudioVolume(
        frame /
          fadeInFrames,
      );
  
    const remainingFrames =
      safeDuration -
      frame;
  
    const fadeOutMultiplier =
      clampAudioVolume(
        remainingFrames /
          fadeOutFrames,
      );
  
    const fadeMultiplier =
      Math.min(
        fadeInMultiplier,
        fadeOutMultiplier,
      );
  
    const resolvedVolume =
      clampAudioVolume(
        volume,
      ) *
      fadeMultiplier;
  
    return (
      <Audio
        src={src}
        volume={
          resolvedVolume
        }
      />
    );
  };