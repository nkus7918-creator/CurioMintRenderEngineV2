import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { Video } from "@remotion/media";

import {
  AnimatedSubtitle,
  type SubtitleTiming,
} from "./components/AnimatedSubtitle";
import { CurioMintHeader } from "./components/CurioMintHeader";
import { CTAQuestion } from "./components/CTAQuestion";
import type { MascotState } from "./components/CurioMintMascot";

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

  /** Optional Shorts brand/engagement fields. */
  headerHook?: string;
  ctaQuestion?: string;
  sourceLabel?: string;
  thumbnailText?: string;
  logoSrc?: string;
};

type SceneProps = {
  text: string;
  videoUrl: string;
  durationInFrames: number;

  timing?: SubtitleTiming;

  variant?: "hook" | "fact";
  highlight?: string;
  ctaActive?: boolean;
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
        typeof parsed.duration === "number" &&
          Number.isFinite(parsed.duration)
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

const resolveDurationInFrames = (
  timing: SubtitleTiming | undefined,
  fps: number,
  fallbackFrames: number,
): number => {
  const duration =
    typeof timing?.duration === "number" &&
      Number.isFinite(timing.duration) &&
      timing.duration > 0
      ? timing.duration
      : null;

  if (duration === null) {
    return fallbackFrames;
  }

  return Math.max(
    1,
    Math.ceil(duration * fps),
  );
};

const Scene = ({
  text,
  videoUrl,
  durationInFrames,
  timing,
  variant = "fact",
  highlight,
  ctaActive = false,
}: SceneProps) => {
  const frame = useCurrentFrame();

  const fadeInFrames = 5;
  const fadeOutFrames = Math.min(
    15,
    Math.max(1, Math.floor(durationInFrames * 0.12)),
  );

  const fadeOutStart = Math.max(
    fadeInFrames,
    durationInFrames - fadeOutFrames,
  );

  const opacity = interpolate(
    frame,
    [
      0,
      fadeInFrames,
      fadeOutStart,
      Math.max(
        fadeOutStart + 1,
        durationInFrames - 1,
      ),
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
    [0, Math.max(1, durationInFrames)],
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
          loop
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
          paddingBottom: isHook ? 0 : ctaActive ? 560 : 300,
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
            fontSize={isHook ? 72 : 66}
            letterSpacing={isHook ? 4 : 2}
            lineHeight={isHook ? 1.12 : 1.12}
            wordSpacing={isHook ? 28 : 24}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const HelloWorld = ({
  title,
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
  headerHook,
  ctaQuestion,
  sourceLabel,
  logoSrc,
}: HelloWorldProps) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const parsedHookTiming = parseTiming(hookTiming);
  const parsedSetupTiming = parseTiming(setupTiming);
  const parsedSurpriseTiming = parseTiming(surpriseTiming);
  const parsedPayoffTiming = parseTiming(payoffTiming);

  const hookDuration = resolveDurationInFrames(
    parsedHookTiming,
    fps,
    87,
  );

  const setupDuration = resolveDurationInFrames(
    parsedSetupTiming,
    fps,
    192,
  );

  const surpriseDuration = resolveDurationInFrames(
    parsedSurpriseTiming,
    fps,
    300,
  );

  const payoffDuration = resolveDurationInFrames(
    parsedPayoffTiming,
    fps,
    297,
  );

  const hookStart = 0;
  const setupStart = hookStart + hookDuration;
  const surpriseStart = setupStart + setupDuration;
  const payoffStart = surpriseStart + surpriseDuration;
  const ctaDurationInFrames = ctaQuestion?.trim()
    ? Math.max(1, Math.round(fps * 4))
    : 0;

  const ctaStart = payoffStart + payoffDuration;
  const totalDurationInFrames = ctaStart + ctaDurationInFrames;

  const mascotState: MascotState =
    frame >= ctaStart
      ? "asking"
      : frame >= surpriseStart
        ? "shocked"
        : "curious";

  const musicTracks = [
    "music/mystery1.mp3",
    "music/mystery2.mp3",
    "music/mystery3.mp3",
    "music/mystery4.mp3",
    "music/mystery5.mp3",
  ];

  const safeTitle = String(title ?? "");

  const hash = Array.from(safeTitle).reduce<number>(
    (hashValue, char) =>
      ((hashValue << 5) - hashValue) +
      char.charCodeAt(0),
    0,
  );

  const index =
    Math.abs(hash) % musicTracks.length;

  const selectedMusic =
    musicTracks[index];

  console.log(
    "Selected music:",
    selectedMusic,
    "Title:",
    safeTitle,
    "Durations:",
    {
      hook: hookDuration,
      setup: setupDuration,
      surprise: surpriseDuration,
      payoff: payoffDuration,
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
      }}
    >
      <Audio
        src={staticFile(selectedMusic)}
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
          ctaActive={false}
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
          ctaActive={false}
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
          ctaActive={false}
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
          ctaActive={false}
        />

        {payoffAudioUrl && (
          <Audio src={payoffAudioUrl} />
        )}
      </Sequence>

      <CurioMintHeader
        headerHook={headerHook || hook}
        mascotState={
          frame >= ctaStart
            ? undefined
            : mascotState
        }
        logoPath={
          logoSrc ||
          "branding/curiomint-logo.png"
        }
      />

      {ctaDurationInFrames > 0 && (
        <Sequence
          from={ctaStart}
          durationInFrames={ctaDurationInFrames}
        >
          <CTAQuestion
            question={ctaQuestion ?? ""}
            durationInFrames={ctaDurationInFrames}
            fps={fps}
            sourceLabel={sourceLabel}
          />
        </Sequence>
      )}

      {ctaDurationInFrames <= 0 ||
        frame < ctaStart ? (
        <CurioMintHeader
          headerHook={
            headerHook || hook
          }
          mascotState={
            mascotState
          }
          logoPath={
            logoSrc ||
            "branding/curiomint-logo.png"
          }
        />
      ) : null}

      {ctaDurationInFrames > 0 && (
        <Sequence
          from={ctaStart}
          durationInFrames={
            ctaDurationInFrames
          }
        >
          <CTAQuestion
            question={
              ctaQuestion ?? ""
            }
            durationInFrames={
              ctaDurationInFrames
            }
            fps={fps}
            sourceLabel={
              sourceLabel
            }
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
