import React from "react";
import { Img, staticFile } from "remotion";

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

    /*
     * Büyük ana mascot.
     */
    const mascotSize = 900;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,

          zIndex: 180,

          pointerEvents: "none",

          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",

          paddingBottom: 70,
        }}
      >
        <div
          style={{
            position: "relative",

            width: 1080,
            maxWidth:
              "calc(100% - 40px)",

            height: 1100,

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

              top: 0,
              left: 100,
              right: 100,
              minHeight: 180,
              padding: "30px 38px 28px 38px",

              boxSizing: "border-box",

              borderRadius: 28,

              background: "#FFFFFF",

              border:
                "3px solid rgba(0,0,0,0.14)",

              boxShadow:
                "0 14px 34px rgba(0,0,0,0.28)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#0A1713",

                fontFamily:
                  "Arial Black, Arial, Helvetica, sans-serif",

                fontSize: 40,

                fontWeight: 900,

                lineHeight: 1.14,

                letterSpacing: -0.6,

                paddingTop: 4,
                paddingBottom: 6,

                boxSizing: "border-box",

                maxWidth: 820,

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

              bottom: 20,

              left: "50%",

              transform:
                "translateX(-50%)",

              width: mascotSize,
              height: mascotSize,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              zIndex: 5,
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

          {/* =====================================================
            OPTIONAL SOURCE
            ===================================================== */}
        </div>
      </div>
    );
  };