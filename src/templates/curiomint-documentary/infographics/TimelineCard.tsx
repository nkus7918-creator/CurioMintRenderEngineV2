import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  getAdaptiveCardFontSize,
  InfographicCardShell,
} from "./card-system";

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

export const TimelineCard = ({
  config,
}: TimelineCardProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const events =
    config.events ?? [];

  if (events.length === 0) {
    return null;
  }

  const activeIndex =
    Math.min(
      Math.max(
        config.activeIndex ??
          events.length - 1,
        0,
      ),

      events.length - 1,
    );

  const compact =
    events.length >= 6;

  const titleFontSize =
    getAdaptiveCardFontSize({
      text:
        config.title ?? "",

      baseSize: 40,

      minSize: 28,

      softLimit: 38,

      shrinkPerCharacter:
        0.4,
    });

  return (
    <InfographicCardShell
      size="wide"
      padding="40px 44px 46px"
    >
      {config.title ? (
        <div
          style={{
            color: "white",

            fontSize:
              titleFontSize,

            fontWeight: 800,

            marginBottom:
              compact
                ? 48
                : 62,

            letterSpacing: -1,

            overflowWrap:
              "anywhere",
          }}
        >
          {config.title}
        </div>
      ) : null}

      <div
        style={{
          position: "relative",

          display: "grid",

          gridTemplateColumns:
            `repeat(${events.length}, minmax(0, 1fr))`,

          alignItems: "start",

          gap:
            compact
              ? 14
              : 24,

          minWidth: 0,
        }}
      >
        <div
          style={{
            position: "absolute",

            top:
              compact
                ? 25
                : 29,

            left: "3%",

            right: "3%",

            height: 4,

            borderRadius: 999,

            backgroundColor:
              "rgba(255,255,255,0.16)",
          }}
        />

        <div
          style={{
            position: "absolute",

            top:
              compact
                ? 25
                : 29,

            left: "3%",

            width:
              events.length <= 1
                ? "0%"
                : `${
                    (
                      activeIndex /
                      (
                        events.length -
                        1
                      )
                    ) * 94
                  }%`,

            height: 4,

            borderRadius: 999,

            background:
              "linear-gradient(90deg, #d8a938, #f2d374)",
          }}
        />

        {events.map(
          (
            event,
            index,
          ) => {
            const delay =
              index * 7;

            const itemProgress =
              spring({
                frame:
                  Math.max(
                    0,
                    frame -
                      delay,
                  ),

                fps,

                config: {
                  damping: 16,

                  stiffness:
                    140,

                  mass: 0.8,
                },
              });

            const isActive =
              index ===
              activeIndex;

            const isCompleted =
              index <=
              activeIndex;

            const nodeSize =
              compact
                ? isActive
                  ? 50
                  : 42
                : isActive
                  ? 58
                  : 48;

            const eventTitleFontSize =
              getAdaptiveCardFontSize({
                text:
                  event.title,

                baseSize:
                  compact
                    ? 20
                    : 24,

                minSize: 16,

                softLimit: 22,

                shrinkPerCharacter:
                  0.25,
              });

            return (
              <div
                key={
                  `${event.year}-${index}`
                }
                style={{
                  position:
                    "relative",

                  zIndex: 2,

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  textAlign:
                    "center",

                  minWidth: 0,

                  opacity:
                    itemProgress,

                  transform:
                    `translateY(${interpolate(
                      itemProgress,

                      [0, 1],

                      [20, 0],
                    )}px)`,
                }}
              >
                <div
                  style={{
                    width:
                      nodeSize,

                    height:
                      nodeSize,

                    flexShrink: 0,

                    borderRadius:
                      "50%",

                    backgroundColor:
                      isCompleted
                        ? "#e1b84f"
                        : "#2d3038",

                    border:
                      isActive
                        ? "6px solid rgba(255,255,255,0.95)"
                        : "4px solid rgba(255,255,255,0.38)",

                    boxShadow:
                      isActive
                        ? "0 0 0 10px rgba(225,184,79,0.16), 0 12px 34px rgba(0,0,0,0.45)"
                        : "0 8px 20px rgba(0,0,0,0.35)",
                  }}
                />

                <div
                  style={{
                    marginTop:
                      compact
                        ? 20
                        : 26,

                    fontSize:
                      compact
                        ? 24
                        : isActive
                          ? 28
                          : 30,

                    fontWeight:
                      800,

                    color:
                      isCompleted
                        ? "#f0cf75"
                        : "rgba(255,255,255,0.6)",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {event.year}
                </div>

                <div
                  style={{
                    marginTop: 10,

                    width: "100%",

                    maxWidth:
                      compact
                        ? 150
                        : 180,

                    fontSize:
                      eventTitleFontSize,

                    lineHeight: 1.25,

                    fontWeight:
                      isActive
                        ? 700
                        : 500,

                    color:
                      isActive
                        ? "white"
                        : "rgba(255,255,255,0.66)",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {event.title}
                </div>
              </div>
            );
          },
        )}
      </div>
    </InfographicCardShell>
  );
};