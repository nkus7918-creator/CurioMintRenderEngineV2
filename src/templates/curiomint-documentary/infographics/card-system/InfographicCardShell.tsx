import type {
    CSSProperties,
    ReactNode,
  } from "react";
  
  import {
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  export type InfographicCardSize =
    | "compact"
    | "standard"
    | "wide"
    | "full";
  
  type Props = {
    children: ReactNode;
  
    size?: InfographicCardSize;
  
    padding?: string;
  
    background?: string;
  
    borderRadius?: number;
  
    style?: CSSProperties;
  };
  
  const CARD_MAX_WIDTH: Record<
    InfographicCardSize,
    number
  > = {
    compact: 760,
  
    standard: 1040,
  
    wide: 1280,
  
    full: 1436,
  };
  
  export const InfographicCardShell = ({
    children,
    size = "standard",
    padding = "42px 50px",
    background =
      "linear-gradient(145deg, rgba(8, 9, 12, 0.95), rgba(26, 27, 32, 0.9))",
    borderRadius = 32,
    style,
  }: Props) => {
    const frame =
      useCurrentFrame();
  
    const { fps } =
      useVideoConfig();
  
    const entrance =
      spring({
        frame,
  
        fps,
  
        config: {
          damping: 18,
  
          stiffness: 110,
  
          mass: 0.9,
        },
      });
  
    const translateY =
      interpolate(
        entrance,
        [0, 1],
        [24, 0],
      );
  
    const scale =
      interpolate(
        entrance,
        [0, 1],
        [0.97, 1],
      );
  
    return (
      <div
        style={{
          width: "100%",
  
          maxWidth:
            CARD_MAX_WIDTH[size],
  
          boxSizing:
            "border-box",
  
          minWidth: 0,
  
          padding,
  
          borderRadius,
  
          background,
  
          border:
            "1px solid rgba(255, 255, 255, 0.12)",
  
          boxShadow:
            "0 30px 100px rgba(0, 0, 0, 0.5)",
  
          backdropFilter:
            "blur(18px)",
  
          overflow: "hidden",
  
          pointerEvents: "none",
  
          transform:
            `translateY(${translateY}px) scale(${scale})`,
  
          transformOrigin:
            "center center",
  
          ...style,
        }}
      >
        {children}
      </div>
    );
  };