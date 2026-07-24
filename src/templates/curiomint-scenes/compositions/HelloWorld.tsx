import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {Video} from "@remotion/media";
import {loadFont} from "@remotion/google-fonts/Anton";
import {AnimatedSubtitle} from "./components/AnimatedSubtitle";

loadFont();

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

type SceneProps = {
  text: string;
  videoUrl: string;
  durationInFrames: number;
  variant?: "hook" | "fact";
  highlight?: string;
};

const Scene = ({
  text,
  videoUrl,
  durationInFrames,
  variant = "fact",
  highlight,
}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

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
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textScale = interpolate(entrance, [0, 1], [0.88, 1]);

  const textTranslateY = interpolate(entrance, [0, 1], [45, 0]);

  const backgroundScale = interpolate(frame, [0, 220], [1.04, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isHook = variant === "hook";

  return (
    <AbsoluteFill style={{backgroundColor: "#111111"}}>
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
          paddingBottom: isHook ? 0 : 300,
        }}
      >
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTranslateY}px) scale(${textScale})`,
            width: "100%",
            maxWidth: "92%",
            textAlign: "center",
          }}
        >
          {isHook ? (
            <AnimatedSubtitle
              text={text}
              highlight={highlight}
              wordsPerGroup={3}
              durationInFrames={durationInFrames}
              fontSize={72}
              letterSpacing={4}
              lineHeight={1.12}
              wordSpacing={16}
            />
          ) : (
            <AnimatedSubtitle
              text={text}
              wordsPerGroup={5}
              durationInFrames={durationInFrames}
              fontSize={58}
              letterSpacing={2}
              lineHeight={1.18}
              wordSpacing={14}
            />
          )}
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
}: HelloWorldProps) => {
  return (
    <AbsoluteFill style={{backgroundColor: "#111111"}}>
      <Sequence from={0} durationInFrames={159}>
        <Scene
          text={hook}
          highlight={highlight}
          videoUrl={enteringVideoUrl}
          variant="hook"
          durationInFrames={159}
        />
        <Audio src={hookAudioUrl} />
      </Sequence>

      <Sequence from={159} durationInFrames={216}>
        <Scene
          text={fact1}
          videoUrl={video1Url}
          variant="fact"
          durationInFrames={216}
        />
        <Audio src={fact1AudioUrl} />
      </Sequence>

      <Sequence from={375} durationInFrames={216}>
        <Scene
          text={fact2}
          videoUrl={video2Url}
          variant="fact"
          durationInFrames={216}
        />
        <Audio src={fact2AudioUrl} />
      </Sequence>
    </AbsoluteFill>
  );
};