import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
} from "remotion";

export type HelloWorldProps = {
  title: string;
  hook: string;
  fact1: string;
  fact2: string;
  enteringVideoUrl: string;
  video1Url: string;
  video2Url: string;
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
      <OffthreadVideo
        src={videoUrl}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <AbsoluteFill
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.42)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 90,
        }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            color: "white",
            fontFamily: "Arial",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: "center",
            whiteSpace: "pre-line",
            textShadow: "0 6px 20px rgba(0,0,0,0.8)",
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
}: HelloWorldProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111111" }}>
      <Sequence from={0} durationInFrames={135}>
        <Scene
          text={`${title}\n\n${hook}`}
          videoUrl={enteringVideoUrl}
        />
      </Sequence>

      <Sequence from={135} durationInFrames={360}>
        <Scene text={fact1} videoUrl={video1Url} />
      </Sequence>

      <Sequence from={495} durationInFrames={360}>
        <Scene text={fact2} videoUrl={video2Url} />
      </Sequence>
    </AbsoluteFill>
  );
};