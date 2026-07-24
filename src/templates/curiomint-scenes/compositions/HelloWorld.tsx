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

import { loadFont } from "@remotion/google-fonts/Anton";

loadFont();

import { AnimatedSubtitle } from "./components/AnimatedSubtitle";

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
              marginRight: 16,

              color: isHighlighted ? "#FFD400" : "#FFFFFF",

              WebkitTextStroke: "3.5px #000000",
              paintOrder: "stroke fill",

              filter: `
                drop-shadow(3px 0 0 #000)
                drop-shadow(-3px 0 0 #000)
                drop-shadow(0 3px 0 #000)
                drop-shadow(0 -3px 0 #000)
              `,

              textShadow: "0 7px 4px rgba(0,0,0,0.9)",

              transform: isHighlighted
                ? `scale(${highlightScale})`
                : "scale(1)",

              transformOrigin: "center",
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
            fontFamily: "Anton",
            fontSize: isHook ? 72 : 66,
            maxWidth: "92%",
            textAlign: "center",
            whiteSpace: "pre-line",
            textTransform: isHook ? "uppercase" : "none",

            WebkitTextStroke: isHook ? "5px black" : "4px black",
            paintOrder: "stroke fill",
            letterSpacing: isHook ? 4 : 2,
            lineHeight: isHook ? 1.12 : 1.18,
            textShadow: "0 6px 14px rgba(0,0,0,0.85)",
          }}
        >
          {isHook ? (
            <AnimatedSubtitle
            text={text}
            highlight={highlight}
            wordsPerGroup={3}
            groupDuration={24}
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