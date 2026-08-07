import type {
  CSSProperties,
} from "react";

import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  DOCUMENTARY_LAYOUT_PRESET,
  LayoutGridArea,
} from "../../../design";

import {
  createSubtitleChunks,
  findActiveSubtitleChunk,
  splitSubtitleChunkIntoLines,
} from "../subtitle-engine/chunkSubtitleWords";

import {
  resolveSubtitleConfig,
} from "../subtitle-engine/resolveSubtitleConfig";

import type {
  SubtitleConfig,
} from "../subtitle-engine/types";

import {
  useTheme,
} from "../themes/ThemeContext";

import type {
  SubtitleWord,
} from "../types";

type SubtitleRendererProps = {
  text?: string;

  subtitleWords?: SubtitleWord[];

  config?: SubtitleConfig;
};

const createFallbackWords = (
  text: string,
  maxWords: number,
): SubtitleWord[] =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(
      0,
      maxWords,
    )
    .map(
      (word, index) => ({
        word,

        start: index,

        end: index + 1,
      }),
    );

const getPresetStyle = (
  preset:
    | "classic"
    | "cinematic"
    | "youtube"
    | "minimal",
): CSSProperties => {
  switch (preset) {
    case "classic":
      return {
        backgroundColor:
          "rgba(0, 0, 0, 0.76)",

        borderRadius: 10,

        padding:
          "12px 22px",
      };

    case "youtube":
      return {
        backgroundColor:
          "rgba(0, 0, 0, 0.82)",

        borderRadius: 8,

        padding:
          "12px 20px",
      };

    case "minimal":
      return {
        backgroundColor:
          "rgba(0, 0, 0, 0.42)",

        borderRadius: 10,

        padding:
          "10px 18px",
      };

    case "cinematic":
    default:
      return {
        background:
          "linear-gradient(180deg, rgba(8, 8, 10, 0.72), rgba(3, 3, 5, 0.84))",

        borderRadius: 16,

        padding:
          "14px 24px",

        boxShadow:
          "0 10px 35px rgba(0, 0, 0, 0.28)",
      };
  }
};

export const SubtitleRenderer = ({
  text,
  subtitleWords,
  config,
}: SubtitleRendererProps) => {
  const frame =
    useCurrentFrame();

  const { fps } =
    useVideoConfig();

  const theme =
    useTheme();

  const resolvedConfig =
    resolveSubtitleConfig(
      config,
    );

  const currentTime =
    frame / fps;

  const chunks =
    subtitleWords &&
    subtitleWords.length > 0
      ? createSubtitleChunks(
          subtitleWords,
          resolvedConfig,
        )
      : [];

  const activeChunk =
    findActiveSubtitleChunk(
      chunks,
      currentTime,
      resolvedConfig,
    );

  /*
   * Word-level timing yoksa
   * narration paragrafının tamamını
   * basmıyoruz.
   *
   * İlk subtitle chunk kadar kısa
   * fallback gösteriyoruz.
   */
  if (!activeChunk) {
    if (
      subtitleWords &&
      subtitleWords.length > 0
    ) {
      return null;
    }

    if (!text?.trim()) {
      return null;
    }

    const fallbackWords =
      createFallbackWords(
        text,
        resolvedConfig
          .maxWordsPerChunk,
      );

    const fallbackLines =
      splitSubtitleChunkIntoLines(
        fallbackWords,
        resolvedConfig.maxLines,
      );

    return (
      <LayoutGridArea
        preset={
          DOCUMENTARY_LAYOUT_PRESET
        }
        areaName="subtitle"
        columnStart={2}
        columnSpan={10}
        placement="bottom-center"
      >
        <div
          style={{
            maxWidth: 1480,

            minWidth: 360,

            color:
              theme.colors
                .textPrimary,

            fontFamily:
              theme.typography
                .fontFamily,

            fontSize:
              Math.min(
                theme.typography
                  .subtitleFontSize,
                42,
              ),

            fontWeight: 600,

            lineHeight: 1.18,

            textAlign:
              "center",

            textShadow:
              "0 3px 14px rgba(0, 0, 0, 0.95)",

            ...getPresetStyle(
              resolvedConfig.preset,
            ),
          }}
        >
          {fallbackLines.map(
            (
              line,
              lineIndex,
            ) => (
              <div
                key={
                  `fallback-${lineIndex}`
                }
                style={{
                  whiteSpace:
                    "nowrap",
                }}
              >
                {line
                  .map(
                    (word) =>
                      word.word,
                  )
                  .join(" ")}
              </div>
            ),
          )}
        </div>
      </LayoutGridArea>
    );
  }

  const lines =
    splitSubtitleChunkIntoLines(
      activeChunk.words,
      resolvedConfig.maxLines,
    );

  const visibleStart =
    activeChunk.start -
    resolvedConfig.leadInSeconds;

  const visibleEnd =
    activeChunk.end +
    resolvedConfig.holdSeconds;

  const fadeInDuration =
    Math.max(
      0.08,
      resolvedConfig
        .leadInSeconds,
    );

  const fadeOutDuration =
    Math.min(
      0.18,
      Math.max(
        0.08,
        resolvedConfig
          .holdSeconds,
      ),
    );

  const animatedOpacity =
    interpolate(
      currentTime,
      [
        visibleStart,

        Math.min(
          activeChunk.start,
          visibleStart +
            fadeInDuration,
        ),

        Math.max(
          activeChunk.start,
          visibleEnd -
            fadeOutDuration,
        ),

        visibleEnd,
      ],
      [0, 1, 1, 0],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const fadeUpY =
    interpolate(
      currentTime,
      [
        visibleStart,
        activeChunk.start,
      ],
      [14, 0],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const scaleValue =
    interpolate(
      currentTime,
      [
        visibleStart,
        activeChunk.start,
      ],
      [0.975, 1],
      {
        extrapolateLeft:
          "clamp",

        extrapolateRight:
          "clamp",
      },
    );

  const opacity =
    resolvedConfig.animation ===
    "none"
      ? 1
      : animatedOpacity;

  let transform =
    "none";

  if (
    resolvedConfig.animation ===
    "fadeUp"
  ) {
    transform =
      `translateY(${fadeUpY}px)`;
  }

  if (
    resolvedConfig.animation ===
    "scaleIn"
  ) {
    transform =
      `scale(${scaleValue})`;
  }

  return (
    <LayoutGridArea
      preset={
        DOCUMENTARY_LAYOUT_PRESET
      }
      areaName="subtitle"
      columnStart={2}
      columnSpan={10}
      placement="bottom-center"
    >
      <div
        style={{
          maxWidth: 1480,

          minWidth: 360,

          color:
            theme.colors
              .textPrimary,

          fontFamily:
            theme.typography
              .fontFamily,

          fontSize:
            Math.min(
              theme.typography
                .subtitleFontSize,
              42,
            ),

          fontWeight: 600,

          lineHeight: 1.18,

          textAlign: "center",

          textShadow:
            "0 3px 14px rgba(0, 0, 0, 0.95)",

          opacity,

          transform,

          transformOrigin:
            "center bottom",

          ...getPresetStyle(
            resolvedConfig.preset,
          ),
        }}
      >
        {lines.map(
          (
            line,
            lineIndex,
          ) => (
            <div
              key={
                `${activeChunk.start}-${lineIndex}`
              }
              style={{
                whiteSpace:
                  "nowrap",
              }}
            >
              {line.map(
                (
                  word,
                  wordIndex,
                ) => {
                  const activeEnd =
                    Math.max(
                      word.end,

                      word.start +
                        resolvedConfig
                          .activeWordMinDurationInSeconds,
                    );

                  const isActive =
                    resolvedConfig
                      .highlightCurrentWord &&
                    currentTime >=
                      word.start &&
                    currentTime <=
                      activeEnd;

                  return (
                    <span
                      key={
                        `${word.start}-${wordIndex}`
                      }
                      style={{
                        color:
                          isActive
                            ? "#FFD75A"
                            : theme
                                .colors
                                .textPrimary,

                        fontWeight:
                          isActive
                            ? 800
                            : 600,

                        WebkitTextStroke:
                          isActive
                            ? "0.45px rgba(111, 72, 0, 0.95)"
                            : "0px transparent",

                        paintOrder:
                          "stroke fill",

                        textShadow:
                          isActive
                            ? [
                                "0 1px 1px rgba(0, 0, 0, 0.95)",

                                "0 2px 5px rgba(0, 0, 0, 0.8)",

                                "0 0 5px rgba(255, 204, 52, 0.38)",
                              ].join(
                                ", ",
                              )
                            : "0 3px 14px rgba(0, 0, 0, 0.95)",
                      }}
                    >
                      {word.word}

                      {wordIndex <
                      line.length -
                        1
                        ? " "
                        : ""}
                    </span>
                  );
                },
              )}
            </div>
          ),
        )}
      </div>
    </LayoutGridArea>
  );
};