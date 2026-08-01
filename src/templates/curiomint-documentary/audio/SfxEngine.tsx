import { Audio, Sequence, staticFile } from "remotion";

import { sfxManifest, type SfxCategory } from "../../../generated/sfxManifest";

import { pickDeterministicItem } from "./randomSelector";

type SfxEngineProps = {
  category: SfxCategory;
  seed: string;
  fromFrame?: number;
  volume?: number;
  durationInFrames?: number;
};

export const SfxEngine = ({
  category,
  seed,
  fromFrame = 0,
  volume = 0.35,
  durationInFrames,
}: SfxEngineProps) => {
  const sounds = sfxManifest[category];

  const selectedSound = pickDeterministicItem({
    items: [...sounds],
    seed: `${seed}:sfx:${category}:${fromFrame}`,
  });

  if (!selectedSound) {
    return null;
  }

  return (
    <Sequence from={fromFrame} durationInFrames={durationInFrames}>
      <Audio src={staticFile(selectedSound)} volume={volume} />
    </Sequence>
  );
};
