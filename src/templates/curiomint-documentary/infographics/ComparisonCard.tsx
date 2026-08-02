import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  export type ComparisonItem = {
    label: string;
    value: string;
    description?: string;
  };
  
  export type ComparisonCardConfig = {
    title?: string;
    left: ComparisonItem;
    right: ComparisonItem;
  };
  
  type ComparisonCardProps = {
    config: ComparisonCardConfig;
  };
  
  export const ComparisonCard = ({
    config,
  }: ComparisonCardProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
  
    const entrance = spring({
      frame,
      fps,
      config: {
        damping: 18,
        stiffness: 110,
        mass: 0.9,
      },
    });
  
    const opacity = interpolate(
      frame,
      [0, 12, 78, 90],
      [0, 1, 1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const translateY = interpolate(
      entrance,
      [0, 1],
      [30, 0],
    );
  
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
            width: 1420,
            padding: "58px 66px 70px",
            borderRadius: 34,
            background:
              "linear-gradient(145deg, rgba(8,9,12,0.96), rgba(28,29,34,0.9))",
            border:
              "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 34px 110px rgba(0,0,0,0.55)",
            transform: `translateY(${translateY}px)`,
          }}
        >
          {config.title ? (
            <div
              style={{
                marginBottom: 44,
                color: "white",
                fontSize: 48,
                fontWeight: 800,
                textAlign: "center",
                letterSpacing: -1,
              }}
            >
              {config.title}
            </div>
          ) : null}
  
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              gap: 52,
              alignItems: "stretch",
            }}
          >
            <ComparisonSide
              item={config.left}
              accent="#d9b75e"
            />
  
            <div
              style={{
                width: 1,
                background:
                  "linear-gradient(to bottom, transparent, rgba(255,255,255,0.24), transparent)",
              }}
            />
  
            <ComparisonSide
              item={config.right}
              accent="#7fb3ff"
            />
          </div>
        </div>
      </AbsoluteFill>
    );
  };
  
  const ComparisonSide = ({
    item,
    accent,
  }: {
    item: ComparisonItem;
    accent: string;
  }) => {
    return (
      <div
        style={{
          padding: "18px 10px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {item.label}
        </div>
  
        <div
          style={{
            marginTop: 24,
            color: "white",
            fontSize: 86,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {item.value}
        </div>
  
        {item.description ? (
          <div
            style={{
              marginTop: 24,
              color: "rgba(255,255,255,0.7)",
              fontSize: 28,
              lineHeight: 1.4,
            }}
          >
            {item.description}
          </div>
        ) : null}
      </div>
    );
  };