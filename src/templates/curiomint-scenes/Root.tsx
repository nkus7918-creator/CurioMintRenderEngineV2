import { Composition } from "remotion";

import {
  HelloWorld,
  type HelloWorldProps,
} from "./compositions/HelloWorld";

import type { CalculateMetadataFunction } from "remotion";

const fps = 30;
const gapFrames = 15;

const getDuration = (
  timing: HelloWorldProps["hookTiming"],
  fallback: number,
) => {
  if (!timing) {
    return fallback;
  }

  try {
    const parsed =
      typeof timing === "string"
        ? JSON.parse(timing)
        : timing;

    if (
      typeof parsed?.duration !== "number" ||
      parsed.duration <= 0
    ) {
      return fallback;
    }

    return Math.ceil(parsed.duration * fps) + gapFrames;
  } catch {
    return fallback;
  }
};

const calculateMetadata: CalculateMetadataFunction<
  HelloWorldProps
> = ({ props }) => {
  const hookDuration = getDuration(
    props.hookTiming,
    90,
  );

  const setupDuration = getDuration(
    props.setupTiming,
    180,
  );

  const surpriseDuration = getDuration(
    props.surpriseTiming,
    240,
  );

  const payoffDuration = getDuration(
    props.payoffTiming,
    240,
  );

  return {
    durationInFrames:
      hookDuration +
      setupDuration +
      surpriseDuration +
      payoffDuration,
  };
};
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
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={780}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};