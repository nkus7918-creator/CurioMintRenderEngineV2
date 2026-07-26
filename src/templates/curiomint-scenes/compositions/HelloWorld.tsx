import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import { Video } from "@remotion/media";
import { loadFont } from "@remotion/google-fonts/Anton";

import {
  AnimatedSubtitle,
  type SubtitleTiming,
} from "./components/AnimatedSubtitle";

loadFont();

type TimingInput =
  | SubtitleTiming
  | string
  | null
  | undefined;

export type HelloWorldProps = {
  title: string;

  hook: string;
  highlight?: string;

  setup: string;
  surprise: string;
  payoff: string;

  hookVideoUrl: string;
  setupVideoUrl: string;
  surpriseVideoUrl: string;
  payoffVideoUrl: string;

  hookAudioUrl: string;
  setupAudioUrl: string;
  surpriseAudioUrl: string;
  payoffAudioUrl: string;

  hookTiming?: TimingInput;
  setupTiming?: TimingInput;
  surpriseTiming?: TimingInput;
  payoffTiming?: TimingInput;
};

type SceneProps = {
  text: string;
  videoUrl: string;
  durationInFrames: number;

  timing?: SubtitleTiming;

  variant?: "hook" | "fact";
  highlight?: string;
};

const parseTiming = (
  input: TimingInput,
): SubtitleTiming | undefined => {
  if (!input) {
    return undefined;
  }

  try {
    const parsed =
      typeof input === "string"
        ? JSON.parse(input)
        : input;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.words)
    ) {
      return undefined;
    }

    return {
      text:
        typeof parsed.text === "string"
          ? parsed.text
          : undefined,

      duration:
        typeof parsed.duration === "number"
          ? parsed.duration
          : undefined,

      words: parsed.words,
    };
  } catch (error) {
    console.error(
      "Subtitle timing parse error:",
      error,
    );

    return undefined;
  }
};

const Scene = ({
  text,
  videoUrl,
  durationInFrames,
  timing,
  variant = "fact",
  highlight,
}: SceneProps) => {
  const frame = useCurrentFrame();

  const fadeInFrames = 5;
  const fadeOutFrames = 15;

  const opacity = interpolate(
    frame,
    [
      0,
      fadeInFrames,
      durationInFrames - fadeOutFrames,
      durationInFrames - 1,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const isHook = variant === "hook";

  const backgroundScale = interpolate(
    frame,
    [0, durationInFrames],
    [1.04, 1.12],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
      }}
    >
      {videoUrl ? (
        <Video
          src={videoUrl}
          muted
          objectFit="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${backgroundScale})`,
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.32) 45%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: isHook
            ? "center"
            : "flex-end",

          alignItems: "center",

          paddingLeft: 70,
          paddingRight: 70,
          paddingBottom: isHook ? 0 : 300,

          opacity,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "92%",
            textAlign: "center",
          }}
        >
          <AnimatedSubtitle
            text={text}
            words={timing?.words}
            highlight={
              isHook ? highlight : undefined
            }
            isHook={isHook}
            durationInFrames={durationInFrames}
            fontSize={isHook ? 72 : 58}
            letterSpacing={isHook ? 4 : 2}
            lineHeight={isHook ? 1.12 : 1.18}
            wordSpacing={isHook ? 28 : 24}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const HelloWorld = ({
  hook,
  highlight,
  setup,
  surprise,
  payoff,

  hookVideoUrl,
  setupVideoUrl,
  surpriseVideoUrl,
  payoffVideoUrl,

  hookAudioUrl,
  setupAudioUrl,
  surpriseAudioUrl,
  payoffAudioUrl,

  hookTiming,
  setupTiming,
  surpriseTiming,
  payoffTiming,
}: HelloWorldProps) => {

  const parsedHookTiming = parseTiming(hookTiming);
  const parsedSetupTiming = parseTiming(setupTiming);
  const parsedSurpriseTiming = parseTiming(surpriseTiming);
  const parsedPayoffTiming = parseTiming(payoffTiming);

  const hookDuration = 87;
  const setupDuration = 192;
  const surpriseDuration = 300;
  const payoffDuration = 297;

  const hookStart = 0;
  const setupStart = hookStart + hookDuration;
  const surpriseStart = setupStart + setupDuration;
  const payoffStart = surpriseStart + surpriseDuration;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
      }}
    >
      <Audio
        src={staticFile("music/mystery.mp3")}
        volume={0.3}
        loop
      />

      <Sequence
        from={hookStart}
        durationInFrames={hookDuration}
      >
        <Scene
          text={hook}
          timing={parsedHookTiming}
          highlight={highlight}
          videoUrl={hookVideoUrl}
          variant="hook"
          durationInFrames={hookDuration}
        />

        {hookAudioUrl && (
          <Audio src={hookAudioUrl} />
        )}
      </Sequence>

      <Sequence
        from={setupStart}
        durationInFrames={setupDuration}
      >
        <Scene
          text={setup}
          timing={parsedSetupTiming}
          videoUrl={setupVideoUrl}
          variant="fact"
          durationInFrames={setupDuration}
        />

        {setupAudioUrl && (
          <Audio src={setupAudioUrl} />
        )}
      </Sequence>

      <Sequence
        from={surpriseStart}
        durationInFrames={surpriseDuration}
      >
        <Scene
          text={surprise}
          timing={parsedSurpriseTiming}
          videoUrl={surpriseVideoUrl}
          variant="fact"
          durationInFrames={surpriseDuration}
        />

        {surpriseAudioUrl && (
          <Audio src={surpriseAudioUrl} />
        )}
      </Sequence>

      <Sequence
        from={payoffStart}
        durationInFrames={payoffDuration}
      >
        <Scene
          text={payoff}
          timing={parsedPayoffTiming}
          videoUrl={payoffVideoUrl}
          variant="fact"
          durationInFrames={payoffDuration}
        />

        {payoffAudioUrl && (
          <Audio src={payoffAudioUrl} />
        )}
      </Sequence>
    </AbsoluteFill>
  );
};
