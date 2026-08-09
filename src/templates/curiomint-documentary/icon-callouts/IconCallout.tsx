import React from "react";

import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  LocalIcon,
} from "./LocalIcon";

import type {
  IconCalloutCue,
  IconCalloutPlacement,
} from "./types";

interface IconCalloutProps {
  cue: IconCalloutCue;
  durationInFrames: number;
}

const getPlacementStyle = (
  placement: IconCalloutPlacement,
): React.CSSProperties => {
  const horizontalInset = 108;

  switch (placement) {
    case "top-left":
      return {
        top: 150,
        left: horizontalInset,
      };

    case "center-left":
      return {
        top: 420,
        left: horizontalInset,
      };

    case "center-right":
      return {
        top: 420,
        right: horizontalInset,
      };

    case "top-right":
    default:
      return {
        top: 150,
        right: horizontalInset,
      };
  }
};

const isLeftPlacement = (
  placement: IconCalloutPlacement,
): boolean =>
  placement === "top-left" ||
  placement === "center-left";

export const IconCallout: React.FC<
  IconCalloutProps
> = ({
  cue,
  durationInFrames,
}) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const placement =
    cue.placement ??
    "top-right";

  const enter =
    spring({
      frame,
      fps,
      config: {
        damping: 18,
        mass: 0.75,
        stiffness: 125,
      },
    });

  const fadeOutStart =
    Math.max(
      1,
      durationInFrames - 10,
    );

  const exitOpacity =
    interpolate(
      frame,
      [
        fadeOutStart,
        durationInFrames,
      ],
      [1, 0],
      {
        extrapolateLeft:
          "clamp",
        extrapolateRight:
          "clamp",
      },
    );

  const opacity =
    Math.min(
      enter,
      exitOpacity,
    );

  const direction =
    isLeftPlacement(
      placement,
    )
      ? -1
      : 1;

  const translateX =
    interpolate(
      enter,
      [0, 1],
      [
        34 * direction,
        0,
      ],
    );

  const scale =
    interpolate(
      enter,
      [0, 1],
      [0.94, 1],
    );

  const hasValue =
    Boolean(
      cue.value?.trim(),
    );

  return (
    <div
      style={{
        position:
          "absolute",
        ...getPlacementStyle(
          placement,
        ),
        width: 500,
        minHeight: 132,
        display: "flex",
        alignItems:
          "center",
        gap: 22,
        padding:
          "20px 24px",
        borderRadius: 22,
        background:
          "linear-gradient(135deg, rgba(10,10,12,0.90), rgba(18,18,22,0.76))",
        border:
          "1px solid rgba(255,255,255,0.16)",
        boxShadow:
          "0 18px 55px rgba(0,0,0,0.38)",
        color:
          "#F4F1EA",
        opacity,
        transform:
          `translateX(${translateX}px) scale(${scale})`,
        transformOrigin:
          isLeftPlacement(
            placement,
          )
            ? "left center"
            : "right center",
        overflow:
          "hidden",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 20,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexShrink: 0,
          background:
            "rgba(255,255,255,0.075)",
          border:
            "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <LocalIcon
          name={cue.icon}
          size={58}
        />
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          flexDirection:
            "column",
          gap: hasValue
            ? 4
            : 0,
        }}
      >
        {hasValue ? (
          <div
            style={{
              fontSize: 46,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing:
                "-0.035em",
              whiteSpace:
                "nowrap",
              overflow:
                "hidden",
              textOverflow:
                "ellipsis",
            }}
          >
            {cue.value}
          </div>
        ) : null}

        <div
          style={{
            fontSize: hasValue
              ? 19
              : 30,
            lineHeight:
              hasValue
                ? 1.25
                : 1.08,
            fontWeight:
              hasValue
                ? 650
                : 750,
            letterSpacing:
              hasValue
                ? "0.075em"
                : "-0.02em",
            textTransform:
              hasValue
                ? "uppercase"
                : "none",
            opacity:
              hasValue
                ? 0.78
                : 0.95,
          }}
        >
          {cue.label}
        </div>
      </div>
    </div>
  );
};