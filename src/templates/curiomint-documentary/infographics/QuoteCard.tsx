import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

export type QuoteCardConfig = {
  quote: string;

  author?: string;
};

type QuoteCardProps = {
  config: QuoteCardConfig;
};

export const QuoteCard = ({
  config,
}: QuoteCardProps) => {
  const quoteFontSize =
    getAdaptiveCardFontSize({
      text: config.quote,

      baseSize: 48,

      minSize: 30,

      softLimit: 90,

      shrinkPerCharacter:
        0.18,
    });

  const authorFontSize =
    getAdaptiveCardFontSize({
      text:
        config.author ?? "",

      baseSize: 28,

      minSize: 21,

      softLimit: 34,

      shrinkPerCharacter:
        0.25,
    });

  return (
    <InfographicCardShell
      size="standard"
      padding="48px 56px"
    >
      <div
        style={{
          color:
            "rgba(217,183,94,0.9)",

          fontSize: 72,

          fontFamily:
            "Georgia, serif",

          lineHeight: 0.7,

          marginBottom: 14,
        }}
      >
        “
      </div>

      <div
        style={{
          fontSize:
            quoteFontSize,

          color: "white",

          fontStyle:
            "italic",

          fontFamily:
            "Georgia, serif",

          lineHeight: 1.28,

          textAlign:
            "center",

          overflowWrap:
            "anywhere",
        }}
      >
        {config.quote}
      </div>

      {config.author ? (
        <div
          style={{
            marginTop: 38,

            textAlign:
              "right",

            fontSize:
              authorFontSize,

            color:
              "#d9b75e",

            fontWeight: 700,

            overflowWrap:
              "anywhere",
          }}
        >
          — {config.author}
        </div>
      ) : null}
    </InfographicCardShell>
  );
};