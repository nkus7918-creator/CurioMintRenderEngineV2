import {
  AbsoluteFill,
  Audio,
  Img,
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

type MediaType = "video" | "image";

type MediaMotion =
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "panUp";

export type HelloWorldProps = {
  title: string;

  hook: string;
  highlight?: string;

  setup: string;
  surprise: string;
  payoff: string;

  hookMediaType?: MediaType;
  hookMediaUrl?: string;
  hookMediaMotion?: MediaMotion;
  setupMediaType?: MediaType;
  setupMediaUrl?: string;
  setupMediaMotion?: MediaMotion;
  surpriseMediaType?: MediaType;
  surpriseMediaUrl?: string;
  surpriseMediaMotion?: MediaMotion;
  payoffMediaType?: MediaType;
  payoffMediaUrl?: string;
  payoffMediaMotion?: MediaMotion;

  /** Legacy video-only fields kept for older n8n payloads. */
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
  mediaType?: MediaType;
  mediaUrl: string;
  mediaMotion?: MediaMotion;
  durationInFrames: number;

  timing?: SubtitleTiming;

  variant?:
    | "hook"
    | "setup"
    | "surprise"
    | "payoff";
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
  mediaType = "video",
  mediaUrl,
  mediaMotion = "zoomIn",
  durationInFrames,
  timing,
  variant = "setup",
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

  const subtitlePace =
    variant === "hook" ||
    variant === "surprise"
      ? "punch"
      : "phrase";

  const motionProgress = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const videoScale = interpolate(
    motionProgress,
    [0, 1],
    [1.04, 1.12],
  );

  const imageTransform = (() => {
    switch (mediaMotion) {
      case "zoomOut":
        return `scale(${interpolate(motionProgress, [0, 1], [1.14, 1.04])})`;
      case "panLeft":
        return `scale(1.12) translateX(${interpolate(motionProgress, [0, 1], [3.5, -3.5])}%)`;
      case "panRight":
        return `scale(1.12) translateX(${interpolate(motionProgress, [0, 1], [-3.5, 3.5])}%)`;
      case "panUp":
        return `scale(1.12) translateY(${interpolate(motionProgress, [0, 1], [3.5, -3.5])}%)`;
      case "zoomIn":
      default:
        return `scale(${interpolate(motionProgress, [0, 1], [1.04, 1.14])})`;
    }
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111111",
      }}
    >
      {mediaUrl && mediaType === "image" ? (
        <Img
          src={mediaUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: imageTransform,
            transformOrigin: "center center",
          }}
        />
      ) : null}

      {mediaUrl && mediaType !== "image" ? (
        <Video
          src={mediaUrl}
          muted
          loop
          objectFit="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${videoScale})`,
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
            pace={subtitlePace}
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
  hookMediaType,
  hookMediaUrl,
  hookMediaMotion,
  setupMediaType,
  setupMediaUrl,
  setupMediaMotion,
  surpriseMediaType,
  surpriseMediaUrl,
  surpriseMediaMotion,
  payoffMediaType,
  payoffMediaUrl,
  payoffMediaMotion,
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
          mediaType={hookMediaType}
          mediaUrl={hookMediaUrl || hookVideoUrl}
          mediaMotion={hookMediaMotion}
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
          mediaType={setupMediaType}
          mediaUrl={setupMediaUrl || setupVideoUrl}
          mediaMotion={setupMediaMotion}
          variant="setup"
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
          mediaType={surpriseMediaType}
          mediaUrl={surpriseMediaUrl || surpriseVideoUrl}
          mediaMotion={surpriseMediaMotion}
          variant="surprise"
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
          mediaType={payoffMediaType}
          mediaUrl={payoffMediaUrl || payoffVideoUrl}
          mediaMotion={payoffMediaMotion}
          variant="payoff"
          durationInFrames={payoffDuration}
          ctaActive={false}
        />

        {payoffAudioUrl && (
          <Audio src={payoffAudioUrl} />
        )}
      </Sequence>

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
