import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type PersonCardConfig = {
  name: string;
  subtitle?: string;
  imageUrl: string;
  birth?: string;
  death?: string;
  description?: string;
};

type PersonCardProps = {
  config: PersonCardConfig;
};

export const PersonCard = ({ config }: PersonCardProps) => {
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

  const opacity = interpolate(frame, [0, 12, 78, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrance, [0, 1], [28, 0]);

  const scale = interpolate(entrance, [0, 1], [0.95, 1]);

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
          width: 980,
          minHeight: 470,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          overflow: "hidden",
          borderRadius: 34,
          background:
            "linear-gradient(145deg, rgba(8,9,12,0.96), rgba(28,29,34,0.9))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 34px 110px rgba(0,0,0,0.55)",
          transform: `
              translateY(${translateY}px)
              scale(${scale})
            `,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#111318",
          }}
        >
          <Img
            src={config.imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.82) saturate(0.84) contrast(1.08)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, transparent 55%, rgba(8,9,12,0.92) 100%)",
            }}
          />
        </div>

        <div
          style={{
            padding: "48px 52px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {config.subtitle ? (
            <div
              style={{
                marginBottom: 18,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#d9b75e",
              }}
            >
              {config.subtitle}
            </div>
          ) : null}

          <div
            style={{
              color: "white",
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            {config.name}
          </div>

          {config.birth || config.death ? (
            <div
              style={{
                display: "flex",
                gap: 26,
                marginTop: 30,
                color: "rgba(255,255,255,0.68)",
                fontSize: 28,
              }}
            >
              {config.birth ? <span>Born {config.birth}</span> : null}

              {config.death ? <span>Died {config.death}</span> : null}
            </div>
          ) : null}

          {config.description ? (
            <div
              style={{
                marginTop: 34,
                maxWidth: 590,
                fontSize: 24,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.76)",
              }}
            >
              {config.description}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
