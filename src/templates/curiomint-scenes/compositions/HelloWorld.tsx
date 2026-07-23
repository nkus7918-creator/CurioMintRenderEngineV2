import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { Video } from "@remotion/media";

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
};

type HighlightedTextProps = {
  text: string;
  highlight?: string;
};

const normalizeWord = (word: string) => {
  return word
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
};

const HighlightedText = ({
  text,
  highlight,
}: HighlightedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const highlightEntrance = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: {
      damping: 10,
      stiffness: 190,
      mass: 0.6,
    },
  });

  const highlightScale = interpolate(
    highlightEntrance,
    [0, 1],
    [0.65, 1.12],
  );

  const normalizedHighlight = normalizeWord(highlight ?? "");

  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        const isWhitespace = /^\s+$/.test(part);

        if (isWhitespace) {
          return part;
        }

        const isHighlighted =
          normalizedHighlight.length > 0 &&
          normalizeWord(part) === normalizedHighlight;

        return (
          <span
            key={`${part}-${index}`}
            style={{
              display: "inline-block",
              color: isHighlighted ? "#FFD400" : "#FFFFFF",
              transform: isHighlighted
                ? `scale(${highlightScale})`
                : "scale(1)",
              textShadow: isHighlighted
                ? "0 5px 12px rgba(0,0,0,0.85), 0 0 28px rgba(255,212,0,0.35)"
                : undefined,
            }}
          >
            {part.toUpperCase()}
          </span>
        );
      })}
    </>
  );
};

type SceneProps = {
  text: string;
  videoUrl: string;
  variant?: "hook" | "fact";
  highlight?: string;
};

const Scene = ({
  text,
  videoUrl,
  variant = "fact",
  highlight,
}: SceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 160,
      mass: 0.7,
    },
  });

  const textOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const textScale = interpolate(entrance, [0, 1], [0.78, 1]);

  const textTranslateY = interpolate(entrance, [0, 1], [70, 0]);

  const backgroundScale = interpolate(
    frame,
    [0, 220],
    [1.04, 1.12],
    {
      extrapolateRight: "clamp",
    },
  );

  const isHook = variant === "hook";

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      <Video
        src={videoUrl}
        muted
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${backgroundScale})`,
        }}
        onError={(error) => {
          console.error("Video processing error:", error.message);
          return "fail";
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.32) 45%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: isHook ? "center" : "flex-end",
          alignItems: "center",
          paddingLeft: 70,
          paddingRight: 70,
          paddingBottom: isHook ? 0 : 240,
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTranslateY}px) scale(${textScale})`,
            color: "white",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: isHook ? 82 : 84,
            fontWeight: 900,
            maxWidth: "92%",
            lineHeight: isHook ? 1.05 : 1.14,
            textAlign: "center",
            whiteSpace: "pre-line",
            letterSpacing: isHook ? 2 : -1,
            textTransform: isHook ? "uppercase" : "none",
            textShadow:
              "0 6px 12px rgba(0,0,0,0.75), 0 14px 40px rgba(0,0,0,0.9)",
          }}
        >
          {isHook ? (
            <HighlightedText
              text={text}
              highlight={highlight}
            />
          ) : (
            text
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const HelloWorld = ({
  title,
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
}: HelloWorldProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      <Sequence from={0} durationInFrames={159}>
        <Scene
          text={hook}
          highlight={highlight}
          videoUrl={enteringVideoUrl}
          variant="hook"
        />
        <Audio src={hookAudioUrl} />
      </Sequence>

      <Sequence from={159} durationInFrames={216}>
        <Scene
          text={fact1}
          videoUrl={video1Url}
          variant="fact"
        />
        <Audio src={fact1AudioUrl} />
      </Sequence>

      <Sequence from={375} durationInFrames={216}>
        <Scene
          text={fact2}
          videoUrl={video2Url}
          variant="fact"
        />
        <Audio src={fact2AudioUrl} />
      </Sequence>
    </AbsoluteFill>
  );
};