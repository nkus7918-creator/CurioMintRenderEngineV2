import type { CSSProperties, ReactNode } from "react";

import { AbsoluteFill, useVideoConfig } from "remotion";

import { getLayoutSafeArea, resolveLayoutCanvasMetrics } from "./metrics";

import type { LayoutPlacement, LayoutPreset } from "./types";

type LayoutChildrenProps = {
  children: ReactNode;
};

const getPlacementStyle = (
  placement: LayoutPlacement,
): Pick<CSSProperties, "alignItems" | "justifyContent"> => {
  /*
   * Flex yönü varsayılan olarak row olduğu için:
   *
   * justifyContent = yatay eksen
   * alignItems = dikey eksen
   */
  const justifyContent = placement.endsWith("left")
    ? "flex-start"
    : placement.endsWith("right")
      ? "flex-end"
      : "center";

  const alignItems = placement.startsWith("top")
    ? "flex-start"
    : placement.startsWith("bottom")
      ? "flex-end"
      : "center";

  return {
    justifyContent,
    alignItems,
  };
};

type DesignCanvasProps = LayoutChildrenProps & {
  preset: LayoutPreset;

  backgroundColor?: string;
};

export const DesignCanvas = ({
  preset,
  backgroundColor = "transparent",
  children,
}: DesignCanvasProps) => {
  const { width, height } = useVideoConfig();

  const metrics = resolveLayoutCanvasMetrics(preset, width, height);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",

        backgroundColor,
      }}
    >
      <div
        style={{
          position: "absolute",

          width: preset.designWidth,

          height: preset.designHeight,

          left: metrics.offsetX,

          top: metrics.offsetY,

          overflow: "hidden",

          transform: `scale(${metrics.scale})`,

          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

type LayoutSafeAreaProps = LayoutChildrenProps & {
  preset: LayoutPreset;

  areaName: string;

  placement?: LayoutPlacement;

  style?: CSSProperties;
};

export const LayoutSafeArea = ({
  preset,
  areaName,
  placement = "center",
  style,
  children,
}: LayoutSafeAreaProps) => {
  const safeArea = getLayoutSafeArea(preset, areaName);

  return (
    <div
      style={{
        position: "absolute",

        top: safeArea.top,

        right: safeArea.right,

        bottom: safeArea.bottom,

        left: safeArea.left,

        display: "flex",

        minWidth: 0,

        minHeight: 0,

        overflow: "visible",

        pointerEvents: "none",

        ...getPlacementStyle(placement),

        ...style,
      }}
    >
      {children}
    </div>
  );
};

type LayoutGridProps = LayoutChildrenProps & {
  preset: LayoutPreset;

  style?: CSSProperties;
};

export const LayoutGrid = ({ preset, style, children }: LayoutGridProps) => {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: `repeat(${preset.columns}, minmax(0, 1fr))`,

        gridTemplateRows: "minmax(0, 1fr)",

        columnGap: preset.gutter,

        width: "100%",

        height: "100%",

        minWidth: 0,

        minHeight: 0,

        ...style,
      }}
    >
      {children}
    </div>
  );
};

type LayoutGridItemProps = LayoutChildrenProps & {
  preset: LayoutPreset;

  columnStart?: number;

  columnSpan?: number;

  placement?: LayoutPlacement;

  style?: CSSProperties;
};

export const LayoutGridItem = ({
  preset,
  columnStart = 1,
  columnSpan = preset.columns,
  placement = "center",
  style,
  children,
}: LayoutGridItemProps) => {
  const safeColumnStart = Math.max(
    1,
    Math.min(preset.columns, Math.floor(columnStart)),
  );

  const maximumSpan = preset.columns - safeColumnStart + 1;

  const safeColumnSpan = Math.max(
    1,
    Math.min(maximumSpan, Math.floor(columnSpan)),
  );

  return (
    <div
      style={{
        position: "relative",

        gridColumn: `${safeColumnStart} / span ${safeColumnSpan}`,

        gridRow: "1",

        display: "flex",

        width: "100%",

        height: "100%",

        minWidth: 0,

        minHeight: 0,

        ...getPlacementStyle(placement),

        ...style,
      }}
    >
      {children}
    </div>
  );
};

type LayoutGridAreaProps = LayoutChildrenProps & {
  preset: LayoutPreset;

  areaName: string;

  columnStart?: number;

  columnSpan?: number;

  placement?: LayoutPlacement;

  safeAreaStyle?: CSSProperties;

  itemStyle?: CSSProperties;
};

export const LayoutGridArea = ({
  preset,
  areaName,
  columnStart = 1,
  columnSpan = preset.columns,
  placement = "center",
  safeAreaStyle,
  itemStyle,
  children,
}: LayoutGridAreaProps) => {
  return (
    <LayoutSafeArea preset={preset} areaName={areaName} style={safeAreaStyle}>
      <LayoutGrid preset={preset}>
        <LayoutGridItem
          preset={preset}
          columnStart={columnStart}
          columnSpan={columnSpan}
          placement={placement}
          style={itemStyle}
        >
          {children}
        </LayoutGridItem>
      </LayoutGrid>
    </LayoutSafeArea>
  );
};
