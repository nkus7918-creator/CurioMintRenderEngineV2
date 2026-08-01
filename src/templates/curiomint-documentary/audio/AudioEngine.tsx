import type { AmbienceTheme } from "../../../generated/ambienceManifest";
import type { MusicTheme } from "../../../generated/musicManifest";

import { AmbienceEngine } from "./AmbienceEngine";
import { MusicEngine } from "./MusicEngine";
import { SfxEngine } from "./SfxEngine";

type AudioEngineProps = {
  musicTheme?: MusicTheme;
  ambienceTheme?: AmbienceTheme;
  seed: string;
  chapterStartFrames?: number[];
};

export const AudioEngine = ({
  musicTheme = "history",
  ambienceTheme = "ancient",
  seed,
  chapterStartFrames = [],
}: AudioEngineProps) => {
  return (
    <>
      <MusicEngine
        theme={musicTheme}
        seed={seed}
      />

      <AmbienceEngine
        theme={ambienceTheme}
        seed={seed}
      />

      <SfxEngine
        category="transition"
        seed={`${seed}:intro`}
        fromFrame={0}
        volume={0.35}
      />

      {chapterStartFrames.map((fromFrame, index) => (
        <SfxEngine
          key={`${fromFrame}-${index}`}
          category="impact"
          seed={`${seed}:chapter:${index}`}
          fromFrame={fromFrame}
          volume={0.28}
        />
      ))}
    </>
  );
};