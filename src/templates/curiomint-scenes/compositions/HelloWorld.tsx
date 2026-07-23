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
  fact1: string;
  fact2: string;

  enteringVideoUrl: string;
  video1Url: string;
  video2Url: string;

  hookAudioUrl: string;
  fact1AudioUrl: string;
  fact2AudioUrl: string;
};

type SceneProps = {
  text: string;
  videoUrl: string;
  variant?: "hook" | "fact";
};

const Scene = ({
  text,
  videoUrl,
  variant = "fact",
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

  const textScale = interpolate(
    entrance,
    [0, 1],
    [0.78, 1],
  );

  const textTranslateY = interpolate(
    entrance,
    [0, 1],
    [70, 0],
  );

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
            letterSpacing: isHook ? -2 : -1,
            textTransform: isHook ? "uppercase" : "none",
            textShadow:
              "0 6px 12px rgba(0,0,0,0.75), 0 14px 40px rgba(0,0,0,0.9)",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const HelloWorld = ({
  title,
  hook,
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