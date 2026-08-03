import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
} from "remotion";

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
  chapterSubtitle?: string;
  backgroundImageUrl?: string;
  durationInFrames: number;
};

export const ChapterIntro = ({
  chapterIndex,
  chapterTitle,
  chapterSubtitle,
  backgroundImageUrl,
  durationInFrames,
}: ChapterIntroProps) => {
  const frame = useCurrentFrame();

  const entranceOpacity = interpolate(
    frame,
    [0, 16],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const exitOpacity = interpolate(
    frame,
    [
      Math.max(0, durationInFrames - 15),
      durationInFrames,
    ],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const sceneOpacity =
    entranceOpacity * exitOpacity;

  const backgroundScale = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [1.04, 1.12],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const backgroundTranslateY = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [8, -8],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const backgroundBlur = interpolate(
    frame,
    [0, 22],
    [12, 5],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const textOpacity = interpolate(
    frame,
    [8, 28],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const textTranslateY = interpolate(
    frame,
    [8, 30],
    [34, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const textBlur = interpolate(
    frame,
    [8, 24],
    [7, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const dividerScale = interpolate(
    frame,
    [18, 38],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const chapterLabelSpacing = interpolate(
    frame,
    [8, 30],
    [16, 9],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const subtitleOpacity = interpolate(
    frame,
    [20, 40],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

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
            filter: `blur(${backgroundBlur}px)`,
          }}
        >
          <Img
            src={backgroundImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter:
                "brightness(0.62) saturate(0.82) contrast(1.08)",
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
            "linear-gradient(to bottom, rgba(2,3,5,0.8) 0%, rgba(2,3,5,0.2) 30%, rgba(2,3,5,0.3) 68%, rgba(2,3,5,0.92) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at center, transparent 28%, rgba(0,0,0,0.64) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.52) 0%, transparent 24%, transparent 76%, rgba(0,0,0,0.52) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "90px 120px",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1280,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: textOpacity,
            transform: `translateY(${textTranslateY}px)`,
            filter: `blur(${textBlur}px)`,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: chapterLabelSpacing,
              textTransform: "uppercase",
              color: "rgba(238,206,132,0.9)",
              textShadow:
                "0 3px 18px rgba(0,0,0,0.65)",
              marginBottom: 24,
            }}
          >
            Chapter {toRoman(chapterIndex + 1)}
          </div>

          <div
            style={{
              width: 120,
              height: 2,
              marginBottom: 30,
              background:
                "linear-gradient(90deg, transparent, rgba(238,206,132,0.9), transparent)",
              transform: `scaleX(${dividerScale})`,
              transformOrigin: "center",
            }}
          />

          <div
            style={{
              maxWidth: 1180,
              fontSize:
                chapterTitle.length > 42
                  ? 64
                  : chapterTitle.length > 28
                    ? 74
                    : 84,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: -2.2,
              color: "#ffffff",
              textShadow:
                "0 6px 28px rgba(0,0,0,0.82)",
            }}
          >
            {chapterTitle}
          </div>

          {chapterSubtitle ? (
            <div
              style={{
                maxWidth: 960,
                marginTop: 24,
                fontSize: 30,
                lineHeight: 1.35,
                fontWeight: 400,
                color: "rgba(255,255,255,0.76)",
                opacity: subtitleOpacity,
                textShadow:
                  "0 4px 20px rgba(0,0,0,0.72)",
              }}
            >
              {chapterSubtitle}
            </div>
          ) : null}

          <div
            style={{
              width: 220,
              height: 1,
              marginTop: 34,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              transform: `scaleX(${dividerScale})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};