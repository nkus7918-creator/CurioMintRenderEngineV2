import {
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { MusicTheme } from "../../../generated/musicManifest";
import type { AudioFrameInterval } from "../../curiomint-documentary/audio/ducking";
import { getNarrationDuckingMultiplier } from "../../curiomint-documentary/audio/ducking";
import { MusicEngine } from "../../curiomint-documentary/audio/MusicEngine";
import { SfxEngine } from "../../curiomint-documentary/audio/SfxEngine";

type ShortAudioEngineProps = {
  seed: string;
  musicTheme?: MusicTheme;
  musicVolume?: number;
  narrationIntervals?: AudioFrameInterval[];
  transitionFrames?: number[];
  twistFrames?: number[];
  hookHighlightFrame?: number;
  sfxEnabled?: boolean;
  sfxVolume?: number;
};

export const ShortAudioEngine = ({
  seed,
  musicTheme = "mystery",
  musicVolume = 0.1,
  narrationIntervals = [],
  transitionFrames = [],
  twistFrames = [],
  hookHighlightFrame,
  sfxEnabled = true,
  sfxVolume = 0.35,
}: ShortAudioEngineProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const musicGainMultiplier = getNarrationDuckingMultiplier({
    frame,
    fps,
    intervals: narrationIntervals,
    duckedLevel: 0.34,
    attackInSeconds: 0.12,
    releaseInSeconds: 0.32,
  });
  const sfxGain = Math.max(0, Math.min(1, sfxVolume));
  const sparseTransitionFrames = transitionFrames.filter(
    (transitionFrame, index) =>
      index % 2 === 1 &&
      !twistFrames.some(
        (twistFrame) => Math.abs(twistFrame - transitionFrame) < Math.round(fps * 0.3),
      ),
  );

  return (
    <>
      {musicVolume > 0 ? (
        <MusicEngine
          theme={musicTheme}
          seed={`${seed}:shorts`}
          volume={Math.min(0.16, Math.max(0, musicVolume))}
          gainMultiplier={musicGainMultiplier}
          fadeInDurationInSeconds={0.3}
          fadeOutDurationInSeconds={0.7}
        />
      ) : null}

      {sfxEnabled ? (
        <>
          {typeof hookHighlightFrame !== "number" ? (
            <SfxEngine
              category="transition"
              seed={`${seed}:opening`}
              fromFrame={0}
              volume={0.1 * sfxGain}
              durationInFrames={Math.round(fps * 0.55)}
            />
          ) : null}

          {typeof hookHighlightFrame === "number" ? (
            <SfxEngine
              category="impact"
              seed={`${seed}:hook-highlight`}
              fromFrame={hookHighlightFrame}
              volume={0.11 * sfxGain}
              durationInFrames={Math.round(fps * 0.5)}
            />
          ) : null}

          {sparseTransitionFrames.map((fromFrame, index) => (
            <SfxEngine
              key={`transition-${fromFrame}-${index}`}
              category="transition"
              seed={`${seed}:transition:${index}`}
              fromFrame={fromFrame}
              volume={0.07 * sfxGain}
              durationInFrames={Math.round(fps * 0.4)}
            />
          ))}

          {twistFrames.map((fromFrame, index) => (
            <SfxEngine
              key={`twist-${fromFrame}-${index}`}
              category="impact"
              seed={`${seed}:twist:${index}`}
              fromFrame={fromFrame}
              volume={0.12 * sfxGain}
              durationInFrames={Math.round(fps * 0.55)}
            />
          ))}
        </>
      ) : null}
    </>
  );
};
