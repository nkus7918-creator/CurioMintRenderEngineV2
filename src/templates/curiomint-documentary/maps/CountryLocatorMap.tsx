import {
  interpolate,
  spring,
  Img,
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

export const CountryLocatorMap = ({
  code,
}: CountryLocatorMapProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const asset =
    resolveCountryLocatorAsset(
      code,
    );

  if (!asset) {
    return null;
  }

  const entrance =
    spring({
      frame,
      fps,
      config: {
        damping: 18,
        stiffness: 110,
        mass: 0.8,
      },
    });

  const overlayOpacity =
    interpolate(
      entrance,
      [0, 1],
      [0, 1],
    );

  const overlayScale =
    interpolate(
      entrance,
      [0, 1],
      [1.08, 1],
    );

  const pulse =
    interpolate(
      frame % 42,
      [0, 21, 42],
      [0.72, 1.18, 0.72],
      {
        extrapolateLeft:
          "clamp",
        extrapolateRight:
          "clamp",
      },
    );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 1",
        borderRadius: 20,
        overflow: "hidden",
        background:
          "#11151A",
        border:
          "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 18px 46px rgba(0,0,0,0.34)",
      }}
    >
      <Img
        src={staticFile(
          COUNTRY_LOCATOR_WORLD_BASE,
        )}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          opacity: 0.82,
        }}
      />

      <Img
        src={staticFile(
          asset.file,
        )}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          opacity:
            overlayOpacity,
          transform:
            `scale(${overlayScale})`,
          filter:
            "drop-shadow(0 0 12px rgba(217,183,94,0.72))",
        }}
      />

      <div
        style={{
          position: "absolute",
          left:
            `${asset.markerXPercent}%`,
          top:
            `${asset.markerYPercent}%`,
          width: 16,
          height: 16,
          transform:
            `translate(-50%, -50%) scale(${pulse})`,
          borderRadius:
            "50%",
          background:
            "#F4D675",
          border:
            "3px solid rgba(255,255,255,0.95)",
          boxShadow:
            "0 0 0 9px rgba(217,183,94,0.18), 0 0 24px rgba(217,183,94,0.8)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 14,
          padding:
            "7px 11px",
          borderRadius: 10,
          background:
            "rgba(8,10,13,0.78)",
          border:
            "1px solid rgba(255,255,255,0.10)",
          color:
            "rgba(255,255,255,0.74)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 2.2,
          textTransform:
            "uppercase",
        }}
      >
        Location
      </div>
    </div>
  );
};