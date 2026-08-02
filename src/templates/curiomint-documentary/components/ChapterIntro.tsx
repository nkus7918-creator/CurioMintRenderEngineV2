import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Img, staticFile } from "remotion";
import { HistoricalAsset } from "../historical/HistoricalAsset";

import {
  chapterLayouts,
  type ChapterLayoutId,
} from "../historical/chapterLayouts";

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

  const layoutIds: ChapterLayoutId[] = [
    "classic",
    "seal-right",
    "compass-left",
  ];

  const layoutId = layoutIds[chapterIndex % layoutIds.length];

  const layout = chapterLayouts[layoutId];
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
        seed={`chapter-${chapterIndex}:scroll`}
        opacity={0.95}
        objectFit="contain"
        style={{
          ...layout.scroll,
        }}
      />

      <HistoricalAsset
        category="wax seal"
        seed={`chapter-${chapterIndex}:seal`}
        opacity={layout.seal.opacity}
        objectFit="contain"
        style={{
          width: layout.seal.width,
          height: layout.seal.height,
          left: layout.seal.left,
          top: layout.seal.top,
        }}
      />

      <HistoricalAsset
        category="compass"
        seed={`chapter-${chapterIndex}:compass`}
        opacity={layout.compass.opacity}
        objectFit="contain"
        style={{
          width: layout.compass.width,
          height: layout.compass.height,
          left: layout.compass.left,
          top: layout.compass.top,
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
