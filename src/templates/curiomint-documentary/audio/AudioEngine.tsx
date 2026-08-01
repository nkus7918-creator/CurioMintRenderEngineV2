import type { MusicTheme } from "../../../generated/musicManifest";
import type { AmbienceTheme } from "../../../generated/ambienceManifest";

import { AmbienceEngine } from "./AmbienceEngine";
import { MusicEngine } from "./MusicEngine";

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
      <MusicEngine
        theme={musicTheme}
        seed={seed}
      />

      <AmbienceEngine
        theme={ambienceTheme}
        seed={seed}
      />
    </>
  );
};