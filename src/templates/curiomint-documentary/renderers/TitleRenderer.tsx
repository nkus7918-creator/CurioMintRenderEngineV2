import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { useTheme } from "../themes/ThemeContext";

import { resolveTitleAnimation } from "../title-animation/resolveTitleAnimation";
import { getTitleAnimationStyle } from "../title-animation/getTitleAnimationStyle";

import type { TitleAnimationConfig } from "../title-animation/types";

type TitleRendererProps = {
  title: string;
  animation?: TitleAnimationConfig;
};

export const TitleRenderer = ({ title, animation }: TitleRendererProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();

  const resolvedAnimation = resolveTitleAnimation(animation);

  const animationStyle = getTitleAnimationStyle({
    frame,
    fps,
    animation: resolvedAnimation,
  });

  const fadeInEnd = Math.round(fps * 0.35);

  const fadeOutStart = Math.round(fps * 2.8);

  const fadeOutEnd = Math.round(fps * 3.8);

  const visibilityOpacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const translateY = interpolate(frame, [0, fadeInEnd], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (!title.trim() || frame >= fadeOutEnd) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 56,
        paddingLeft: 180,
        paddingRight: 180,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 250,
          background: [
            "linear-gradient(",
            "180deg,",
            "rgba(0, 0, 0, 0.82) 0%,",
            "rgba(0, 0, 0, 0.62) 28%,",
            "rgba(0, 0, 0, 0.30) 62%,",
            "rgba(0, 0, 0, 0) 100%",
            ")",
          ].join(" "),
          opacity: visibilityOpacity,
        }}
      />

      <div
        style={{
          maxWidth: 1180,
          padding: "8px 20px",
          textAlign: "center",
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily,
          fontSize: Math.min(theme.typography.titleFontSize, 44),
          fontWeight: 650,
          lineHeight: 1.12,
          letterSpacing: -0.4,
          textShadow: "0 3px 18px rgba(0, 0, 0, 0.9)",

          ...animationStyle,

          opacity: visibilityOpacity * Number(animationStyle.opacity ?? 1),

          transform: [animationStyle.transform, `translateY(${translateY}px)`]
            .filter(Boolean)
            .join(" "),
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
