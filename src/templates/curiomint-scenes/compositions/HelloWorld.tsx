import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  useCurrentFrame,
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
};

const Scene = ({ text, videoUrl }: SceneProps) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 12], [0.92, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      <Video
        src={videoUrl}
        muted
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
        }}
        onError={(error) => {
          console.error("Video processing error:", error.message);
          return "fail";
        }}
      />

      <AbsoluteFill
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.42)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: 70,
          paddingRight: 70,
          paddingBottom: 240,
        }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            color: "white",
            fontFamily: "Arial",
            fontSize: 86,
            fontWeight: 900,
            maxWidth: "90%",
            lineHeight: 1.15,
            textAlign: "center",
            whiteSpace: "pre-line",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
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
  fact2AudioUrl ,
}: HelloWorldProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      <Sequence from={0} durationInFrames={135}>
        <Scene
          text={`${title}\n\n${hook}`}
          videoUrl={enteringVideoUrl}
        />
        <Audio src={hookAudioUrl} />
      </Sequence>

      <Sequence from={135} durationInFrames={360}>
        <Scene text={fact1} videoUrl={video1Url} />
        <Audio src={fact1AudioUrl} />
      </Sequence>

      <Sequence from={495} durationInFrames={360}>
        <Scene text={fact2} videoUrl={video2Url} />
        <Audio src={fact2AudioUrl} />
      </Sequence>
    </AbsoluteFill>
  );
};