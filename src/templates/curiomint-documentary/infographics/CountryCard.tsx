import { Img, staticFile } from "remotion";

import { CountryLocatorMap } from "../maps/CountryLocatorMap";

import { getAdaptiveCardFontSize, InfographicCardShell } from "./card-system";

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
  const nameFontSize = getAdaptiveCardFontSize({
    text: config.name,
    baseSize: 54,
    minSize: 36,
    softLimit: 24,
    shrinkPerCharacter: 0.75,
  });

  const normalizedCode = String(config.code ?? "")
    .trim()
    .toUpperCase();

  return (
    <InfographicCardShell
      size="wide"
      padding="34px 38px 30px"
      background="linear-gradient(180deg, rgba(17,21,26,0.97), rgba(10,12,16,0.98))"
      borderRadius={28}
    >
      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",

          gap: 34,

          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: 26,

            minWidth: 0,
          }}
        >
          <Img
            src={staticFile(
              `assets/Country Assets/Flag/${normalizedCode.toLowerCase()}.svg`,
            )}
            style={{
              width: 132,

              height: 88,

              flexShrink: 0,

              objectFit: "cover",

              borderRadius: 13,

              border: "1px solid rgba(255,255,255,0.14)",

              boxShadow: "0 14px 38px rgba(0,0,0,0.42)",
            }}
          />

          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: "rgba(217,183,94,0.88)",

                fontSize: 17,

                fontWeight: 800,

                letterSpacing: 3.8,

                textTransform: "uppercase",
              }}
            >
              Modern Country
            </div>

            <div
              style={{
                marginTop: 7,

                color: "white",

                fontSize: nameFontSize,

                fontWeight: 800,

                lineHeight: 1,

                letterSpacing: "-0.03em",

                overflowWrap: "anywhere",
              }}
            >
              {config.name}
            </div>

            {config.region ? (
              <div
                style={{
                  marginTop: 9,

                  color: "rgba(255,255,255,0.55)",

                  fontSize: 19,

                  fontWeight: 600,
                }}
              >
                {config.region}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,

            textAlign: "right",
          }}
        >
          <div
            style={{
              color: "#F4D675",

              fontSize: 34,

              fontWeight: 800,

              letterSpacing: 3,
            }}
          >
            {normalizedCode}
          </div>

          <div
            style={{
              marginTop: 5,

              color: "rgba(255,255,255,0.42)",

              fontSize: 13,

              fontWeight: 700,

              letterSpacing: 2,

              textTransform: "uppercase",
            }}
          >
            Country Profile
          </div>
        </div>
      </div>

      {config.capital || config.population ? (
        <div
          style={{
            display: "grid",

            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

            gap: 18,

            marginTop: 28,
          }}
        >
          {config.capital ? (
            <CountryFact label="Capital" value={config.capital} />
          ) : (
            <div />
          )}

          {config.population ? (
            <CountryFact label="Population" value={config.population} />
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 26,
        }}
      >
        <CountryLocatorMap code={normalizedCode} />
      </div>

      {config.description ? (
        <div
          style={{
            marginTop: 20,

            color: "rgba(255,255,255,0.66)",

            fontSize: 19,

            lineHeight: 1.42,

            overflowWrap: "anywhere",
          }}
        >
          {config.description}
        </div>
      ) : null}
    </InfographicCardShell>
  );
};

const CountryFact = ({ label, value }: { label: string; value: string }) => {
  const valueFontSize = getAdaptiveCardFontSize({
    text: value,
    baseSize: 30,
    minSize: 23,
    softLimit: 22,
    shrinkPerCharacter: 0.38,
  });

  return (
    <div
      style={{
        minWidth: 0,

        padding: "17px 20px",

        borderRadius: 17,

        background: "rgba(255,255,255,0.045)",

        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.42)",

          fontSize: 14,

          fontWeight: 750,

          textTransform: "uppercase",

          letterSpacing: 2.6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 7,

          color: "white",

          fontSize: valueFontSize,

          fontWeight: 750,

          lineHeight: 1.08,

          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
};
