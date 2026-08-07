import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

import { DOCUMENTARY_LAYOUT_PRESET, LayoutGridArea } from "../../../design";

type ChapterIntroProps = {
  chapterIndex: number;
  chapterTitle: string;
  chapterSubtitle?: string;
  backgroundImageUrl?: string;
  durationInFrames: number;
  rank?: number;
};

export const ChapterIntro = ({
  chapterIndex,
  chapterTitle,
  chapterSubtitle,
  backgroundImageUrl,
  durationInFrames,
  rank,
}: ChapterIntroProps) => {
  const frame = useCurrentFrame();

  const safeDurationInFrames = Math.max(1, durationInFrames);

  const entranceOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(
    frame,
    [Math.max(0, safeDurationInFrames - 12), safeDurationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const sceneOpacity = entranceOpacity * exitOpacity;

  /*
   * Background ilk anda hafif flu ve büyük.
   * Sonra netleşip çok yavaş biçimde yaklaşır.
   */
  const backgroundScale = interpolate(
    frame,
    [0, safeDurationInFrames],
    [1.055, 1.085],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const backgroundTranslateY = interpolate(
    frame,
    [0, safeDurationInFrames],
    [6, -5],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const rankOpacity = interpolate(frame, [5, 17], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rankScale = interpolate(frame, [5, 20], [0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rankTranslateY = interpolate(frame, [5, 20], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerScale = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleTranslateY = interpolate(frame, [15, 31], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleBlur = interpolate(frame, [15, 27], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleTranslateY = interpolate(frame, [25, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const resolvedRank = typeof rank === "number" ? rank : chapterIndex + 1;

  const titleFontSize =
    chapterTitle.length > 42 ? 62 : chapterTitle.length > 28 ? 72 : 84;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#050608",
        opacity: sceneOpacity,
      }}
    >
      {backgroundImageUrl ? (
        <AbsoluteFill
          style={{
            transform: `
              translateY(${backgroundTranslateY}px)
              scale(${backgroundScale})
            `,
            opacity: interpolate(frame, [0, 16], [0.72, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <Img
            src={backgroundImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.68) saturate(1.04)",
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at center, #1b2028 0%, #07090d 72%)",
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(2,3,5,0.9) 0%, rgba(2,3,5,0.68) 30%, rgba(2,3,5,0.42) 58%, rgba(2,3,5,0.74) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 24%, rgba(0,0,0,0.58) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.08) 28%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0.58) 100%)",
        }}
      />

      <LayoutGridArea
        preset={DOCUMENTARY_LAYOUT_PRESET}
        areaName="chapter"
        columnStart={2}
        columnSpan={10}
        placement="center"
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#FFD75A",
              fontSize: 94,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: -3,
              opacity: rankOpacity,
              transform: `
                translateY(${rankTranslateY}px)
                scale(${rankScale})
              `,
              textShadow: [
                "0 3px 2px rgba(0,0,0,0.88)",
                "0 8px 26px rgba(0,0,0,0.72)",
                "0 0 20px rgba(255,215,90,0.2)",
              ].join(", "),
            }}
          >
            #{resolvedRank}
          </div>

          <div
            style={{
              width: 300,
              height: 3,
              marginTop: 22,
              marginBottom: 26,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, transparent, rgba(255,215,90,0.98), transparent)",
              transform: `scaleX(${dividerScale})`,
              transformOrigin: "center",
              boxShadow: "0 0 16px rgba(255,215,90,0.26)",
            }}
          />

          <div
            style={{
              maxWidth: 1180,
              fontSize: titleFontSize,
              lineHeight: 1.02,
              fontWeight: 850,
              letterSpacing: -2.2,
              textTransform: "uppercase",
              color: "#ffffff",
              opacity: titleOpacity,
              transform: `translateY(${titleTranslateY}px)`,
              filter: `blur(${titleBlur}px)`,
              textShadow: "0 7px 30px rgba(0,0,0,0.84)",
            }}
          >
            {chapterTitle}
          </div>

          {chapterSubtitle ? (
            <div
              style={{
                maxWidth: 980,
                marginTop: 22,
                fontSize: 31,
                lineHeight: 1.3,
                fontWeight: 450,
                color: "rgba(255,255,255,0.8)",
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleTranslateY}px)`,
                textShadow: "0 4px 20px rgba(0,0,0,0.76)",
              }}
            >
              {chapterSubtitle}
            </div>
          ) : null}

          <div
            style={{
              width: 180,
              height: 1,
              marginTop: 30,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              transform: `scaleX(${dividerScale})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </LayoutGridArea>
    </AbsoluteFill>
  );
};
