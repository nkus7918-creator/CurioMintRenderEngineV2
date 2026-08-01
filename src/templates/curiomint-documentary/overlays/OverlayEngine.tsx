import {
    AbsoluteFill,
    OffthreadVideo,
    staticFile,
  } from "remotion";
  
  import {
    overlayManifest,
    type OverlayCategory,
  } from "../../../generated/overlayManifest";
  
  import { pickDeterministicItem } from "../audio/randomSelector";
  
  type OverlayEngineProps = {
    category: OverlayCategory;
    seed: string;
    keyword?: string;
    opacity?: number;
    blendMode?: React.CSSProperties["mixBlendMode"];
  };
  
  export const OverlayEngine = ({
    category,
    seed,
    keyword,
    opacity = 0.18,
    blendMode = "screen",
  }: OverlayEngineProps) => {
    const categoryAssets = overlayManifest[category];
  
    const filteredAssets = keyword
      ? categoryAssets.filter((asset) =>
          asset
            .toLowerCase()
            .includes(keyword.toLowerCase()),
        )
      : categoryAssets;
  
    const selectedOverlay =
      pickDeterministicItem({
        items: [...filteredAssets],
        seed: `${seed}:overlay:${category}:${keyword ?? "all"}`,
      });
  
    if (!selectedOverlay) {
      return null;
    }
  
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity,
          mixBlendMode: blendMode,
        }}
      >
        <OffthreadVideo
          src={staticFile(selectedOverlay)}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    );
  };