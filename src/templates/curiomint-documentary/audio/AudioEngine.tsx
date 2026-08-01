import type { AmbienceTheme } from "../../../generated/ambienceManifest";
import type { MusicTheme } from "../../../generated/musicManifest";

import { AmbienceEngine } from "./AmbienceEngine";
import { MusicEngine } from "./MusicEngine";
import { SfxEngine } from "./SfxEngine";
import { audioMixer } from "./mixer";

type AudioEngineProps = {
  musicTheme?: MusicTheme;
  ambienceTheme?: AmbienceTheme;
  seed: string;
  chapterStartFrames?: number[];
  sectionStartFrames?: number[];
  enabled?: boolean;
};

export const AudioEngine = ({
  musicTheme = "history",
  ambienceTheme = "ancient",
  seed,
  chapterStartFrames = [],
  sectionStartFrames = [],
  enabled = true,
}: AudioEngineProps) => {
  if (!enabled) {
    return null;
  }
  return (
    <>
      <MusicEngine theme={musicTheme} seed={seed} />

      <AmbienceEngine theme={ambienceTheme} seed={seed} />

      <SfxEngine
        category="transition"
        seed={`${seed}:intro`}
        fromFrame={0}
        volume={audioMixer.sfx.intro}
        durationInFrames={45}
      />

      {chapterStartFrames.map((fromFrame, index) => (
        <SfxEngine
          key={`${fromFrame}-${index}`}
          category="impact"
          seed={`${seed}:chapter:${index}`}
          fromFrame={fromFrame}
          volume={audioMixer.sfx.intro}
          durationInFrames={30}
        />
      ))}

      {sectionStartFrames.map((fromFrame, index) => (
        <SfxEngine
          key={`section-${fromFrame}-${index}`}
          category="transition"
          seed={`${seed}:section:${index}`}
          fromFrame={fromFrame}
          volume={audioMixer.sfx.intro}
          durationInFrames={24}
        />
      ))}
    </>
  );
};
