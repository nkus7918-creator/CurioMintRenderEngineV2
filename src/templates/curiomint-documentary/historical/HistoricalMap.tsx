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

  const mapScale =
    interpolate(
      entrance,
      [0, 1],
      [1.035, 1],
    );

  const overlayOpacity =
    interpolate(
      entrance,
      [0, 1],
      [0, 1],
    );

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
          transform:
            `scale(${mapScale})`,
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
            opacity: 0.78,
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

        <div
          style={{
            position:
              "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.32) 100%)",
            pointerEvents:
              "none",
          }}
        />
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