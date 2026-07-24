import {Composition} from "remotion";

import {HelloWorld} from "./compositions/HelloWorld";
import type {HelloWorldProps} from "./compositions/HelloWorld";

const defaultProps: HelloWorldProps = {
  title: "CurioMint",

  hook: "Lightning creates tiny x-rays.",
  highlight: "lightning",

  fact1:
    "Scientists discovered that lightning can produce powerful bursts of x-rays.",

  fact2:
    "These invisible rays form during intense electrical discharges inside storms.",

  enteringVideoUrl: "",
  video1Url: "",
  video2Url: "",

  hookAudioUrl: "",
  fact1AudioUrl: "",
  fact2AudioUrl: "",

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

  fact1Timing: undefined,
  fact2Timing: undefined,
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="curiomint-scenes"
      component={HelloWorld}
      durationInFrames={591}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};