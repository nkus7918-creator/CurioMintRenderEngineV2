import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
export type CountryCardConfig = {
  name: string;
  code: string;
  capital?: string;
  population?: string;
  region?: string;
  description?: string;
};

type CountryCardProps = {
  config: CountryCardConfig;
};

export const CountryCard = ({ config }: CountryCardProps) => {
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
          width: 940,
          minHeight: 430,
          padding: "44px 52px",
          borderRadius: 34,
          background:
            "linear-gradient(145deg, rgba(8,9,12,0.96), rgba(28,29,34,0.9))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 34px 110px rgba(0,0,0,0.55)",
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 34,
          }}
        >
          <Img
            src={staticFile(
              `assets/Country Assets/Flag/${config.code.toLowerCase()}.svg`,
            )}
            style={{
              width: 150,
              height: 100,
              objectFit: "cover",
              borderRadius: 14,
              boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
            }}
          />

          <div>
            <div
              style={{
                color: "white",
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {config.name}
            </div>

            {config.region ? (
              <div
                style={{
                  marginTop: 16,
                  color: "#d9b75e",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                {config.region}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 48,
          }}
        >
          {config.capital ? (
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.48)",
                  fontSize: 22,
                  textTransform: "uppercase",
                  letterSpacing: 4,
                }}
              >
                Capital
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "white",
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                {config.capital}
              </div>
            </div>
          ) : null}

          {config.population ? (
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.48)",
                  fontSize: 22,
                  textTransform: "uppercase",
                  letterSpacing: 4,
                }}
              >
                Population
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "white",
                  fontSize: 34,
                  fontWeight: 700,
                }}
              >
                {config.population}
              </div>
            </div>
          ) : null}
        </div>

        {config.description ? (
          <div
            style={{
              marginTop: 42,
              color: "rgba(255,255,255,0.72)",
              fontSize: 24,
              lineHeight: 1.45,
            }}
          >
            {config.description}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
