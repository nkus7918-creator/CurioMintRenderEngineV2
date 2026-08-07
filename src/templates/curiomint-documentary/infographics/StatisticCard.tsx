import type {
  StatisticCardConfig,
} from "./types";

import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

type StatisticCardProps = {
  config: StatisticCardConfig;
};

export const StatisticCard = ({
  config,
}: StatisticCardProps) => {
  const valueFontSize =
    getAdaptiveCardFontSize({
      text:
        `${config.prefix ?? ""}${config.value}${config.suffix ?? ""}`,

      baseSize: 92,

      minSize: 58,

      softLimit: 10,

      shrinkPerCharacter:
        2.1,
    });

  return (
    <InfographicCardShell
      size="compact"
      padding="38px 46px"
    >
      <div
        style={{
          fontSize: 26,

          letterSpacing: 5,

          textTransform:
            "uppercase",

          color:
            "rgba(255,255,255,0.58)",

          marginBottom: 22,

          overflowWrap:
            "anywhere",
        }}
      >
        {config.label}
      </div>

      <div
        style={{
          display: "flex",

          alignItems:
            "baseline",

          flexWrap: "wrap",

          gap: 8,

          color: "white",

          minWidth: 0,
        }}
      >
        {config.prefix ? (
          <span
            style={{
              fontSize:
                Math.max(
                  38,
                  valueFontSize *
                    0.52,
                ),

              opacity: 0.72,
            }}
          >
            {config.prefix}
          </span>
        ) : null}

        <span
          style={{
            fontSize:
              valueFontSize,

            fontWeight: 800,

            lineHeight: 1,

            letterSpacing: -4,

            overflowWrap:
              "anywhere",
          }}
        >
          {config.value}
        </span>

        {config.suffix ? (
          <span
            style={{
              fontSize:
                Math.max(
                  34,
                  valueFontSize *
                    0.46,
                ),

              opacity: 0.72,

              overflowWrap:
                "anywhere",
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

            color:
              "rgba(255,255,255,0.74)",

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