import {
    AbsoluteFill,
    Sequence,
    useVideoConfig,
  } from "remotion";
  
  import { OverlayEngine } from "./OverlayEngine";
  
  type OverlayStackProps = {
    seed: string;
    enabled?: boolean;
  };
  
  export const OverlayStack = ({
    seed,
    enabled = true,
  }: OverlayStackProps) => {
    const { fps } = useVideoConfig();
  
    if (!enabled) {
      return null;
    }
  
    return (
      <>
        {/* Sürekli film dokusu */}
        <OverlayEngine
          category="film effects"
          keyword="Film Grain"
          seed={`${seed}:film-grain`}
          opacity={0.12}
          blendMode="screen"
        />
  
        {/* Sürekli hafif toz parçacıkları */}
        <OverlayEngine
          category="film effects"
          keyword="Dust"
          seed={`${seed}:dust`}
          opacity={0.08}
          blendMode="screen"
        />
  
        {/* Yalnızca girişte kısa light leak */}
        <Sequence
          from={0}
          durationInFrames={Math.round(fps * 2.5)}
        >
          <OverlayEngine
            category="film effects"
            keyword="Light Leak"
            seed={`${seed}:light-leak`}
            opacity={0.16}
            blendMode="screen"
          />
        </Sequence>
  
        {/* Render maliyeti çok düşük sinematik vignette */}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.22) 100%)",
          }}
        />
  
        {/* Üst ve alt kenarlara hafif karartma */}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 0.16) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.2) 100%)",
          }}
        />
      </>
    );
  };