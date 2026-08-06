import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TimelineEvent = {
  year: string;
  title: string;
};

export type TimelineCardConfig = {
  title?: string;
  activeIndex?: number;
  events: TimelineEvent[];
};

type TimelineCardProps = {
  config: TimelineCardConfig;
};

export const TimelineCard = ({ config }: TimelineCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const events = config.events ?? [];
  const activeIndex = Math.min(
    Math.max(config.activeIndex ?? events.length - 1, 0),
    Math.max(0, events.length - 1),
  );

  if (events.length === 0) {
    return null;
  }

  const containerProgress = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 100,
      mass: 0.9,
    },
  });

  const opacity = interpolate(frame, [0, 12, 78, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        opacity,
      }}
    >
      <div
        style={{
          width: 1120,
          padding: "40px 48px 48px",
          borderRadius: 32,
          background:
            "linear-gradient(145deg, rgba(8,9,12,0.94), rgba(24,25,30,0.88))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 100px rgba(0,0,0,0.5)",
          transform: `scale(${interpolate(
            containerProgress,
            [0, 1],
            [0.96, 1],
          )})`,
        }}
      >
        {config.title ? (
          <div
            style={{
              color: "white",
              fontSize: 40,
              fontWeight: 800,
              marginBottom: 62,
              letterSpacing: -1,
            }}
          >
            {config.title}
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${events.length}, 1fr)`,
            alignItems: "start",
            gap: 24,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 29,
              left: "3%",
              right: "3%",
              height: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.16)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 29,
              left: "3%",
              width:
                events.length <= 1
                  ? "0%"
                  : `${(activeIndex / (events.length - 1)) * 94}%`,
              height: 4,
              borderRadius: 999,
              background: "linear-gradient(90deg, #d8a938, #f2d374)",
            }}
          />

          {events.map((event, index) => {
            const delay = index * 7;

            const itemProgress = spring({
              frame: frame - delay,
              fps,
              config: {
                damping: 16,
                stiffness: 140,
                mass: 0.8,
              },
            });

            const isActive = index === activeIndex;
            const isCompleted = index <= activeIndex;

            return (
              <div
                key={`${event.year}-${index}`}
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  opacity: itemProgress,
                  transform: `translateY(${interpolate(
                    itemProgress,
                    [0, 1],
                    [20, 0],
                  )}px)`,
                }}
              >
                <div
                  style={{
                    width: isActive ? 58 : 48,
                    height: isActive ? 58 : 48,
                    borderRadius: "50%",
                    backgroundColor: isCompleted ? "#e1b84f" : "#2d3038",
                    border: isActive
                      ? "6px solid rgba(255,255,255,0.95)"
                      : "4px solid rgba(255,255,255,0.38)",
                    boxShadow: isActive
                      ? "0 0 0 12px rgba(225,184,79,0.16), 0 12px 34px rgba(0,0,0,0.45)"
                      : "0 8px 20px rgba(0,0,0,0.35)",
                  }}
                />

                <div
                  style={{
                    marginTop: 26,
                    fontSize: isActive ? 28 : 30,
                    fontWeight: 800,
                    color: isCompleted ? "#f0cf75" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {event.year}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    maxWidth: 180,
                    fontSize: isActive ? 22 : 24,
                    lineHeight: 1.25,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "white" : "rgba(255,255,255,0.66)",
                  }}
                >
                  {event.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
