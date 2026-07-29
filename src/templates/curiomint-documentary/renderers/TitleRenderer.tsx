import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import { useTheme } from "../themes/ThemeContext";
  
  type TitleRendererProps = {
    title: string;
  };
  
  export const TitleRenderer = ({
    title,
  }: TitleRendererProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = useTheme();
  
    const opacity = interpolate(
      frame,
      [0, fps * 0.5],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const translateY = interpolate(
      frame,
      [0, fps * 0.5],
      [40, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 90,
          paddingLeft: 120,
          paddingRight: 120,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            textAlign: "center",
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.titleFontSize,
            fontWeight: theme.typography.fontWeight,
            lineHeight: 1.1,
            opacity,
            transform: `translateY(${translateY}px)`,
            textShadow: "0 4px 20px rgba(0, 0, 0, 0.55)",
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    );
  };