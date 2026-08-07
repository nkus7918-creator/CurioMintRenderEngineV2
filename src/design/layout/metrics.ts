import type {
    LayoutCanvasMetrics,
    LayoutGridMetrics,
    LayoutInsets,
    LayoutPreset,
    LayoutSafeAreaRect,
  } from "./types";
  
  const normalizePositiveNumber = (
    value: number,
    fallback: number,
  ): number => {
    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return fallback;
    }
  
    return value;
  };
  
  export const resolveLayoutCanvasMetrics = (
    preset: LayoutPreset,
    compositionWidth: number,
    compositionHeight: number,
  ): LayoutCanvasMetrics => {
    const safeWidth =
      normalizePositiveNumber(
        compositionWidth,
        preset.designWidth,
      );
  
    const safeHeight =
      normalizePositiveNumber(
        compositionHeight,
        preset.designHeight,
      );
  
    const scale = Math.min(
      safeWidth / preset.designWidth,
      safeHeight / preset.designHeight,
    );
  
    const scaledWidth =
      preset.designWidth * scale;
  
    const scaledHeight =
      preset.designHeight * scale;
  
    return {
      scale,
  
      scaledWidth,
  
      scaledHeight,
  
      offsetX:
        (safeWidth - scaledWidth) / 2,
  
      offsetY:
        (safeHeight - scaledHeight) / 2,
    };
  };
  
  export const getLayoutSafeArea = (
    preset: LayoutPreset,
    areaName: string,
  ): LayoutInsets => {
    const safeArea =
      preset.safeAreas[areaName];
  
    if (!safeArea) {
      throw new Error(
        `Unknown safe area "${areaName}" in layout preset "${preset.name}".`,
      );
    }
  
    return safeArea;
  };
  
  export const resolveLayoutSafeAreaRect = (
    preset: LayoutPreset,
    areaName: string,
  ): LayoutSafeAreaRect => {
    const safeArea =
      getLayoutSafeArea(
        preset,
        areaName,
      );
  
    return {
      x: safeArea.left,
  
      y: safeArea.top,
  
      width: Math.max(
        0,
        preset.designWidth -
          safeArea.left -
          safeArea.right,
      ),
  
      height: Math.max(
        0,
        preset.designHeight -
          safeArea.top -
          safeArea.bottom,
      ),
    };
  };
  
  export const createLayoutGridMetrics = (
    preset: LayoutPreset,
    containerWidth: number,
  ): LayoutGridMetrics => {
    const columns = Math.max(
      1,
      Math.floor(preset.columns),
    );
  
    const gutter = Math.max(
      0,
      preset.gutter,
    );
  
    const safeContainerWidth =
      Math.max(
        0,
        containerWidth,
      );
  
    const totalGutterWidth =
      gutter * (columns - 1);
  
    const columnWidth =
      Math.max(
        0,
        (
          safeContainerWidth -
          totalGutterWidth
        ) / columns,
      );
  
    return {
      columns,
  
      gutter,
  
      containerWidth:
        safeContainerWidth,
  
      totalGutterWidth,
  
      columnWidth,
    };
  };
  
  export const getLayoutGridSpanWidth = (
    metrics: LayoutGridMetrics,
    columnSpan: number,
  ): number => {
    const safeSpan = Math.max(
      1,
      Math.min(
        metrics.columns,
        Math.floor(columnSpan),
      ),
    );
  
    return (
      metrics.columnWidth *
        safeSpan +
      metrics.gutter *
        (safeSpan - 1)
    );
  };
  
  export const getLayoutGridColumnOffset = (
    metrics: LayoutGridMetrics,
    columnStart: number,
  ): number => {
    const safeColumnStart =
      Math.max(
        1,
        Math.min(
          metrics.columns,
          Math.floor(columnStart),
        ),
      );
  
    return (
      (safeColumnStart - 1) *
      (
        metrics.columnWidth +
        metrics.gutter
      )
    );
  };