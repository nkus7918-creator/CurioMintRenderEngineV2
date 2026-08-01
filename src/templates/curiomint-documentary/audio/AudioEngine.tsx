import type { MusicTheme } from "../../../generated/musicManifest";
import type { AmbienceTheme } from "../../../generated/ambienceManifest";

import { AmbienceEngine } from "./AmbienceEngine";
import { MusicEngine } from "./MusicEngine";
import { SfxEngine } from "./SfxEngine";

type AudioEngineProps = {
  musicTheme?: MusicTheme;
  ambienceTheme?: AmbienceTheme;
  seed: string;
};

export const AudioEngine = ({
  musicTheme = "history",
  ambienceTheme = "ancient",
  seed,
}: AudioEngineProps) => {
  return (
    <>
      <MusicEngine theme={musicTheme} seed={seed} />

      <AmbienceEngine theme={ambienceTheme} seed={seed} />

      <SfxEngine
        category="transition"
        seed={seed}
        fromFrame={0}
        volume={0.35}
      />
    </>
  );
};
