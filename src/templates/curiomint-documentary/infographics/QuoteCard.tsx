import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
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
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
  
    const progress = spring({
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
            width: 1180,
            padding: "72px 90px",
            borderRadius: 34,
            background:
              "linear-gradient(145deg, rgba(10,10,14,.95), rgba(28,28,34,.88))",
            border: "1px solid rgba(255,255,255,.12)",
            boxShadow:
              "0 30px 100px rgba(0,0,0,.5)",
            transform: `scale(${interpolate(
              progress,
              [0, 1],
              [0.96, 1],
            )})`,
          }}
        >
          <div
            style={{
              fontSize: 62,
              color: "white",
              fontStyle: "italic",
              lineHeight: 1.28,
              textAlign: "center",
            }}
          >
            “{config.quote}”
          </div>
  
          {config.author ? (
            <div
              style={{
                marginTop: 42,
                textAlign: "right",
                fontSize: 34,
                color: "#d9b75e",
                fontWeight: 700,
              }}
            >
              — {config.author}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  };