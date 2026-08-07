import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  DOCUMENTARY_LAYOUT_PRESET,
  LayoutGridArea,
} from "../../../design";

import {
  useTheme,
} from "../themes/ThemeContext";

type ChapterIntroProps = {
  chapterIndex: number;

  chapterTitle: string;

  chapterSubtitle?: string;

  backgroundImageUrl?: string;

  durationInFrames: number;

  rank?: number;
};

const getChapterTitleFontSize = (
  title: string,
): number => {
  const length =
    title.trim().length;

  if (length > 58) {
    return 58;
  }

  if (length > 44) {
    return 64;
  }

  if (length > 30) {
    return 72;
  }

  return 82;
};

export const ChapterIntro = ({
  chapterIndex,
  chapterTitle,
  chapterSubtitle,
  backgroundImageUrl,
  durationInFrames,
  rank,
}: ChapterIntroProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const theme =
    useTheme();

  const safeDurationInFrames =
    Math.max(
      1,
      durationInFrames,
    );

  const exitStartFrame =
    Math.max(
      0,
      safeDurationInFrames -
        Math.round(
          fps * 0.35,
        ),
    );

  const sceneFadeIn =
    interpolate(
      frame,
      [
        0,
        Math.min(
          10,
          safeDurationInFrames,
        ),
      ],
      [0, 1],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const sceneFadeOut =
    interpolate(
      frame,
      [
        exitStartFrame,
        safeDurationInFrames,
      ],
      [1, 0],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const sceneOpacity =
    sceneFadeIn *
    sceneFadeOut;

  /*
   * Chapter intro'daki bütün ana
   * içerik aynı entrance hareketini
   * paylaşır.
   *
   * Böylece rank/title/subtitle
   * birbirinden kopuk animasyonlar
   * gibi görünmez.
   */
  const contentProgress =
    spring({
      frame:
        Math.max(
          0,
          frame - 4,
        ),

      fps,

      config: {
        damping: 18,

        stiffness: 105,

        mass: 0.9,
      },

      durationInFrames:
        Math.min(
          Math.round(
            fps * 0.8,
          ),

          safeDurationInFrames,
        ),
    });

  const contentTranslateY =
    interpolate(
      contentProgress,
      [0, 1],
      [30, 0],
    );

  const contentScale =
    interpolate(
      contentProgress,
      [0, 1],
      [0.985, 1],
    );

  const contentOpacity =
    interpolate(
      contentProgress,
      [0, 1],
      [0, 1],
    );

  /*
   * Background hareketi intro boyunca
   * çok yavaş kalır. Chapter card'ın
   * kendisinden dikkat çalmaz.
   */
  const backgroundScale =
    interpolate(
      frame,
      [
        0,
        safeDurationInFrames,
      ],
      [1.04, 1.075],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const backgroundTranslateX =
    interpolate(
      frame,
      [
        0,
        safeDurationInFrames,
      ],
      [-7, 5],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const accentLineScale =
    interpolate(
      contentProgress,
      [0, 1],
      [0, 1],
    );

  const resolvedRank =
    typeof rank === "number"
      ? rank
      : chapterIndex + 1;

  const rankText =
    String(
      resolvedRank,
    ).padStart(
      2,
      "0",
    );

  const titleFontSize =
    getChapterTitleFontSize(
      chapterTitle,
    );

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",

        backgroundColor:
          theme.colors.background,

        opacity:
          sceneOpacity,
      }}
    >
      {backgroundImageUrl ? (
        <AbsoluteFill
          style={{
            transform: [
              `translateX(${backgroundTranslateX}px)`,

              `scale(${backgroundScale})`,
            ].join(" "),
          }}
        >
          <Img
            src={
              backgroundImageUrl
            }
            style={{
              width: "100%",

              height: "100%",

              objectFit:
                "cover",

              filter:
                [
                  "brightness(0.62)",
                  "saturate(0.9)",
                  "contrast(1.08)",
                ].join(" "),
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: [
              "radial-gradient(",
              "circle at 74% 50%,",
              `${theme.colors.accent}24 0%,`,
              "transparent 38%",
              "),",
              `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`,
            ].join(" "),
          }}
        />
      )}

      {/* Sol taraf okunabilirlik */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(2,3,5,0.94) 0%, rgba(2,3,5,0.82) 30%, rgba(2,3,5,0.42) 62%, rgba(2,3,5,0.18) 100%)",
        }}
      />

      {/* Üst / alt cinematic falloff */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.06) 34%, rgba(0,0,0,0.12) 68%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* Hafif vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 48%, transparent 28%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      <LayoutGridArea
        preset={
          DOCUMENTARY_LAYOUT_PRESET
        }
        areaName="chapter"
        columnStart={1}
        columnSpan={12}
        placement="center-left"
      >
        <div
          style={{
            width: "100%",

            height: "100%",

            display: "grid",

            gridTemplateColumns:
              "minmax(0, 8fr) minmax(260px, 4fr)",

            alignItems:
              "center",

            columnGap: 60,

            minWidth: 0,

            transform:
              `translateY(${contentTranslateY}px) scale(${contentScale})`,

            transformOrigin:
              "left center",

            opacity:
              contentOpacity,
          }}
        >
          {/* ANA İÇERİK */}
          <div
            style={{
              minWidth: 0,

              maxWidth: 1120,
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 18,

                marginBottom: 24,
              }}
            >
              <div
                style={{
                  color:
                    theme.colors.accent,

                  fontFamily:
                    theme.typography
                      .fontFamily,

                  fontSize: 20,

                  fontWeight: 800,

                  letterSpacing: 6,

                  textTransform:
                    "uppercase",
                }}
              >
                Chapter
              </div>

              <div
                style={{
                  width: 120,

                  height: 2,

                  borderRadius:
                    999,

                  background:
                    `linear-gradient(90deg, ${theme.colors.accent}, transparent)`,

                  transform:
                    `scaleX(${accentLineScale})`,

                  transformOrigin:
                    "left center",
                }}
              />
            </div>

            <div
              style={{
                maxWidth: 1080,

                color:
                  theme.colors
                    .textPrimary,

                fontFamily:
                  theme.typography
                    .fontFamily,

                fontSize:
                  titleFontSize,

                fontWeight: 850,

                lineHeight: 0.98,

                letterSpacing: -2.4,

                textTransform:
                  "uppercase",

                overflowWrap:
                  "anywhere",

                textShadow:
                  "0 8px 34px rgba(0,0,0,0.82)",
              }}
            >
              {chapterTitle}
            </div>

            {chapterSubtitle ? (
              <div
                style={{
                  maxWidth: 900,

                  marginTop: 28,

                  color:
                    theme.colors
                      .textSecondary,

                  fontFamily:
                    theme.typography
                      .fontFamily,

                  fontSize: 30,

                  fontWeight: 450,

                  lineHeight: 1.35,

                  overflowWrap:
                    "anywhere",

                  textShadow:
                    "0 4px 22px rgba(0,0,0,0.8)",
                }}
              >
                {chapterSubtitle}
              </div>
            ) : null}
          </div>

          {/* BÜYÜK CHAPTER NUMARASI */}
          <div
            style={{
              position:
                "relative",

              display: "flex",

              justifyContent:
                "center",

              alignItems:
                "center",

              minWidth: 0,

              height: "100%",

              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                position:
                  "absolute",

                width: 260,

                height: 260,

                borderRadius:
                  "50%",

                border:
                  `1px solid ${theme.colors.accent}38`,

                boxShadow:
                  `0 0 80px ${theme.colors.accent}12`,
              }}
            />

            <div
              style={{
                position:
                  "absolute",

                width: 190,

                height: 190,

                borderRadius:
                  "50%",

                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                position:
                  "relative",

                color:
                  theme.colors.accent,

                fontFamily:
                  theme.typography
                    .fontFamily,

                fontSize: 148,

                fontWeight: 900,

                lineHeight: 1,

                letterSpacing: -8,

                opacity: 0.92,

                textShadow:
                  `0 0 32px ${theme.colors.accent}30`,
              }}
            >
              {rankText}
            </div>
          </div>
        </div>
      </LayoutGridArea>
    </AbsoluteFill>
  );
};