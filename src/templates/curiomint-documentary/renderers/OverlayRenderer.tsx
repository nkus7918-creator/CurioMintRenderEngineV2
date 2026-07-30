import { AbsoluteFill } from "remotion";

import type { OverlayConfig } from "../overlay-engine/types";
import { resolveOverlay } from "../overlay-engine/resolveOverlay";
import { useTheme } from "../themes/ThemeContext";

type OverlayRendererProps = {
  overlay?: OverlayConfig;
};

export const OverlayRenderer = ({
  overlay,
}: OverlayRendererProps) => {
  const theme = useTheme();
  const resolvedOverlay = resolveOverlay(overlay);

  if (resolvedOverlay.preset === "none") {
    return null;
  }

  const { preset, opacity } = resolvedOverlay;

  const topGradient =
    preset === "minimal"
      ? theme.overlay.minimalTopGradient
      : preset === "history"
        ? theme.overlay.historyTopGradient
        : theme.overlay.cinematicTopGradient;

  const bottomGradient =
    preset === "minimal"
      ? theme.overlay.minimalBottomGradient
      : preset === "history"
        ? theme.overlay.historyBottomGradient
        : theme.overlay.cinematicBottomGradient;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: theme.overlay.topHeight,
          background: topGradient,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: theme.overlay.bottomHeight,
          background: bottomGradient,
        }}
      />
    </AbsoluteFill>
  );
};