import React, { useState } from "react";
import { Img, staticFile } from "remotion";

export type MascotState = "curious" | "shocked" | "asking";

type CurioMintMascotProps = {
  state: MascotState;
  size?: number;
  framed?: boolean;
};

const ASSET_BY_STATE: Record<MascotState, string> = {
  curious: "mascot/bird-curious.svg",
  shocked: "mascot/bird-shocked.svg",
  asking: "mascot/bird-asking.svg",
};

export const CurioMintMascot: React.FC<CurioMintMascotProps> = ({
  state,
  size = 110,
  framed = false,
}) => {
  const [assetFailed, setAssetFailed] = useState(false);
  const assetPath = ASSET_BY_STATE[state];

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: framed ? 32 : 0,
        overflow: "hidden",
        background: framed ? "rgba(5, 22, 18, 0.72)" : "transparent",
        border: framed ? "2px solid rgba(140, 230, 189, 0.72)" : "none",
        boxShadow: framed ? "0 10px 28px rgba(0,0,0,0.30)" : "none",
      }}
      aria-label={`CurioMint mascot: ${state}`}
    >
      {!assetFailed ? (
        <Img
          src={staticFile(assetPath)}
          onError={() => setAssetFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8CE6BD",
            fontFamily: "Arial Black, Arial, sans-serif",
            fontWeight: 900,
            fontSize: Math.max(24, size * 0.28),
            letterSpacing: 1,
          }}
        >
          CM
        </div>
      )}
    </div>
  );
};
