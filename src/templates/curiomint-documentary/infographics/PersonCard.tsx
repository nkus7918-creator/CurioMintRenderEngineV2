import {
  Img,
} from "remotion";

import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

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

export const PersonCard = ({
  config,
}: PersonCardProps) => {
  const nameFontSize =
    getAdaptiveCardFontSize({
      text: config.name,

      baseSize: 58,

      minSize: 38,

      softLimit: 24,

      shrinkPerCharacter:
        0.75,
    });

  return (
    <InfographicCardShell
      size="wide"
      padding="0"
      borderRadius={34}
      style={{
        minHeight: 470,
      }}
    >
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(280px, 340px) minmax(0, 1fr)",

          width: "100%",

          minHeight: 470,

          minWidth: 0,
        }}
      >
        <div
          style={{
            position: "relative",

            overflow: "hidden",

            backgroundColor:
              "#111318",

            minWidth: 0,
          }}
        >
          <Img
            src={
              config.imageUrl
            }
            style={{
              position:
                "absolute",

              inset: 0,

              width: "100%",

              height: "100%",

              objectFit:
                "cover",

              filter:
                "brightness(0.82) saturate(0.84) contrast(1.08)",
            }}
          />

          <div
            style={{
              position:
                "absolute",

              inset: 0,

              background:
                "linear-gradient(to right, transparent 48%, rgba(8,9,12,0.94) 100%)",
            }}
          />
        </div>

        <div
          style={{
            padding:
              "44px 48px",

            display: "flex",

            flexDirection:
              "column",

            justifyContent:
              "center",

            minWidth: 0,
          }}
        >
          {config.subtitle ? (
            <div
              style={{
                marginBottom: 18,

                fontSize: 23,

                fontWeight: 600,

                letterSpacing: 5,

                textTransform:
                  "uppercase",

                color:
                  "#d9b75e",

                overflowWrap:
                  "anywhere",
              }}
            >
              {config.subtitle}
            </div>
          ) : null}

          <div
            style={{
              color: "white",

              fontSize:
                nameFontSize,

              fontWeight: 800,

              lineHeight: 1.02,

              letterSpacing: -2,

              overflowWrap:
                "anywhere",
            }}
          >
            {config.name}
          </div>

          {config.birth ||
          config.death ? (
            <div
              style={{
                display: "flex",

                flexWrap: "wrap",

                gap:
                  "10px 26px",

                marginTop: 28,

                color:
                  "rgba(255,255,255,0.68)",

                fontSize: 25,
              }}
            >
              {config.birth ? (
                <span>
                  Born{" "}
                  {config.birth}
                </span>
              ) : null}

              {config.death ? (
                <span>
                  Died{" "}
                  {config.death}
                </span>
              ) : null}
            </div>
          ) : null}

          {config.description ? (
            <div
              style={{
                marginTop: 30,

                maxWidth: 690,

                fontSize: 23,

                lineHeight: 1.42,

                color:
                  "rgba(255,255,255,0.76)",

                overflowWrap:
                  "anywhere",
              }}
            >
              {config.description}
            </div>
          ) : null}
        </div>
      </div>
    </InfographicCardShell>
  );
};