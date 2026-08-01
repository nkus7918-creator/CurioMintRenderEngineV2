import {
    AbsoluteFill,
    Img,
    staticFile,
  } from "remotion";
  
  import {
    historicalManifest,
    type HistoricalCategory,
  } from "../../../generated/historicalManifest";
  
  import { pickDeterministicItem } from "../audio/randomSelector";
  
  type HistoricalAssetProps = {
    category: HistoricalCategory;
    seed: string;
    opacity?: number;
    objectFit?: React.CSSProperties["objectFit"];
  };
  
  export const HistoricalAsset = ({
    category,
    seed,
    opacity = 1,
    objectFit = "contain",
  }: HistoricalAssetProps) => {
    const assets = historicalManifest[category];
  
    const selectedAsset = pickDeterministicItem({
      items: [...assets],
      seed: `${seed}:historical:${category}`,
    });
  
    if (!selectedAsset) {
      return null;
    }
  
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(selectedAsset)}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
          }}
        />
      </AbsoluteFill>
    );
  };