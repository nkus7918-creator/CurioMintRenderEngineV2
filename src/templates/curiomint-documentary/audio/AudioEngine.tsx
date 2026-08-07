import {
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type {
  AmbienceTheme,
} from "../../../generated/ambienceManifest";

import type {
  MusicTheme,
} from "../../../generated/musicManifest";

import {
  AmbienceEngine,
} from "./AmbienceEngine";

import {
  MusicEngine,
} from "./MusicEngine";

import {
  SfxEngine,
} from "./SfxEngine";

import {
  getNarrationDuckingMultiplier,
} from "./ducking";

import type {
  AudioFrameInterval,
} from "./ducking";

import {
  audioMixer,
} from "./mixer";

type AudioEngineProps = {
  musicTheme?: MusicTheme;

  ambienceTheme?: AmbienceTheme;

  seed: string;

  musicVolume?: number;

  narrationIntervals?:
    AudioFrameInterval[];

  chapterStartFrames?: number[];

  sectionStartFrames?: number[];

  enabled?: boolean;
};

export const AudioEngine = ({
  musicTheme = "history",
  ambienceTheme = "ancient",
  seed,
  musicVolume =
    audioMixer.music,
  narrationIntervals = [],
  chapterStartFrames = [],
  sectionStartFrames = [],
  enabled = true,
}: AudioEngineProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  if (!enabled) {
    return null;
  }

  const musicGainMultiplier =
    getNarrationDuckingMultiplier({
      frame,

      fps,

      intervals:
        narrationIntervals,

      duckedLevel:
        audioMixer
          .ducking
          .musicUnderNarration,

      attackInSeconds:
        audioMixer
          .ducking
          .attackInSeconds,

      releaseInSeconds:
        audioMixer
          .ducking
          .releaseInSeconds,
    });

  const ambienceGainMultiplier =
    getNarrationDuckingMultiplier({
      frame,

      fps,

      intervals:
        narrationIntervals,

      duckedLevel:
        audioMixer
          .ducking
          .ambienceUnderNarration,

      attackInSeconds:
        audioMixer
          .ducking
          .attackInSeconds,

      releaseInSeconds:
        audioMixer
          .ducking
          .releaseInSeconds,
    });

  return (
    <>
      <MusicEngine
        theme={musicTheme}
        seed={seed}
        volume={
          musicVolume
        }
        gainMultiplier={
          musicGainMultiplier
        }
      />

      <AmbienceEngine
        theme={
          ambienceTheme
        }
        seed={seed}
        gainMultiplier={
          ambienceGainMultiplier
        }
      />

      <SfxEngine
        category="transition"
        seed={`${seed}:intro`}
        fromFrame={0}
        volume={
          audioMixer.sfx.intro
        }
        durationInFrames={45}
      />

      {chapterStartFrames.map(
        (
          fromFrame,
          index,
        ) => (
          <SfxEngine
            key={
              `${fromFrame}-${index}`
            }
            category="impact"
            seed={
              `${seed}:chapter:${index}`
            }
            fromFrame={
              fromFrame
            }
            volume={
              audioMixer.sfx
                .chapter
            }
            durationInFrames={
              30
            }
          />
        ),
      )}

      {sectionStartFrames.map(
        (
          fromFrame,
          index,
        ) => (
          <SfxEngine
            key={
              `section-${fromFrame}-${index}`
            }
            category="transition"
            seed={
              `${seed}:section:${index}`
            }
            fromFrame={
              fromFrame
            }
            volume={
              audioMixer.sfx
                .section
            }
            durationInFrames={
              24
            }
          />
        ),
      )}
    </>
  );
};