import React from "react";

import {
  LOCAL_ICON_REGISTRY,
} from "./iconRegistry.generated";

import type {
  IconCalloutIcon,
} from "./types";

interface LocalIconProps {
  name: IconCalloutIcon;
  size?: number;
  color?: string;
}

export const LocalIcon: React.FC<
  LocalIconProps
> = ({
  name,
  size = 72,
  color = "currentColor",
}) => {
  const icon =
    LOCAL_ICON_REGISTRY[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      aria-hidden
      focusable={false}
      style={{
        display: "block",
        color,
        flexShrink: 0,
      }}
      dangerouslySetInnerHTML={{
        __html: icon.body,
      }}
    />
  );
};