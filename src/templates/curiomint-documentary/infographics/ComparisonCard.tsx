import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

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
  const titleFontSize =
    getAdaptiveCardFontSize({
      text:
        config.title ?? "",

      baseSize: 40,

      minSize: 28,

      softLimit: 40,

      shrinkPerCharacter:
        0.4,
    });

  return (
    <InfographicCardShell
      size="wide"
      padding="42px 48px 48px"
    >
      {config.title ? (
        <div
          style={{
            marginBottom: 40,

            color: "white",

            fontSize:
              titleFontSize,

            fontWeight: 800,

            textAlign:
              "center",

            letterSpacing: -1,

            overflowWrap:
              "anywhere",
          }}
        >
          {config.title}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1fr) 1px minmax(0, 1fr)",

          gap: 44,

          alignItems:
            "stretch",

          minWidth: 0,
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
          item={
            config.right
          }
          accent="#7fb3ff"
        />
      </div>
    </InfographicCardShell>
  );
};

const ComparisonSide = ({
  item,
  accent,
}: {
  item: ComparisonItem;

  accent: string;
}) => {
  const valueFontSize =
    getAdaptiveCardFontSize({
      text: item.value,

      baseSize: 70,

      minSize: 42,

      softLimit: 12,

      shrinkPerCharacter:
        1.7,
    });

  const labelFontSize =
    getAdaptiveCardFontSize({
      text: item.label,

      baseSize: 26,

      minSize: 19,

      softLimit: 20,

      shrinkPerCharacter:
        0.35,
    });

  return (
    <div
      style={{
        padding:
          "16px 8px",

        textAlign:
          "center",

        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize:
            labelFontSize,

          fontWeight: 700,

          letterSpacing: 4,

          textTransform:
            "uppercase",

          color: accent,

          overflowWrap:
            "anywhere",
        }}
      >
        {item.label}
      </div>

      <div
        style={{
          marginTop: 22,

          color: "white",

          fontSize:
            valueFontSize,

          fontWeight: 800,

          lineHeight: 1,

          letterSpacing: -3,

          overflowWrap:
            "anywhere",
        }}
      >
        {item.value}
      </div>

      {item.description ? (
        <div
          style={{
            marginTop: 22,

            color:
              "rgba(255,255,255,0.7)",

            fontSize: 22,

            lineHeight: 1.4,

            overflowWrap:
              "anywhere",
          }}
        >
          {item.description}
        </div>
      ) : null}
    </div>
  );
};