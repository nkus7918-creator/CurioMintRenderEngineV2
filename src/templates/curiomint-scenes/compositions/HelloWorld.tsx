import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { Video } from "@remotion/media";

import type { MusicTheme } from "../../../generated/musicManifest";
import { ShortAudioEngine } from "../audio/ShortAudioEngine";
import {
  AnimatedSubtitle,
  type SubtitleTiming,
} from "./components/AnimatedSubtitle";
import { CTAQuestion } from "./components/CTAQuestion";
import { CurioMintHeader } from "./components/CurioMintHeader";
import type { MascotState } from "./components/CurioMintMascot";

export type TimingInput = SubtitleTiming | string | null | undefined;

export type MediaType = "video" | "image";

export type MediaMotion =
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "panUp";

export type ShortMediaItem = {
  id?: string;
  type?: MediaType;
  url: string;
  motion?: MediaMotion;
  durationInSeconds?: number;
};

export type ShortSection = {
  id: string;
  role?: string;
  text: string;
  highlight?: string;
  narrationUrl?: string;
  timing?: TimingInput;
  media?: ShortMediaItem[];
};

export type HelloWorldProps = {
  title: string;

  /** New array-driven Shorts contract. */
  sections?: ShortSection[];

  audioProfile?: MusicTheme;
  musicEnabled?: boolean;
  sfxEnabled?: boolean;
  musicVolume?: number;

  /** Legacy fixed-section fields kept during the n8n migration. */
  hook?: string;
  highlight?: string;
  setup?: string;
  surprise?: string;
  payoff?: string;

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

  hookVideoUrl?: string;
  setupVideoUrl?: string;
  surpriseVideoUrl?: string;
  payoffVideoUrl?: string;

  hookAudioUrl?: string;
  setupAudioUrl?: string;
  surpriseAudioUrl?: string;
  payoffAudioUrl?: string;

  hookTiming?: TimingInput;
  setupTiming?: TimingInput;
  surpriseTiming?: TimingInput;
  payoffTiming?: TimingInput;

  headerHook?: string;
  ctaQuestion?: string;
  sourceLabel?: string;
  thumbnailText?: string;
  logoSrc?: string;
};

type ResolvedSection = {
  id: string;
  role: string;
  text: string;
  highlight?: string;
  narrationUrl: string;
  timing?: SubtitleTiming;
  media: ShortMediaItem[];
};

type TimelineSection = ResolvedSection & {
  index: number;
  startFrame: number;
  durationInFrames: number;
  endFrame: number;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export const parseShortTiming = (
  input: TimingInput,
): SubtitleTiming | undefined => {
  if (!input) return undefined;

  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.words)) {
      return undefined;
    }

    return {
      text: typeof parsed.text === "string" ? parsed.text : undefined,
      duration:
        typeof parsed.duration === "number" && Number.isFinite(parsed.duration)
          ? parsed.duration
          : undefined,
      words: parsed.words,
    };
  } catch (error) {
    console.error("Subtitle timing parse error:", error);
    return undefined;
  }
};

const legacyMedia = (
  type: MediaType | undefined,
  mediaUrl: string | undefined,
  videoUrl: string | undefined,
  motion: MediaMotion | undefined,
): ShortMediaItem[] => {
  const url = clean(mediaUrl || videoUrl);

  return url
    ? [
        {
          type: type ?? "video",
          url,
          motion: motion ?? "zoomIn",
        },
      ]
    : [];
};

export const resolveShortSections = (
  props: HelloWorldProps,
): ResolvedSection[] => {
  if (Array.isArray(props.sections) && props.sections.length > 0) {
    return props.sections
      .map((section, index) => {
        const timing = parseShortTiming(section?.timing);
        const text = clean(section?.text || timing?.text);
        const id = clean(section?.id) || `section-${index + 1}`;

        return {
          id,
          role:
            clean(section?.role).toLowerCase() ||
            (index === 0 ? "hook" : index === props.sections!.length - 1 ? "payoff" : "fact"),
          text,
          highlight: clean(section?.highlight) || undefined,
          narrationUrl: clean(section?.narrationUrl),
          timing,
          media: Array.isArray(section?.media)
            ? section.media
                .map((media) => ({
                  ...media,
                  url: clean(media?.url),
                  type: media?.type ?? "video",
                  motion: media?.motion ?? "zoomIn",
                }))
                .filter((media) => Boolean(media.url))
            : [],
        };
      })
      .filter((section) => Boolean(section.text));
  }

  const legacySections: Array<{
    id: string;
    role: string;
    text?: string;
    highlight?: string;
    narrationUrl?: string;
    timing?: TimingInput;
    media: ShortMediaItem[];
  }> = [
    {
      id: "hook",
      role: "hook",
      text: props.hook,
      highlight: props.highlight,
      narrationUrl: props.hookAudioUrl,
      timing: props.hookTiming,
      media: legacyMedia(
        props.hookMediaType,
        props.hookMediaUrl,
        props.hookVideoUrl,
        props.hookMediaMotion,
      ),
    },
    {
      id: "setup",
      role: "context",
      text: props.setup,
      narrationUrl: props.setupAudioUrl,
      timing: props.setupTiming,
      media: legacyMedia(
        props.setupMediaType,
        props.setupMediaUrl,
        props.setupVideoUrl,
        props.setupMediaMotion,
      ),
    },
    {
      id: "surprise",
      role: "twist",
      text: props.surprise,
      narrationUrl: props.surpriseAudioUrl,
      timing: props.surpriseTiming,
      media: legacyMedia(
        props.surpriseMediaType,
        props.surpriseMediaUrl,
        props.surpriseVideoUrl,
        props.surpriseMediaMotion,
      ),
    },
    {
      id: "payoff",
      role: "payoff",
      text: props.payoff,
      narrationUrl: props.payoffAudioUrl,
      timing: props.payoffTiming,
      media: legacyMedia(
        props.payoffMediaType,
        props.payoffMediaUrl,
        props.payoffVideoUrl,
        props.payoffMediaMotion,
      ),
    },
  ];

  return legacySections
    .map((section) => ({
      id: section.id,
      role: section.role,
      text: clean(section.text),
      highlight: clean(section.highlight) || undefined,
      narrationUrl: clean(section.narrationUrl),
      timing: parseShortTiming(section.timing),
      media: section.media,
    }))
    .filter((section) => Boolean(section.text));
};

const fallbackDurationInFrames = (
  section: ResolvedSection,
  fps: number,
): number => {
  const wordCount = section.text.split(/\s+/).filter(Boolean).length;
  const minimumSeconds = section.role === "hook" ? 1.8 : 2.8;
  const estimatedSeconds = wordCount / 2.65 + 0.35;

  return Math.max(1, Math.ceil(Math.max(minimumSeconds, estimatedSeconds) * fps));
};

const sectionDurationInFrames = (
  section: ResolvedSection,
  fps: number,
): number => {
  const timingDuration = Number(section.timing?.duration ?? 0);
  const lastWordEnd =
    section.timing?.words && section.timing.words.length > 0
      ? Number(section.timing.words[section.timing.words.length - 1]?.end ?? 0)
      : 0;
  const durationInSeconds = Math.max(timingDuration, lastWordEnd);

  return durationInSeconds > 0
    ? Math.max(1, Math.ceil(durationInSeconds * fps))
    : fallbackDurationInFrames(section, fps);
};

export const createShortTimeline = (
  props: HelloWorldProps,
  fps: number,
): TimelineSection[] => {
  let cursor = 0;

  return resolveShortSections(props).map((section, index) => {
    const durationInFrames = sectionDurationInFrames(section, fps);
    const item = {
      ...section,
      index,
      startFrame: cursor,
      durationInFrames,
      endFrame: cursor + durationInFrames,
    };

    cursor = item.endFrame;
    return item;
  });
};

export const calculateShortsDurationInFrames = (
  props: HelloWorldProps,
  fps: number,
): number => {
  const timeline = createShortTimeline(props, fps);
  const sectionsDuration = timeline[timeline.length - 1]?.endFrame ?? fps * 8;
  const ctaDuration = clean(props.ctaQuestion) ? Math.round(fps * 4) : 0;

  return Math.max(1, sectionsDuration + ctaDuration);
};

const imageTransform = (
  motion: MediaMotion,
  progress: number,
): string => {
  switch (motion) {
    case "zoomOut":
      return `scale(${interpolate(progress, [0, 1], [1.15, 1.04])})`;
    case "panLeft":
      return `scale(1.13) translateX(${interpolate(progress, [0, 1], [3.5, -3.5])}%)`;
    case "panRight":
      return `scale(1.13) translateX(${interpolate(progress, [0, 1], [-3.5, 3.5])}%)`;
    case "panUp":
      return `scale(1.13) translateY(${interpolate(progress, [0, 1], [3.5, -3.5])}%)`;
    case "zoomIn":
    default:
      return `scale(${interpolate(progress, [0, 1], [1.04, 1.15])})`;
  }
};

const MediaVisual = ({
  media,
  durationInFrames,
}: {
  media: ShortMediaItem;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edgeFadeFrames = Math.min(6, Math.max(1, Math.floor(durationInFrames * 0.12)));
  const opacity = interpolate(
    frame,
    [0, edgeFadeFrames, Math.max(edgeFadeFrames, durationInFrames - edgeFadeFrames), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#111111" }}>
      {media.type === "image" ? (
        <Img
          src={media.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: imageTransform(media.motion ?? "zoomIn", progress),
            transformOrigin: "center center",
          }}
        />
      ) : (
        <Video
          src={media.url}
          muted
          loop
          objectFit="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${interpolate(progress, [0, 1], [1.04, 1.12])})`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

const createMediaSlots = (
  media: ShortMediaItem[],
  durationInFrames: number,
): Array<{ media: ShortMediaItem; startFrame: number; durationInFrames: number }> => {
  if (media.length === 0) return [];

  const weights = media.map((item) => {
    const duration = Number(item.durationInSeconds ?? 0);
    return Number.isFinite(duration) && duration > 0 ? duration : 1;
  });
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0;

  return media.map((item, index) => {
    const isLast = index === media.length - 1;
    const remaining = Math.max(1, durationInFrames - cursor);
    const slotDuration = isLast
      ? remaining
      : Math.max(1, Math.round((durationInFrames * weights[index]) / totalWeight));
    const slot = { media: item, startFrame: cursor, durationInFrames: slotDuration };
    cursor += slotDuration;
    return slot;
  });
};

const SectionScene = ({ section }: { section: TimelineSection }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isHook = section.role === "hook" || section.index === 0;
  const mediaSlots = createMediaSlots(section.media, section.durationInFrames);
  const hookEntrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.68 },
  });
  const hookScale = isHook ? interpolate(hookEntrance, [0, 1], [0.9, 1]) : 1;
  const hookGlow = isHook
    ? interpolate(frame, [0, Math.round(fps * 0.22), Math.round(fps * 1.2)], [0, 0.72, 0.22], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      {mediaSlots.map((slot, index) => (
        <Sequence
          key={slot.media.id || `${section.id}-media-${index}`}
          from={slot.startFrame}
          durationInFrames={slot.durationInFrames}
        >
          <MediaVisual media={slot.media} durationInFrames={slot.durationInFrames} />
        </Sequence>
      ))}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {isHook ? (
        <AbsoluteFill
          style={{
            opacity: hookGlow,
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,212,0,0.2) 0%, rgba(140,230,189,0.09) 28%, transparent 62%)",
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          justifyContent: isHook ? "center" : "flex-end",
          alignItems: "center",
          paddingLeft: 70,
          paddingRight: 70,
          paddingBottom: isHook ? 0 : 300,
          transform: `scale(${hookScale})`,
        }}
      >
        <div style={{ width: "100%", maxWidth: "92%", textAlign: "center" }}>
          <AnimatedSubtitle
            text={section.text}
            words={section.timing?.words}
            highlight={section.highlight}
            isHook={isHook}
            durationInFrames={section.durationInFrames}
            fontSize={isHook ? 92 : 66}
            letterSpacing={isHook ? 2.2 : 2}
            lineHeight={isHook ? 1.04 : 1.12}
            wordSpacing={isHook ? 25 : 24}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const roleIsTwist = (role: string): boolean =>
  ["twist", "surprise", "reveal", "anomaly", "turning-point"].includes(role);

const findHighlightFrame = (
  section: TimelineSection | undefined,
  fps: number,
): number | undefined => {
  if (!section?.highlight || !section.timing?.words?.length) return undefined;

  const normalizedHighlight = clean(section.highlight).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const word = section.timing.words.find(
    (item) => clean(item.word).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === normalizedHighlight,
  );

  return word ? section.startFrame + Math.max(0, Math.round(word.start * fps)) : undefined;
};

export const HelloWorld = (props: HelloWorldProps) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const timeline = createShortTimeline(props, fps);
  const sectionsEndFrame = timeline[timeline.length - 1]?.endFrame ?? 0;
  const ctaDurationInFrames = clean(props.ctaQuestion) ? Math.max(1, Math.round(fps * 4)) : 0;
  const ctaStart = sectionsEndFrame;
  const activeSection = timeline.find(
    (section) => frame >= section.startFrame && frame < section.endFrame,
  );
  const mascotState: MascotState =
    frame >= ctaStart
      ? "asking"
      : activeSection && roleIsTwist(activeSection.role)
        ? "shocked"
        : "curious";
  const narrationIntervals = timeline
    .filter((section) => Boolean(section.narrationUrl))
    .map((section) => ({ startFrame: section.startFrame, endFrame: section.endFrame }));
  const transitionFrames = timeline.slice(1).map((section) => section.startFrame);
  const twistFrames = timeline
    .filter((section) => roleIsTwist(section.role))
    .map((section) => section.startFrame);
  const hookSection = timeline.find((section) => section.role === "hook") ?? timeline[0];
  const hookHighlightFrame = findHighlightFrame(hookSection, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      {timeline.map((section) => (
        <Sequence
          key={section.id}
          from={section.startFrame}
          durationInFrames={section.durationInFrames}
        >
          <SectionScene section={section} />
          {section.narrationUrl ? <Audio src={section.narrationUrl} /> : null}
        </Sequence>
      ))}

      {props.musicEnabled !== false || props.sfxEnabled !== false ? (
        <ShortAudioEngine
          seed={clean(props.title) || "CurioMint"}
          musicTheme={props.audioProfile ?? "mystery"}
          musicVolume={props.musicEnabled === false ? 0 : props.musicVolume}
          narrationIntervals={narrationIntervals}
          transitionFrames={transitionFrames}
          twistFrames={twistFrames}
          hookHighlightFrame={hookHighlightFrame}
          sfxEnabled={props.sfxEnabled !== false}
        />
      ) : null}

      {ctaDurationInFrames <= 0 || frame < ctaStart ? (
        <CurioMintHeader
          headerHook={props.headerHook || hookSection?.text || ""}
          mascotState={mascotState}
          logoPath={props.logoSrc || "branding/curiomint-logo.png"}
          openingActive={Boolean(hookSection && frame < hookSection.endFrame)}
        />
      ) : null}

      {ctaDurationInFrames > 0 ? (
        <Sequence from={ctaStart} durationInFrames={ctaDurationInFrames}>
          <CTAQuestion
            question={props.ctaQuestion ?? ""}
            durationInFrames={ctaDurationInFrames}
            fps={fps}
            sourceLabel={props.sourceLabel}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
