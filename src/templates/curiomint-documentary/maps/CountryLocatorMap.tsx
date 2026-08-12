import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  COUNTRY_LOCATOR_WORLD_BASE,
  resolveCountryLocatorAsset,
} from "./countryLocatorManifest.generated";

type CountryLocatorMapProps = {
  code: string;
};

const LARGE_COUNTRY_CODES = new Set([
  "RU",
  "CA",
  "US",
  "CN",
  "BR",
  "AU",
  "IN",
  "AR",
  "KZ",
  "DZ",
  "SA",
  "MX",
  "ID",
]);

const getTargetZoom = (code: string): number => {
  if (LARGE_COUNTRY_CODES.has(code)) {
    return 1.75;
  }

  return 2.55;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const CountryLocatorMap = ({ code }: CountryLocatorMapProps) => {
  const frame = useCurrentFrame();

  const { fps } = useVideoConfig();

  const normalizedCode = String(code ?? "")
    .trim()
    .toUpperCase();

  const asset = resolveCountryLocatorAsset(normalizedCode);

  if (!asset) {
    return null;
  }

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 105,
      mass: 0.85,
    },
  });

  const overlayOpacity = interpolate(entrance, [0, 1], [0, 1]);

  const targetZoom = getTargetZoom(normalizedCode);

  const animatedZoom = interpolate(
    entrance,
    [0, 1],
    [Math.max(1, targetZoom * 0.93), targetZoom],
  );

  const centerX = clamp(asset.markerXPercent / 100, 0, 1);

  const centerY = clamp(asset.markerYPercent / 100, 0, 1);

  const layerLeft = 50 - centerX * animatedZoom * 100;

  const layerTop = 50 - centerY * animatedZoom * 100;

  const layerWidth = animatedZoom * 100;

  const layerHeight = animatedZoom * 100;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        overflow: "hidden",
        background: "#11151A",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 22px 60px rgba(0,0,0,0.38)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${layerLeft}%`,
          top: `${layerTop}%`,
          width: `${layerWidth}%`,
          height: `${layerHeight}%`,
        }}
      >
        <Img
          src={staticFile(COUNTRY_LOCATOR_WORLD_BASE)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            opacity: 0.88,
          }}
        />

        <Img
          src={staticFile(asset.file)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            opacity: overlayOpacity,
            filter: "drop-shadow(0 0 16px rgba(217,183,94,0.70))",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 20,
          top: 18,
          padding: "8px 12px",
          borderRadius: 999,
          background: "rgba(8,10,13,0.78)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.62)",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 2.4,
          textTransform: "uppercase",
        }}
      >
        Regional Context
      </div>

      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 16,
          padding: "7px 11px",
          borderRadius: 10,
          background: "rgba(8,10,13,0.74)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.42)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.2,
        }}
      >
        Natural Earth v5.1.1
      </div>
    </div>
  );
};
