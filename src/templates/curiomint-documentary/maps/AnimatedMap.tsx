import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import type {
    AnimatedMapConfig,
    MapMarker,
  } from "./types";
  
  type AnimatedMapProps = {
    config: AnimatedMapConfig;
  };
  
  const getMapPath = (
    mapStyle: AnimatedMapConfig["mapStyle"],
  ) => {
    switch (mapStyle) {
      case "blank":
        return "assets/Maps/World/Blank World Map.webp";
  
      case "relief":
        return "assets/Maps/World/Relief World.webp";
  
      case "political":
      default:
        return "assets/Maps/World/Political World Map.webp";
    }
  };
  
  const Marker = ({
    marker,
    index,
  }: {
    marker: MapMarker;
    index: number;
  }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
  
    const delay = 18 + index * 8;
  
    const progress = spring({
      frame: frame - delay,
      fps,
      config: {
        damping: 14,
        stiffness: 140,
        mass: 0.8,
      },
    });
  
    const pulse = interpolate(
      frame % 36,
      [0, 18, 36],
      [0.75, 1.15, 0.75],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <div
        style={{
          position: "absolute",
          left: `${marker.x}%`,
          top: `${marker.y}%`,
          transform: `
            translate(-50%, -50%)
            scale(${progress})
          `,
          opacity: progress,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: "#f2c14e",
            border: "5px solid rgba(255,255,255,0.92)",
            boxShadow:
              "0 0 0 10px rgba(242,193,78,0.16), 0 8px 28px rgba(0,0,0,0.45)",
            transform: `scale(${pulse})`,
          }}
        />
  
        <div
          style={{
            marginTop: 16,
            padding: "10px 18px",
            borderRadius: 12,
            color: "white",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
            backgroundColor: "rgba(8,8,10,0.82)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          }}
        >
          {marker.label}
        </div>
      </div>
    );
  };
  
  export const AnimatedMap = ({
    config,
  }: AnimatedMapProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
  
    const entrance = spring({
      frame,
      fps,
      config: {
        damping: 18,
        stiffness: 90,
        mass: 1,
      },
    });
  
    const mapScale = interpolate(
      entrance,
      [0, 1],
      [1.08, 1],
    );
  
    const mapOpacity = interpolate(
      frame,
      [0, 14],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const titleTranslateY = interpolate(
      frame,
      [4, 24],
      [26, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const titleOpacity = interpolate(
      frame,
      [4, 20],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#08090b",
          overflow: "hidden",
        }}
      >
        <AbsoluteFill
          style={{
            opacity: mapOpacity,
            transform: `scale(${mapScale})`,
          }}
        >
          <Img
            src={staticFile(
              getMapPath(config.mapStyle),
            )}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter:
                "brightness(0.58) saturate(0.72) contrast(1.12)",
            }}
          />
        </AbsoluteFill>
  
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,6,8,0.82) 0%, transparent 32%, transparent 70%, rgba(5,6,8,0.72) 100%)",
          }}
        />
  
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.42) 100%)",
          }}
        />
  
        {config.markers.map((marker, index) => (
          <Marker
            key={marker.id}
            marker={marker}
            index={index}
          />
        ))}
  
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 90,
            right: 90,
            zIndex: 4,
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
          }}
        >
          {config.title ? (
            <div
              style={{
                color: "white",
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -1.5,
              }}
            >
              {config.title}
            </div>
          ) : null}
  
          {config.subtitle ? (
            <div
              style={{
                marginTop: 14,
                color: "rgba(255,255,255,0.68)",
                fontSize: 28,
                lineHeight: 1.3,
              }}
            >
              {config.subtitle}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  };