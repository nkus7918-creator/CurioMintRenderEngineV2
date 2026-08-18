import React, { useState } from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type MascotState = "curious" | "shocked" | "asking";

type CurioMintHeaderProps = {
  headerHook?: string;
  mascotState?: MascotState;
  logoPath?: string;
  openingActive?: boolean;
};

const MASCOT_BY_STATE: Record<MascotState, string> = {
  curious: "mascot/bird-curious.svg",
  shocked: "mascot/bird-shocked.svg",
  asking: "mascot/bird-asking.svg",
};

const clampHeader = (value: string): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const capitalized =
    normalized.charAt(0).toLocaleUpperCase("en-US") + normalized.slice(1);

  return capitalized.length <= 72
    ? capitalized
    : `${capitalized.slice(0, 69).trim()}…`;
};

const BrandLogo = ({ logoPath }: { logoPath: string }) => {
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
  entrance,
}: {
  state: MascotState;
  entrance: number;
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
        transform: `translateY(${interpolate(entrance, [0, 1], [118, 78])}px) scale(${interpolate(
          entrance,
          [0, 1],
          [0.76, 1],
        )})`,
        filter: "drop-shadow(0 14px 20px rgba(0,0,0,0.42))",
      }}
    />
  );
};

export const CurioMintHeader: React.FC<CurioMintHeaderProps> = ({
  headerHook,
  mascotState,
  logoPath = "branding/curiomint-logo.png",
  openingActive = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safeHook = clampHeader(headerHook ?? "");
  const entrance = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 170, mass: 0.72 },
  });
  const hookEntrance = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.12)),
    fps,
    config: { damping: 15, stiffness: 190, mass: 0.7 },
  });
  const headerTranslateY = interpolate(entrance, [0, 1], [-90, 0]);
  const accentScale = interpolate(hookEntrance, [0, 1], [0, 1]);
  const openingGlow = openingActive
    ? 0.2 + (Math.sin(frame / 5) + 1) * 0.07
    : 0.08;
  const words = safeHook.split(/\s+/).filter(Boolean);

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
        opacity: interpolate(entrance, [0, 1], [0, 1]),
        transform: `translateY(${headerTranslateY}px)`,
        background:
          "linear-gradient(180deg, rgba(3,10,9,0.99) 0%, rgba(3,10,9,0.96) 78%, rgba(3,10,9,0.9) 100%)",
        boxShadow: openingActive
          ? `0 18px 40px rgba(140,230,189,${openingGlow})`
          : "0 14px 34px rgba(0,0,0,0.24)",
      }}
    >
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
        <BrandLogo logoPath={logoPath} />

        <div style={{ marginLeft: 24, paddingTop: 14, minWidth: 0 }}>
          <div
            style={{
              color: "#FFFFFF",
              fontFamily: "Arial Black, Arial, Helvetica, sans-serif",
              fontSize: 70,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: -2.4,
              whiteSpace: "nowrap",
              textShadow: "0 4px 14px rgba(0,0,0,0.55)",
            }}
          >
            Curio<span style={{ color: "#8CE6BD" }}>Mint</span>
          </div>
        </div>

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
          {mascotState ? (
            <MascotImage state={mascotState} entrance={entrance} />
          ) : null}
        </div>
      </div>

      {safeHook ? (
        <div
          style={{
            position: "absolute",
            left: 34,
            right: 300,
            bottom: 52,
            display: "flex",
            alignItems: "stretch",
            minWidth: 0,
            maxWidth: "calc(100% - 334px)",
            opacity: interpolate(hookEntrance, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(hookEntrance, [0, 1], [-36, 0])}px)`,
          }}
        >
          <div
            style={{
              width: 9,
              borderRadius: 999,
              background: "#8CE6BD",
              flexShrink: 0,
              marginRight: 20,
              transform: `scaleY(${accentScale})`,
              transformOrigin: "bottom center",
              boxShadow: "0 0 24px rgba(140,230,189,0.44)",
            }}
          />

          <div
            style={{
              minWidth: 0,
              width: "100%",
              color: "#FFFFFF",
              fontFamily: "Arial Black, Arial, Helvetica, sans-serif",
              fontSize: openingActive ? 46 : 44,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: -0.8,
              paddingTop: 8,
              paddingBottom: 10,
              boxSizing: "border-box",
              textShadow: "0 5px 16px rgba(0,0,0,0.78)",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              textTransform: "uppercase",
            }}
          >
            {words.map((word, index) => (
              <React.Fragment key={`${word}-${index}`}>
                <span
                  style={{
                    color:
                      openingActive && index === words.length - 1
                        ? "#FFD400"
                        : "#FFFFFF",
                  }}
                >
                  {word}
                </span>
                {index < words.length - 1 ? " " : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
