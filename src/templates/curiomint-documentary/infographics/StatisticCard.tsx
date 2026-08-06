import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import type { StatisticCardConfig } from "./types";

type StatisticCardProps = {
  config: StatisticCardConfig;
};

export const StatisticCard = ({ config }: StatisticCardProps) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12, 70, 84], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 18], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(frame, [0, 18], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        opacity,
      }}
    >
      <div
        style={{
          width: 680,
          padding: "38px 46px",
          borderRadius: 28,
          background:
            "linear-gradient(145deg, rgba(10,10,12,0.9), rgba(24,24,28,0.82))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 28px 90px rgba(0,0,0,0.48)",
          backdropFilter: "blur(18px)",
          transform: `
              translateY(${translateY}px)
              scale(${scale})
            `,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.58)",
            marginBottom: 22,
          }}
        >
          {config.label}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            color: "white",
          }}
        >
          {config.prefix ? (
            <span
              style={{
                fontSize: 48,
                opacity: 0.72,
              }}
            >
              {config.prefix}
            </span>
          ) : null}

          <span
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {config.value}
          </span>

          {config.suffix ? (
            <span
              style={{
                fontSize: 42,
                opacity: 0.72,
              }}
            >
              {config.suffix}
            </span>
          ) : null}
        </div>

        {config.description ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 24,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.74)",
            }}
          >
            {config.description}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
