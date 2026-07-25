import { Composition } from "remotion";

import {
  HelloWorld,
  type HelloWorldProps,
} from "./compositions/HelloWorld";

const defaultProps: HelloWorldProps = {
  title: "CurioMint",

  hook: "Lightning creates tiny x-rays.",
  highlight: "lightning",

  setup:
    "Scientists discovered unusual radiation inside powerful storms.",

  surprise:
    "Electrical discharges can produce short bursts of x-rays.",

  payoff:
    "These invisible flashes happen before lightning reaches the ground.",

  hookVideoUrl: "",
  setupVideoUrl: "",
  surpriseVideoUrl: "",
  payoffVideoUrl: "",

  hookAudioUrl: "",
  setupAudioUrl: "",
  surpriseAudioUrl: "",
  payoffAudioUrl: "",

  hookTiming: {
    text: "Lightning creates tiny x-rays.",
    duration: 1.84,
    words: [
      {
        word: "Lightning",
        start: 0,
        end: 0.38,
      },
      {
        word: "creates",
        start: 0.38,
        end: 0.7,
      },
      {
        word: "tiny",
        start: 0.7,
        end: 0.95,
      },
      {
        word: "x-rays.",
        start: 0.95,
        end: 1.84,
      },
    ],
  },

  setupTiming: undefined,
  surpriseTiming: undefined,
  payoffTiming: undefined,
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="curiomint-scenes"
      component={HelloWorld}
      durationInFrames={780}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};