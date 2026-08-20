import {
  Composition,
  type CalculateMetadataFunction,
} from "remotion";

import {
  HelloWorld,
  calculateShortsDurationInFrames,
  type HelloWorldProps,
} from "./compositions/HelloWorld";

const fps = 30;

const calculateMetadata: CalculateMetadataFunction<
  HelloWorldProps
> = ({ props }) => ({
  durationInFrames: calculateShortsDurationInFrames(props, fps),
});

const defaultProps: HelloWorldProps = {
  title: "CurioMint",
  headerHook: "LIGHTNING MAKES X-RAYS",
  ctaQuestion: "Why do you think this happens?",
  sourceLabel: "",
  thumbnailText: "",
  audioProfile: "mystery",
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.1,
  narrationVolume: 2.2,

  sections: [
    {
      id: "hook",
      role: "hook",
      text: "Lightning creates tiny x-rays.",
      highlight: "lightning",
      narrationUrl: "",
      timing: {
        text: "Lightning creates tiny x-rays.",
        duration: 1.84,
        words: [
          { word: "Lightning", start: 0, end: 0.38 },
          { word: "creates", start: 0.38, end: 0.7 },
          { word: "tiny", start: 0.7, end: 0.95 },
          { word: "x-rays.", start: 0.95, end: 1.84 },
        ],
      },
      media: [],
    },
    {
      id: "context",
      role: "context",
      text: "Scientists found unusual radiation inside powerful storms.",
      narrationUrl: "",
      media: [],
    },
    {
      id: "evidence",
      role: "evidence",
      text: "Electrical discharges release extremely short bursts of energy.",
      narrationUrl: "",
      media: [],
    },
    {
      id: "twist",
      role: "twist",
      text: "The invisible flash appears before the lightning strike.",
      narrationUrl: "",
      media: [],
    },
    {
      id: "payoff",
      role: "payoff",
      text: "A storm can briefly behave like a tiny particle accelerator.",
      narrationUrl: "",
      media: [],
    },
  ],
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="curiomint-scenes"
      component={HelloWorld}
      width={1080}
      height={1920}
      fps={fps}
      durationInFrames={780}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
