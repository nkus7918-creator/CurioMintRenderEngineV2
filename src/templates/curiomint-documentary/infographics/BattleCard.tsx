import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  export type BattleCardConfig = {
    title: string;
    date?: string;
    location?: string;
  
    attacker: {
      name: string;
      strength?: string;
    };
  
    defender: {
      name: string;
      strength?: string;
    };
  
    result?: string;
    description?: string;
  };
  
  type BattleCardProps = {
    config: BattleCardConfig;
  };
  
  export const BattleCard = ({
    config,
  }: BattleCardProps) => {
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
  
    const scale = interpolate(
      entrance,
      [0, 1],
      [0.95, 1],
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
            width: 1120,
            padding: "44px 52px 50px",
            borderRadius: 34,
            background:
              "linear-gradient(145deg, rgba(10,8,8,0.96), rgba(32,24,22,0.92))",
            border:
              "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 34px 110px rgba(0,0,0,0.58)",
            transform: `scale(${scale})`,
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#d6aa52",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              Battle
            </div>
  
            <div
              style={{
                marginTop: 16,
                color: "white",
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -1.5,
              }}
            >
              {config.title}
            </div>
  
            {(config.date || config.location) ? (
              <div
                style={{
                  marginTop: 18,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 27,
                }}
              >
                {[config.date, config.location]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            ) : null}
          </div>
  
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 1fr",
              alignItems: "center",
              gap: 28,
              marginTop: 52,
            }}
          >
            <BattleSide
              label="Attacker"
              name={config.attacker.name}
              strength={config.attacker.strength}
              align="right"
              accent="#d45b4f"
            />
  
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 38,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              VS
            </div>
  
            <BattleSide
              label="Defender"
              name={config.defender.name}
              strength={config.defender.strength}
              align="left"
              accent="#6f9ee8"
            />
          </div>
  
          {config.result ? (
            <div
              style={{
                marginTop: 46,
                padding: "20px 28px",
                borderRadius: 18,
                textAlign: "center",
                backgroundColor:
                  "rgba(214,170,82,0.1)",
                border:
                  "1px solid rgba(214,170,82,0.28)",
              }}
            >
              <div
                style={{
                  color: "#d6aa52",
                  fontSize: 21,
                  fontWeight: 700,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                }}
              >
                Result
              </div>
  
              <div
                style={{
                  marginTop: 10,
                  color: "white",
                  fontSize:28,
                  fontWeight: 700,
                }}
              >
                {config.result}
              </div>
            </div>
          ) : null}
  
          {config.description ? (
            <div
              style={{
                marginTop: 32,
                textAlign: "center",
                color: "rgba(255,255,255,0.7)",
                fontSize:22,
                lineHeight: 1.4,
              }}
            >
              {config.description}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  };
  
  const BattleSide = ({
    label,
    name,
    strength,
    align,
    accent,
  }: {
    label: string;
    name: string;
    strength?: string;
    align: "left" | "right";
    accent: string;
  }) => {
    return (
      <div
        style={{
          textAlign: align,
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
  
        <div
          style={{
            marginTop: 14,
            color: "white",
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
  
        {strength ? (
          <div
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.58)",
              fontSize: 27,
            }}
          >
            {strength}
          </div>
        ) : null}
      </div>
    );
  };