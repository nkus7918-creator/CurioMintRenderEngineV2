import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";

import {Video} from "@remotion/media";
import {loadFont} from "@remotion/google-fonts/Anton";

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

  fact1: string;
  fact2: string;

  enteringVideoUrl: string;
  video1Url: string;
  video2Url: string;

  hookAudioUrl: string;
  fact1AudioUrl: string;
  fact2AudioUrl: string;

  hookTiming?: TimingInput;
  fact1Timing?: TimingInput;
  fact2Timing?: TimingInput;
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
            wordSpacing={isHook ? 16 : 14}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const HelloWorld = ({
  hook,
  highlight,
  fact1,
  fact2,

  enteringVideoUrl,
  video1Url,
  video2Url,

  hookAudioUrl,
  fact1AudioUrl,
  fact2AudioUrl,

  hookTiming,
  fact1Timing,
  fact2Timing,
}: HelloWorldProps) => {
  const hookDuration = 159;
  const fact1Duration = 216;
  const fact2Duration = 216;

  const parsedHookTiming =
    parseTiming(hookTiming);

  const parsedFact1Timing =
    parseTiming(fact1Timing);

  const parsedFact2Timing =
    parseTiming(fact2Timing);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
      }}
    >
      <Sequence
        from={0}
        durationInFrames={hookDuration}
      >
        <Scene
          text={hook}
          timing={parsedHookTiming}
          highlight={highlight}
          videoUrl={enteringVideoUrl}
          variant="hook"
          durationInFrames={hookDuration}
        />

        {hookAudioUrl ? (
          <Audio src={hookAudioUrl} />
        ) : null}
      </Sequence>

      <Sequence
        from={hookDuration}
        durationInFrames={fact1Duration}
      >
        <Scene
          text={fact1}
          timing={parsedFact1Timing}
          videoUrl={video1Url}
          variant="fact"
          durationInFrames={fact1Duration}
        />

        {fact1AudioUrl ? (
          <Audio src={fact1AudioUrl} />
        ) : null}
      </Sequence>

      <Sequence
        from={hookDuration + fact1Duration}
        durationInFrames={fact2Duration}
      >
        <Scene
          text={fact2}
          timing={parsedFact2Timing}
          videoUrl={video2Url}
          variant="fact"
          durationInFrames={fact2Duration}
        />

        {fact2AudioUrl ? (
          <Audio src={fact2AudioUrl} />
        ) : null}
      </Sequence>
    </AbsoluteFill>
  );
};