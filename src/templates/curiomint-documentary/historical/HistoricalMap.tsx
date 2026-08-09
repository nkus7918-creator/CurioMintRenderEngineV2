import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type {
  HistoricalMapConfig,
} from "./types";

type HistoricalMapProps = {
  config: HistoricalMapConfig;
};

const clamp = (
  value: number,
  min: number,
  max: number,
): number =>
  Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );

const formatYear = (
  year: number,
): string => {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }

  if (year === 0) {
    return "1 BCE / 1 CE";
  }

  return `${year} CE`;
};

const formatArea = (
  value:
    | number
    | undefined,
): string | null => {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return null;
  }

  const area =
    Number(value);

  if (area >= 1_000_000) {
    return `${(area / 1_000_000).toFixed(1)}M kmÂ²`;
  }

  if (area >= 1_000) {
    return `${Math.round(area / 1_000)}K kmÂ²`;
  }

  return `${Math.round(area)} kmÂ²`;
};

export const HistoricalMap = ({
  config,
}: HistoricalMapProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  if (!config.mapUrl) {
    return null;
  }

  const entrance =
    spring({
      frame,
      fps,
      config: {
        damping: 18,
        stiffness: 105,
        mass: 0.85,
      },
    });

  const overlayOpacity =
    interpolate(
      entrance,
      [0, 1],
      [0, 1],
    );

  const viewport =
    config.viewport ?? {
      centerX: 0.5,
      centerY: 0.5,
      zoom: 1,
    };

  const centerX =
    clamp(
      viewport.centerX,
      0,
      1,
    );

  const centerY =
    clamp(
      viewport.centerY,
      0,
      1,
    );

  const targetZoom =
    clamp(
      viewport.zoom,
      1,
      4.6,
    );

  const animatedZoom =
    interpolate(
      entrance,
      [0, 1],
      [
        Math.max(
          1,
          targetZoom * 0.94,
        ),
        targetZoom,
      ],
    );

  /*
   * World base and historical SVG share the exact same 1200x600 projection.
   * Move/scale them as one layer so their borders stay aligned.
   */
  const layerLeft =
    50 -
    centerX *
      animatedZoom *
      100;

  const layerTop =
    50 -
    centerY *
      animatedZoom *
      100;

  const layerWidth =
    animatedZoom *
    100;

  const layerHeight =
    animatedZoom *
    100;

  const displayName =
    config.resolvedName ??
    config.entity;

  const areaLabel =
    formatArea(
      config.areaKm2,
    );

  return (
    <div
      style={{
        width: 1320,
        maxWidth: "100%",
        borderRadius: 26,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(17,21,26,0.97), rgba(10,12,16,0.98))",
        border:
          "1px solid rgba(255,255,255,0.14)",
        boxShadow:
          "0 28px 80px rgba(0,0,0,0.48)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "flex-end",
          justifyContent:
            "space-between",
          gap: 32,
          padding:
            "30px 36px 24px",
        }}
      >
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color:
                "rgba(217,183,94,0.88)",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform:
                "uppercase",
            }}
          >
            Historical Boundary
          </div>

          <div
            style={{
              marginTop: 9,
              color: "white",
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing:
                "-0.03em",
              overflowWrap:
                "anywhere",
            }}
          >
            {config.title ??
              displayName}
          </div>

          {config.subtitle ? (
            <div
              style={{
                marginTop: 9,
                color:
                  "rgba(255,255,255,0.64)",
                fontSize: 21,
                lineHeight: 1.3,
              }}
            >
              {config.subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
          }}
        >
          <div
            style={{
              color:
                "#F4D675",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing:
                "-0.02em",
            }}
          >
            {formatYear(
              config.year,
            )}
          </div>

          {areaLabel ? (
            <div
              style={{
                marginTop: 6,
                color:
                  "rgba(255,255,255,0.52)",
                fontSize: 18,
                fontWeight: 650,
              }}
            >
              {areaLabel}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position:
            "relative",
          width: "100%",
          aspectRatio: "2 / 1",
          overflow: "hidden",
          background:
            "#11151A",
        }}
      >
        <div
          style={{
            position:
              "absolute",
            left:
              `${layerLeft}%`,
            top:
              `${layerTop}%`,
            width:
              `${layerWidth}%`,
            height:
              `${layerHeight}%`,
          }}
        >
          <Img
            src={staticFile(
              "assets/Maps/Locator/world-base.svg",
            )}
            style={{
              position:
                "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit:
                "fill",
              opacity: 0.82,
            }}
          />

          <Img
            src={config.mapUrl}
            style={{
              position:
                "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit:
                "fill",
              opacity:
                overlayOpacity,
              filter:
                "drop-shadow(0 0 18px rgba(217,183,94,0.48))",
            }}
          />
        </div>

        <div
          style={{
            position:
              "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, transparent 46%, rgba(0,0,0,0.34) 100%)",
            pointerEvents:
              "none",
          }}
        />

        {targetZoom > 1.15 ? (
          <div
            style={{
              position:
                "absolute",
              right: 18,
              bottom: 16,
              padding:
                "7px 10px",
              borderRadius: 999,
              background:
                "rgba(8,10,13,0.72)",
              border:
                "1px solid rgba(255,255,255,0.10)",
              color:
                "rgba(255,255,255,0.48)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform:
                "uppercase",
            }}
          >
            Regional View
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 24,
          padding:
            "13px 24px 15px",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          color:
            "rgba(255,255,255,0.42)",
          fontSize: 13,
          letterSpacing: 0.4,
        }}
      >
        <span>
          {config.fromYear !==
            undefined &&
          config.toYear !==
            undefined
            ? `Dataset interval: ${formatYear(config.fromYear)} â€“ ${formatYear(config.toYear)}`
            : ""}
        </span>

        <span>
          {config.sourceCredit ??
            "Historical boundary data: Cliopatria / Seshat, CC BY 4.0."}
        </span>
      </div>
    </div>
  );
};