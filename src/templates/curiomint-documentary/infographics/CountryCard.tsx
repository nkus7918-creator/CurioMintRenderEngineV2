import {
  Img,
  staticFile,
} from "remotion";

import {
  CountryOutline,
} from "../maps/CountryOutline";

import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

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

export const CountryCard = ({
  config,
}: CountryCardProps) => {
  const nameFontSize =
    getAdaptiveCardFontSize({
      text: config.name,
      baseSize: 58,

      minSize: 38,

      softLimit: 22,

      shrinkPerCharacter:
        0.8,
    });

  return (
    <InfographicCardShell
      size="standard"
      padding="42px 48px"
      style={{
        position: "relative",
      }}
    >
      <CountryOutline
        code={config.code}
        style={{
          position: "absolute",
          top: 24,
          right: 26,
          width: 350,
          height: 235,
          opacity: 0.16,
          filter:
            "drop-shadow(0 18px 38px rgba(0,0,0,0.42))",
          pointerEvents:
            "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: 32,
            minWidth: 0,
          }}
        >
          <Img
            src={staticFile(
              `assets/Country Assets/Flag/${config.code.toLowerCase()}.svg`,
            )}
            style={{
              width: 150,

              height: 100,

              flexShrink: 0,

              objectFit:
                "cover",

              borderRadius: 14,

              boxShadow:
                "0 14px 40px rgba(0,0,0,0.45)",
            }}
          />
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: "white",

                fontSize:
                  nameFontSize,

                fontWeight: 800,

                lineHeight: 1,

                letterSpacing: -2,

                overflowWrap:
                  "anywhere",
              }}
            >
              {config.name}
            </div>
            {config.region ? (
              <div
                style={{
                  marginTop: 14,

                  color:
                    "#d9b75e",

                  fontSize: 24,

                  fontWeight: 700,

                  letterSpacing: 4,

                  textTransform:
                    "uppercase",

                  overflowWrap:
                    "anywhere",
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

            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",

            gap: 24,

            marginTop: 42,
          }}
        >
          {config.capital ? (
            <CountryFact
              label="Capital"
              value={
                config.capital
              }
            />
          ) : null}
          {config.population ? (
            <CountryFact
              label="Population"
              value={
                config.population
              }
            />
          ) : null}
        </div>

        {config.description ? (
          <div
            style={{
              marginTop: 36,

              color:
                "rgba(255,255,255,0.72)",

              fontSize: 23,

              lineHeight: 1.42,
              overflowWrap:
                "anywhere",
            }}
          >
            {config.description}
          </div>
        ) : null}
      </div>
    </InfographicCardShell>
  );
};

const CountryFact = ({
  label,
  value,
}: {
  label: string;

  value: string;
}) => {
  const valueFontSize =
    getAdaptiveCardFontSize({
      text: value,

      baseSize: 34,

      minSize: 25,

      softLimit: 20,

      shrinkPerCharacter:
        0.4,
    });

  return (
    <div
      style={{
        minWidth: 0,
      }}
    >
      <div
        style={{
          color:
            "rgba(255,255,255,0.48)",

          fontSize: 21,

          textTransform:
            "uppercase",

          letterSpacing: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,

          color: "white",

          fontSize:
            valueFontSize,

          fontWeight: 700,
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
};