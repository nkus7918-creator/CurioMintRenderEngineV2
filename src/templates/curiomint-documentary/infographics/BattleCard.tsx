import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

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
  const titleFontSize =
    getAdaptiveCardFontSize({
      text: config.title,

      baseSize: 48,

      minSize: 34,

      softLimit: 34,

      shrinkPerCharacter:
        0.45,
    });

  return (
    <InfographicCardShell
      size="wide"
      padding="42px 48px 46px"
      background=
        "linear-gradient(145deg, rgba(10,8,8,0.96), rgba(32,24,22,0.92))"
    >
      <div
        style={{
          textAlign:
            "center",
        }}
      >
        <div
          style={{
            color:
              "#d6aa52",

            fontSize: 23,

            fontWeight: 700,

            letterSpacing: 6,

            textTransform:
              "uppercase",
          }}
        >
          Battle
        </div>

        <div
          style={{
            marginTop: 14,

            color: "white",

            fontSize:
              titleFontSize,

            fontWeight: 800,

            lineHeight: 1.05,

            letterSpacing: -1.5,

            overflowWrap:
              "anywhere",
          }}
        >
          {config.title}
        </div>

        {config.date ||
        config.location ? (
          <div
            style={{
              marginTop: 16,

              color:
                "rgba(255,255,255,0.6)",

              fontSize: 25,

              overflowWrap:
                "anywhere",
            }}
          >
            {[
              config.date,
              config.location,
            ]
              .filter(Boolean)
              .join(" • ")}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1fr) 100px minmax(0, 1fr)",

          alignItems:
            "center",

          gap: 24,

          marginTop: 44,

          minWidth: 0,
        }}
      >
        <BattleSide
          label="Attacker"
          name={
            config.attacker
              .name
          }
          strength={
            config.attacker
              .strength
          }
          align="right"
          accent="#d45b4f"
        />

        <div
          style={{
            color:
              "rgba(255,255,255,0.4)",

            fontSize: 36,

            fontWeight: 800,

            textAlign:
              "center",
          }}
        >
          VS
        </div>

        <BattleSide
          label="Defender"
          name={
            config.defender
              .name
          }
          strength={
            config.defender
              .strength
          }
          align="left"
          accent="#6f9ee8"
        />
      </div>

      {config.result ? (
        <div
          style={{
            marginTop: 40,

            padding:
              "18px 26px",

            borderRadius: 18,

            textAlign:
              "center",

            backgroundColor:
              "rgba(214,170,82,0.1)",

            border:
              "1px solid rgba(214,170,82,0.28)",
          }}
        >
          <div
            style={{
              color:
                "#d6aa52",

              fontSize: 20,

              fontWeight: 700,

              letterSpacing: 5,

              textTransform:
                "uppercase",
            }}
          >
            Result
          </div>

          <div
            style={{
              marginTop: 10,

              color: "white",

              fontSize: 27,

              fontWeight: 700,

              overflowWrap:
                "anywhere",
            }}
          >
            {config.result}
          </div>
        </div>
      ) : null}

      {config.description ? (
        <div
          style={{
            marginTop: 28,

            textAlign:
              "center",

            color:
              "rgba(255,255,255,0.7)",

            fontSize: 21,

            lineHeight: 1.4,

            overflowWrap:
              "anywhere",
          }}
        >
          {config.description}
        </div>
      ) : null}
    </InfographicCardShell>
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
  const nameFontSize =
    getAdaptiveCardFontSize({
      text: name,

      baseSize: 34,

      minSize: 23,

      softLimit: 24,

      shrinkPerCharacter:
        0.45,
    });

  return (
    <div
      style={{
        textAlign: align,

        minWidth: 0,
      }}
    >
      <div
        style={{
          color: accent,

          fontSize: 22,

          fontWeight: 700,

          letterSpacing: 5,

          textTransform:
            "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 12,

          color: "white",

          fontSize:
            nameFontSize,

          fontWeight: 800,

          lineHeight: 1.1,

          overflowWrap:
            "anywhere",
        }}
      >
        {name}
      </div>

      {strength ? (
        <div
          style={{
            marginTop: 10,

            color:
              "rgba(255,255,255,0.58)",

            fontSize: 25,

            overflowWrap:
              "anywhere",
          }}
        >
          {strength}
        </div>
      ) : null}
    </div>
  );
};