import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { HistoricalAsset } from "../historical/HistoricalAsset";

import {
  chapterLayouts,
  type ChapterLayoutId,
} from "../historical/chapterLayouts";

const toRoman = (value: number): string => {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = Math.max(1, Math.floor(value));
  let result = "";

  for (const [number, symbol] of numerals) {
    while (remaining >= number) {
      result += symbol;
      remaining -= number;
    }
  }

  return result;
};
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

  const layoutIds: ChapterLayoutId[] = [
    "classic",
    "seal-right",
    "compass-left",
  ];

  const layoutId = layoutIds[chapterIndex % layoutIds.length];

  const layout = chapterLayouts[layoutId];

  const scrollScale = interpolate(frame, [0, 24], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scrollOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textTranslateY = interpolate(frame, [8, 30], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(frame, [8, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textBlur = interpolate(frame, [8, 22], [3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(
    frame,
    [Math.max(0, durationInFrames - 15), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const compassRotation = interpolate(frame, [0, 75], [-4, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sealScale = interpolate(frame, [12, 32], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerScale = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chapterLabelSpacing = interpolate(frame, [8, 30], [14, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080808",
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      <HistoricalAsset
        category="scroll"
        seed={`chapter-${chapterIndex}:scroll`}
        opacity={0.95 * scrollOpacity}
        objectFit="contain"
        style={{
          ...layout.scroll,
          transform: `scale(${scrollScale})`,
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
          transform: `scale(${sealScale})`,
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
          transform: `rotate(${compassRotation}deg)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: 820,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
          filter: `blur(${textBlur}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: chapterLabelSpacing,
            textTransform: "uppercase",
            color: "rgba(70, 45, 24, 0.72)",
            marginBottom: 22,
          }}
        >
          Chapter {toRoman(chapterIndex + 1)}
        </div>

        <div
          style={{
            width: 90,
            height: 2,
            marginBottom: 24,
            background:
              "linear-gradient(90deg, transparent, rgba(80, 48, 24, 0.75), transparent)",
            transform: `scaleX(${dividerScale})`,
            transformOrigin: "center",
          }}
        />

        <div
          style={{
            maxWidth: 760,
            fontSize: 66,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: -1.5,
            textAlign: "center",
            color: "#382313",
            textShadow: "0 2px 1px rgba(255, 244, 210, 0.35)",
          }}
        >
          {chapterTitle}
        </div>

        <div
          style={{
            width: 160,
            height: 1,
            marginTop: 28,
            background:
              "linear-gradient(90deg, transparent, rgba(80, 48, 24, 0.5), transparent)",
            transform: `scaleX(${dividerScale})`,
            transformOrigin: "center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
