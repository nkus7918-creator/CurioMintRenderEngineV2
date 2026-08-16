import React, { useState } from "react";
import { Img, staticFile } from "remotion";

type MascotState =
  | "curious"
  | "shocked"
  | "asking";

type CurioMintHeaderProps = {
  headerHook?: string;
  mascotState?: MascotState;
  logoPath?: string;
};

const MASCOT_BY_STATE: Record<
  MascotState,
  string
> = {
  curious: "mascot/bird-curious.svg",
  shocked: "mascot/bird-shocked.svg",
  asking: "mascot/bird-asking.svg",
};

const clampHeader = (
  value: string,
): string => {
  const normalized = String(
    value ?? "",
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const capitalized =
    normalized.charAt(0).toLocaleUpperCase("en-US") +
    normalized.slice(1);

  if (capitalized.length <= 72) {
    return capitalized;
  }

  return `${capitalized
    .slice(0, 69)
    .trim()}…`;
};

const BrandLogo = ({
  logoPath,
}: {
  logoPath: string;
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{
          width: 118,
          height: 118,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(8, 32, 26, 0.92)",
          border: "3px solid #8CE6BD",
          color: "#8CE6BD",
          fontFamily: "Arial Black, Arial, sans-serif",
          fontWeight: 900,
          fontSize: 48,
          flexShrink: 0,
        }}
      >
        C
      </div>
    );
  }

  return (
    <Img
      src={staticFile(logoPath)}
      onError={() => setFailed(true)}
      style={{
        width: 138,
        height: 138,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
};

const MascotImage = ({
  state,
}: {
  state: MascotState;
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Img
      src={staticFile(MASCOT_BY_STATE[state])}
      onError={() => setFailed(true)}
      style={{
        width: 300,
        height: 300,
        objectFit: "contain",
        display: "block",
        transform: "translateY(78px)",
        filter:
          "drop-shadow(0 14px 20px rgba(0,0,0,0.42))",
      }}
    />
  );
};

export const CurioMintHeader: React.FC<
  CurioMintHeaderProps
> = ({
  headerHook,
  mascotState = "curious",
  logoPath = "branding/curiomint-logo.png",
}) => {
    const safeHook = clampHeader(headerHook ?? "");

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: 360,
          zIndex: 100,
          overflow: "visible",
          pointerEvents: "none",
          background: "rgba(3, 10, 9, 0.96)",
        }}
      >
        {/* BRAND ROW */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 32,
            right: 24,
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {/* LOGO */}
          <BrandLogo logoPath={logoPath} />

          {/* BRAND NAME */}
          <div
            style={{
              marginLeft: 24,
              paddingTop: 14,
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: "#FFFFFF",
                fontFamily:
                  "Arial Black, Arial, Helvetica, sans-serif",
                fontSize: 70,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: -2.4,
                whiteSpace: "nowrap",
                textShadow:
                  "0 4px 14px rgba(0,0,0,0.55)",
              }}
            >
              Curio
              <span style={{ color: "#8CE6BD" }}>
                Mint
              </span>
            </div>
          </div>

          {/* MASCOT */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 300,
              height: 355,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <MascotImage state={mascotState} />
          </div>
        </div>

        {/* HEADER HOOK — BOTTOM OF HEADER */}
        {safeHook ? (
          <div
            style={{
              position: "absolute",

              left: 34,
              right: 300,

              /*
               * Çok daha aşağıda.
               */
              bottom: 52,

              display: "flex",
              alignItems: "stretch",
              minWidth: 0,

              maxWidth:
                "calc(100% - 334px)",
            }}
          >
            <div
              style={{
                width: 9,
                borderRadius: 999,
                background: "#8CE6BD",
                flexShrink: 0,
                marginRight: 20,
                boxShadow:
                  "0 0 20px rgba(140,230,189,0.24)",
              }}
            />

            <div
              style={{
                minWidth: 0,
                width: "100%",

                color: "#FFFFFF",

                fontFamily:
                  "Arial Black, Arial, Helvetica, sans-serif",

                /*
                 * Çok daha büyük.
                 */
                fontSize: 44,

                fontWeight: 900,

                lineHeight: 1.12,

                letterSpacing: -0.8,

                paddingTop: 8,
                paddingBottom: 10,
                boxSizing: "border-box",

                textShadow:
                  "0 5px 16px rgba(0,0,0,0.78)",

                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {safeHook}
            </div>
          </div>
        ) : null}
      </div>
    );
  };