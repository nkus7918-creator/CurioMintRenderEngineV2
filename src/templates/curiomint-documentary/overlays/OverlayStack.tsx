import {
    AbsoluteFill,
    interpolate,
    Sequence,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import { OverlayEngine } from "./OverlayEngine";
  
  type OverlayStackProps = {
    seed: string;
    chapterStartFrames?: number[];
    sectionStartFrames?: number[];
    enabled?: boolean;
  };
  
  const ChapterFlash = () => {
    const frame = useCurrentFrame();
  
    const opacity = interpolate(
      frame,
      [0, 3, 12],
      [0, 0.18, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.75) 0%, rgba(255,220,170,0.18) 35%, transparent 72%)",
        }}
      />
    );
  };
  
  const SectionSweep = () => {
    const frame = useCurrentFrame();
  
    const translateX = interpolate(
      frame,
      [0, 18],
      [-120, 120],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const opacity = interpolate(
      frame,
      [0, 5, 14, 18],
      [0, 0.14, 0.08, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity,
          transform: `translateX(${translateX}%)`,
          background:
            "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
        }}
      />
    );
  };
  
  export const OverlayStack = ({
    seed,
    chapterStartFrames = [],
    sectionStartFrames = [],
    enabled = true,
  }: OverlayStackProps) => {
    const { fps } = useVideoConfig();
  
    if (!enabled) {
      return null;
    }
  
    return (
      <>
        <OverlayEngine
          category="film effects"
          keyword="Film Grain"
          seed={`${seed}:film-grain`}
          opacity={0.12}
          blendMode="screen"
        />
  
        <OverlayEngine
          category="film effects"
          keyword="Dust"
          seed={`${seed}:dust`}
          opacity={0.08}
          blendMode="screen"
        />
  
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
  
        <Sequence
          from={0}
          durationInFrames={Math.round(fps * 1.5)}
        >
          <OverlayEngine
            category="camera"
            keyword="Focus"
            seed={`${seed}:intro-focus`}
            opacity={0.18}
            blendMode="screen"
          />
        </Sequence>
  
        {chapterStartFrames.map((fromFrame, index) => (
          <Sequence
            key={`chapter-flash-${fromFrame}-${index}`}
            from={fromFrame}
            durationInFrames={14}
          >
            <ChapterFlash />
          </Sequence>
        ))}
  
        {sectionStartFrames.map((fromFrame, index) => (
          <Sequence
            key={`section-sweep-${fromFrame}-${index}`}
            from={fromFrame}
            durationInFrames={20}
          >
            <SectionSweep />
          </Sequence>
        ))}
  
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.22) 100%)",
          }}
        />
  
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.16) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.2) 100%)",
          }}
        />
      </>
    );
  };