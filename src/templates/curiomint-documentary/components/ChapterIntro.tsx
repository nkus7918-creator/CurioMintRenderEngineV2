import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HistoricalAsset } from "../historical/HistoricalAsset";

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
      <HistoricalAsset
        category="scroll"
        seed={`chapter-${chapterIndex}`}
        opacity={0.9}
        objectFit="contain"
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
