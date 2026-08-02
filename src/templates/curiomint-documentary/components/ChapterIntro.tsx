import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Img, staticFile } from "remotion";

type ChapterIntroProps = {
  chapterIndex: number;
  chapterTitle: string;
  durationInFrames: number;
};

export const ChapterIntro = ({
  chapterIndex,
  chapterTitle,
  durationInFrames,
}: ChapterIntroProps) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <Img
        src={staticFile("assets/Historical/Scroll 2.png")}
        style={{
          position: "absolute",
          width: 1200,
          height: 850,
          objectFit: "contain",
          zIndex: 0,
        }}
      />

      <Img
        src={staticFile("assets/Historical/Wax Seal 1.png")}
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          objectFit: "contain",
          right: 430,
          bottom: 155,
          zIndex: 1,
          opacity: 0.9,
        }}
      />

      <Img
        src={staticFile("assets/Historical/Compass 1.svg")}
        style={{
          position: "absolute",
          width: 130,
          height: 130,
          objectFit: "contain",
          left: 420,
          top: 150,
          zIndex: 1,
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            color: "#5f4630",
            fontSize: 30,
            letterSpacing: 8,
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          Chapter {chapterIndex + 1}
        </div>

        <div
          style={{
            color: "#24170f",
            fontSize: 72,
            fontWeight: 700,
            maxWidth: 1000,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {chapterTitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
