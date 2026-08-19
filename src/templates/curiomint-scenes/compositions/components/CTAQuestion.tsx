import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";

import { SHORTS_FONT_FAMILY } from "../../fonts";

type CTAQuestionProps = {
  question: string;
  durationInFrames: number;
  fps: number;
  sourceLabel?: string;
};

const mascotPath =
  "mascot/bird-asking.svg";

const clampQuestion = (
  value: string,
): string => {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "";
  }

  if (text.length <= 72) {
    return text;
  }

  return `${text.slice(0, 69).trim()}…`;
};

export const CTAQuestion: React.FC<
  CTAQuestionProps
> = ({
  question,
  durationInFrames,
  fps,
  sourceLabel,
}) => {
    const frame =
      useCurrentFrame();

    const safeQuestion =
      clampQuestion(question);

    if (!safeQuestion) {
      return null;
    }

    const entranceFrames =
      Math.max(
        6,
        Math.round(fps * 0.22),
      );

    const entrance = spring({
      frame,
      fps,
      config: {
        damping: 15,
        stiffness: 175,
        mass: 0.72,
      },
    });

    const screenOpacity =
      interpolate(
        frame,
        [0, entranceFrames],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

    /*
     * Büyük ana mascot.
     */
    const mascotSize = 960;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,

          zIndex: 180,

          pointerEvents: "none",

          overflow: "hidden",

          opacity: screenOpacity,

          background:
            "radial-gradient(circle at 50% 72%, rgba(140,230,189,0.34) 0%, rgba(17,67,51,0.3) 30%, transparent 58%), linear-gradient(160deg, #04110D 0%, #0A2B21 52%, #123C2E 100%)",

          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",

          paddingBottom: 28,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.14,
            backgroundImage:
              "radial-gradient(circle, rgba(140,230,189,0.9) 2px, transparent 2.5px)",
            backgroundSize: "46px 46px",
            transform: `scale(${interpolate(entrance, [0, 1], [1.08, 1])})`,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 1080,
            height: 1080,
            left: "50%",
            bottom: -360,
            transform: "translateX(-50%)",
            borderRadius: "50%",
            border: "3px solid rgba(140,230,189,0.18)",
            boxShadow:
              "0 0 0 55px rgba(140,230,189,0.035), 0 0 0 120px rgba(140,230,189,0.025)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 142,
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(entrance, [0, 1], [0.78, 1])})`,
            padding: "14px 28px 12px",
            borderRadius: 999,
            background: "#FFD400",
            color: "#07140F",
            fontFamily: SHORTS_FONT_FAMILY,
            fontSize: 42,
            fontWeight: 400,
            letterSpacing: 3.2,
            lineHeight: 1,
            boxShadow: "0 12px 34px rgba(0,0,0,0.32)",
          }}
        >
          YOUR TURN
        </div>

        <div
          style={{
            position: "relative",

            width: 1080,
            maxWidth:
              "calc(100% - 40px)",

            height: 1550,

            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* =====================================================
            SPEECH BUBBLE
            ===================================================== */}
          <div
            style={{
              position: "absolute",

              top: 180,
              left: 76,
              right: 76,
              minHeight: 220,
              padding: "38px 46px 34px 46px",

              boxSizing: "border-box",

              borderRadius: 34,

              background: "#FFFFFF",

              border:
                "3px solid rgba(0,0,0,0.14)",

              boxShadow:
                "0 22px 54px rgba(0,0,0,0.38), 0 0 0 7px rgba(140,230,189,0.12)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              textAlign: "center",

              opacity: interpolate(
                entrance,
                [0, 1],
                [0, 1],
              ),

              transform: `translateY(${interpolate(entrance, [0, 1], [44, 0])}px)`,
            }}
          >
            <div
              style={{
                color: "#0A1713",

                fontFamily:
                  SHORTS_FONT_FAMILY,

                fontSize: 52,

                fontWeight: 400,

                lineHeight: 1.14,

                letterSpacing: 0.8,

                paddingTop: 4,
                paddingBottom: 6,

                boxSizing: "border-box",

                maxWidth: 850,

                display: "-webkit-box",

                WebkitBoxOrient:
                  "vertical",

                WebkitLineClamp: 2,

                overflow: "hidden",
              }}
            >
              {safeQuestion}
            </div>

            {/* Bubble tail */}
            <div
              style={{
                position: "absolute",

                left: "50%",

                bottom: -28,

                width: 50,
                height: 50,

                background: "#FFFFFF",

                borderRight:
                  "3px solid rgba(0,0,0,0.14)",

                borderBottom:
                  "3px solid rgba(0,0,0,0.14)",

                transform:
                  "translateX(-50%) rotate(45deg)",

                zIndex: -1,
              }}
            />
          </div>

          {/* =====================================================
            LARGE MASCOT
            ===================================================== */}
          <div
            style={{
              position: "absolute",

              bottom: 28,

              left: "50%",

              width: mascotSize,
              height: mascotSize,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              zIndex: 5,

              transform: `translateX(-50%) translateY(${interpolate(entrance, [0, 1], [90, 0])}px) scale(${interpolate(entrance, [0, 1], [0.88, 1])})`,
            }}
          >
            <Img
              src={staticFile(mascotPath)}
              style={{
                width: mascotSize,
                height: mascotSize,

                objectFit: "contain",

                display: "block",

                filter:
                  "drop-shadow(0 14px 20px rgba(0,0,0,0.42))",
              }}
            />
          </div>

          {sourceLabel ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 10,
                color: "rgba(255,255,255,0.58)",
                fontFamily: SHORTS_FONT_FAMILY,
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: 1.2,
                textAlign: "center",
                zIndex: 8,
              }}
            >
              {sourceLabel.toUpperCase()}
            </div>
          ) : null}

          {/* =====================================================
            OPTIONAL SOURCE
            ===================================================== */}
        </div>
      </div>
    );
  };
