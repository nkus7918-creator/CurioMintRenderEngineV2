import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  musicManifest,
  type MusicTheme,
} from "../../../generated/musicManifest";

import { pickDeterministicItem } from "./randomSelector";

import { audioMixer } from "./mixer";

import { clampAudioVolume } from "./ducking";

type MusicEngineProps = {
  theme?: MusicTheme;
  seed: string;

  volume?: number;

  gainMultiplier?: number;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;

  startFromSeconds?: number;
};

export const MusicEngine = ({
  theme = "history",
  seed,
  volume = audioMixer.music,
  gainMultiplier = 1,
  fadeInDurationInSeconds = 1.5,
  fadeOutDurationInSeconds = 2,
  startFromSeconds = 0,
}: MusicEngineProps) => {
  const frame = useCurrentFrame();

  const { fps, durationInFrames } = useVideoConfig();

  const tracks = musicManifest[theme];

  const selectedTrack = pickDeterministicItem({
    items: [...tracks],
    seed: `${seed}:${theme}`,
  });

  if (!selectedTrack) {
    return null;
  }

  const fadeInFrames = Math.max(1, Math.round(fadeInDurationInSeconds * fps));

  const fadeOutFrames = Math.max(1, Math.round(fadeOutDurationInSeconds * fps));

  const fadeOutStartFrame = Math.max(
    fadeInFrames,
    durationInFrames - fadeOutFrames,
  );

  const baseVolume = interpolate(
    frame,
    [0, fadeInFrames, fadeOutStartFrame, durationInFrames],
    [0, volume, volume, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const resolvedVolume = clampAudioVolume(
    baseVolume * clampAudioVolume(gainMultiplier),
  );

  return (
    <Audio
      src={staticFile(selectedTrack)}
      volume={resolvedVolume}
      startFrom={Math.max(0, Math.round(startFromSeconds * fps))}
      loop
    />
  );
};
