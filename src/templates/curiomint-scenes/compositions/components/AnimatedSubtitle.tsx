import React, { useMemo } from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TimedWord = {
  word: string;
  start: number;
  end: number;
};

export type SubtitleTiming = {
  text?: string;
  duration?: number;
  words: TimedWord[];
};

export type SubtitlePace =
  | "punch"
  | "phrase";

type SubtitleGroup = {
  words: TimedWord[];
  start: number;
  end: number;
};

type AnimatedSubtitleProps = {
  text: string;
  words?: TimedWord[];
  durationInFrames: number;
  isHook?: boolean;
  pace?: SubtitlePace;
  highlight?: string;

  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  wordSpacing?: number;
};

const normalizeWord = (value: string): string => {
  return value
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleUpperCase("tr-TR");
};

const createFallbackWords = ({
  text,
  durationInFrames,
  fps,
}: {
  text: string;
  durationInFrames: number;
  fps: number;
}): TimedWord[] => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const totalDurationSeconds =
    durationInFrames / fps;

  const durationPerWord =
    totalDurationSeconds /
    words.length;

  return words.map((word, index) => ({
    word,
    start:
      index * durationPerWord,
    end:
      (index + 1) *
      durationPerWord,
  }));
};

const createGroup = (
  words: TimedWord[],
): SubtitleGroup => {
  return {
    words,
    start: words[0].start,
    end: words[words.length - 1].end,
  };
};

const estimateWordPixelWidth = ({
  word,
  fontSize,
  letterSpacing,
}: {
  word: string;
  fontSize: number;
  letterSpacing: number;
}): number => {
  const visible = word
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (!visible) {
    return 0;
  }

  let widthUnits = 0;

  for (const character of visible) {
    if (
      /[Iİ1!|.,:;]/u.test(
        character,
      )
    ) {
      widthUnits += 0.34;
      continue;
    }

    if (
      /[MW@%&]/u.test(
        character,
      )
    ) {
      widthUnits += 0.82;
      continue;
    }

    widthUnits += 0.58;
  }

  return (
    widthUnits * fontSize +
    Math.max(
      0,
      visible.length - 1,
    ) *
      letterSpacing
  );
};

const estimateLinePixelWidth = ({
  words,
  fontSize,
  letterSpacing,
  wordSpacing,
}: {
  words: TimedWord[];
  fontSize: number;
  letterSpacing: number;
  wordSpacing: number;
}): number => {
  if (words.length === 0) {
    return 0;
  }

  const wordsWidth =
    words.reduce(
      (total, item) => {
        return (
          total +
          estimateWordPixelWidth({
            word: item.word,
            fontSize,
            letterSpacing,
          })
        );
      },
      0,
    );

  return (
    wordsWidth +
    Math.max(
      0,
      words.length - 1,
    ) *
      wordSpacing
  );
};

const splitSubtitleLines = ({
  words,
  fontSize,
  letterSpacing,
  wordSpacing,
  maxLineWidth,
}: {
  words: TimedWord[];
  fontSize: number;
  letterSpacing: number;
  wordSpacing: number;
  maxLineWidth: number;
}): TimedWord[][] => {
  if (words.length <= 1) {
    return [words];
  }

  const fullWidth =
    estimateLinePixelWidth({
      words,
      fontSize,
      letterSpacing,
      wordSpacing,
    });

  if (fullWidth <= maxLineWidth) {
    return [words];
  }

  let bestSplitIndex = 1;
  let bestScore =
    Number.POSITIVE_INFINITY;

  for (
    let splitIndex = 1;
    splitIndex < words.length;
    splitIndex++
  ) {
    const firstLine =
      words.slice(0, splitIndex);

    const secondLine =
      words.slice(splitIndex);

    const firstWidth =
      estimateLinePixelWidth({
        words: firstLine,
        fontSize,
        letterSpacing,
        wordSpacing,
      });

    const secondWidth =
      estimateLinePixelWidth({
        words: secondLine,
        fontSize,
        letterSpacing,
        wordSpacing,
      });

    const widestLine = Math.max(
      firstWidth,
      secondWidth,
    );

    const balancePenalty =
      Math.abs(
        firstWidth - secondWidth,
      );

    const overflowPenalty =
      Math.max(
        0,
        widestLine - maxLineWidth,
      ) * 8;

    const orphanPenalty =
      firstLine.length === 1 ||
      secondLine.length === 1
        ? 140
        : 0;

    const score =
      widestLine +
      balancePenalty * 0.35 +
      overflowPenalty +
      orphanPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestSplitIndex =
        splitIndex;
    }
  }

  return [
    words.slice(
      0,
      bestSplitIndex,
    ),
    words.slice(
      bestSplitIndex,
    ),
  ];
};

const groupFitsAtMinimumFont = ({
  words,
  fontSize,
  minimumFontSize,
  letterSpacing,
  wordSpacing,
  maxLineWidth,
}: {
  words: TimedWord[];
  fontSize: number;
  minimumFontSize: number;
  letterSpacing: number;
  wordSpacing: number;
  maxLineWidth: number;
}): boolean => {
  const lines = splitSubtitleLines({
    words,
    fontSize,
    letterSpacing,
    wordSpacing,
    maxLineWidth,
  });

  const widestLine = Math.max(
    1,
    ...lines.map((lineWords) =>
      estimateLinePixelWidth({
        words: lineWords,
        fontSize,
        letterSpacing,
        wordSpacing,
      }),
    ),
  );

  const minimumScale = Math.min(
    1,
    minimumFontSize / fontSize,
  );

  return (
    widestLine *
      1.14 *
      minimumScale <=
    maxLineWidth
  );
};

const createSubtitleGroups = ({
  words,
  pace,
  fontSize,
  letterSpacing,
  wordSpacing,
  maxLineWidth,
}: {
  words: TimedWord[];
  pace: SubtitlePace;
  fontSize: number;
  letterSpacing: number;
  wordSpacing: number;
  maxLineWidth: number;
}): SubtitleGroup[] => {
  if (words.length === 0) {
    return [];
  }

  const groups: SubtitleGroup[] = [];
  let currentGroup: TimedWord[] = [];

  /*
   * Hook ve surprise sahneleri hızlı "punch" modunda;
   * setup ve payoff sahneleri okunabilir "phrase" modunda.
   *
   * Bir grup yalnızca kelime sayısına göre değil,
   * konuşma süresi, doğal duraklama, noktalama ve
   * minimum font boyutunda güvenli alana sığma
   * koşullarına göre bölünür.
   */
  const maximumWords =
    pace === "punch" ? 2 : 4;

  const maximumDuration =
    pace === "punch" ? 1.05 : 1.45;

  const pauseThreshold =
    pace === "punch" ? 0.16 : 0.24;

  const minimumFontSize =
    pace === "punch" ? 60 : 58;

  for (
    let index = 0;
    index < words.length;
    index++
  ) {
    const word = words[index];
    const previousWord =
      words[index - 1];

    const pause =
      previousWord === undefined
        ? 0
        : Math.max(
            0,
            word.start -
              previousWord.end,
          );

    const previousText =
      previousWord?.word.trim() ?? "";

    const hasHardBoundary =
      /[.!?;:]$/u.test(previousText);

    const hasSoftBoundary =
      currentGroup.length >= 2 &&
      /[,]$/u.test(previousText);

    const candidateWords = [
      ...currentGroup,
      word,
    ];

    const candidateStart =
      currentGroup.length > 0
        ? currentGroup[0].start
        : word.start;

    const candidateDuration =
      word.end - candidateStart;

    const candidateFits =
      groupFitsAtMinimumFont({
        words: candidateWords,
        fontSize,
        minimumFontSize,
        letterSpacing,
        wordSpacing,
        maxLineWidth,
      });

    const shouldCreateNewGroup =
      currentGroup.length > 0 &&
      (pause >= pauseThreshold ||
        hasHardBoundary ||
        hasSoftBoundary ||
        currentGroup.length >=
          maximumWords ||
        candidateDuration >
          maximumDuration ||
        !candidateFits);

    if (shouldCreateNewGroup) {
      groups.push(
        createGroup(currentGroup),
      );

      currentGroup = [];
    }

    currentGroup.push(word);
  }

  if (currentGroup.length > 0) {
    groups.push(
      createGroup(currentGroup),
    );
  }

  /*
   * Tek kelimelik çok kısa bir son grubu, yalnızca
   * bütün punch/phrase sınırları hâlâ korunuyorsa
   * bir önceki gruba ekle. Eski 9 kelimelik birleşme
   * davranışı burada özellikle engellenir.
   */
  if (groups.length >= 2) {
    const lastGroup =
      groups[groups.length - 1];

    const previousGroup =
      groups[groups.length - 2];

    const combinedWords = [
      ...previousGroup.words,
      ...lastGroup.words,
    ];

    const combinedDuration =
      lastGroup.end -
      previousGroup.start;

    const boundaryWord =
      previousGroup.words[
        previousGroup.words.length - 1
      ]?.word.trim() ?? "";

    const canMergeLastGroup =
      (lastGroup.words.length === 1 ||
        lastGroup.end -
          lastGroup.start <
          0.38) &&
      combinedWords.length <=
        maximumWords &&
      combinedDuration <=
        maximumDuration * 1.15 &&
      !/[.!?;:]$/u.test(
        boundaryWord,
      ) &&
      groupFitsAtMinimumFont({
        words: combinedWords,
        fontSize,
        minimumFontSize,
        letterSpacing,
        wordSpacing,
        maxLineWidth,
      });

    if (canMergeLastGroup) {
      previousGroup.words =
        combinedWords;
      previousGroup.end =
        lastGroup.end;
      groups.pop();
    }
  }

  return groups;
};

export const AnimatedSubtitle: React.FC<
  AnimatedSubtitleProps
> = ({
  text,
  words,
  durationInFrames,
  isHook = false,
  pace,
  highlight,
  fontSize = 72,
  letterSpacing = 1,
  lineHeight = 1.08,
  wordSpacing = 22,
}) => {
  const frame =
    useCurrentFrame();

  const { fps, width } =
    useVideoConfig();

  const resolvedPace: SubtitlePace =
    pace ??
    (isHook
      ? "punch"
      : "phrase");

  /*
   * ============================================================
   * SHORTS SAFE AREA
   * ============================================================
   *
   * 1080x1920 composition için
   * gerçek subtitle kutusu yaklaşık
   * 780 px.
   *
   * İçerik bu alanın dışına çıkmasın.
   */
  const subtitleSafeWidth =
    Math.min(
      780,
      width * 0.72,
    );

  const validWords =
    useMemo<TimedWord[]>(() => {
      const sanitizedWords =
        (words ?? [])
          .map((item) => ({
            word: String(
              item?.word ?? "",
            ).trim(),

            start: Number(
              item?.start,
            ),

            end: Number(
              item?.end,
            ),
          }))
          .filter((item) => {
            return (
              item.word.length > 0 &&
              Number.isFinite(
                item.start,
              ) &&
              Number.isFinite(
                item.end,
              ) &&
              item.start >= 0 &&
              item.end >=
                item.start
            );
          })
          .sort(
            (first, second) =>
              first.start -
              second.start,
          );

      if (
        sanitizedWords.length >
        0
      ) {
        return sanitizedWords;
      }

      return createFallbackWords({
        text,
        durationInFrames,
        fps,
      });
    }, [
      words,
      text,
      durationInFrames,
      fps,
    ]);

  const groups = useMemo(
    () => {
      return createSubtitleGroups({
        words: validWords,
        pace: resolvedPace,
        fontSize,
        letterSpacing,
        wordSpacing,
        maxLineWidth:
          subtitleSafeWidth,
      });
    },
    [
      validWords,
      resolvedPace,
      fontSize,
      letterSpacing,
      wordSpacing,
      subtitleSafeWidth,
    ],
  );

  const highlightedWords =
    useMemo(() => {
      return (
        highlight ?? ""
      )
        .split(/\s+/)
        .map(
          normalizeWord,
        )
        .filter(Boolean);
    }, [highlight]);

  if (
    groups.length === 0
  ) {
    return null;
  }

  const timingOffset =
    0.08;

  const transitionDurationInFrames =
    Math.max(
      4,
      Math.round(
        fps *
          (resolvedPace === "punch"
            ? 0.12
            : 0.18),
      ),
    );

  return (
    <div
      style={{
        width: "100%",

        /*
         * Hayali subtitle kutusu:
         * ekranın tam ortasında,
         * maksimum 780 px.
         */
        maxWidth:
          subtitleSafeWidth,

        margin: "0 auto",

        display: "grid",

        alignItems:
          "center",

        justifyItems:
          "center",

        /*
         * Taşan içerik dışarı
         * taşmasın.
         */
        overflow: "visible",
      }}
    >
      {groups.map(
        (
          group,
          groupIndex,
        ) => {
          const nextGroup =
            groups[
              groupIndex + 1
            ];

          const naturalStartFrame =
            Math.max(
              0,
              Math.round(
                (
                  group.start -
                  timingOffset
                ) * fps,
              ),
            );

          const visibleStartFrame =
            groupIndex === 0
              ? 0
              : naturalStartFrame;

          const nextGroupStartFrame =
            nextGroup
              ? Math.max(
                  visibleStartFrame,
                  Math.round(
                    (
                      nextGroup.start -
                      timingOffset
                    ) * fps,
                  ),
                )
              : durationInFrames;

          const visibleEndFrame =
            nextGroup
              ? nextGroupStartFrame +
                transitionDurationInFrames
              : durationInFrames;

          const isVisible =
            frame >=
              visibleStartFrame &&
            frame <=
              visibleEndFrame;

          const localFrame =
            Math.max(
              0,
              frame -
                visibleStartFrame,
            );

          const entranceProgress =
            spring({
              frame:
                localFrame,

              fps,

              config:
                resolvedPace === "punch"
                ? {
                    damping: 15,
                    stiffness: 190,
                    mass: 0.68,
                  }
                : {
                    damping: 18,
                    stiffness: 150,
                    mass: 0.78,
                  },
            });

          const entranceOpacity =
            interpolate(
              localFrame,
              [
                0,
                Math.max(
                  4,
                  Math.round(
                    fps * 0.16,
                  ),
                ),
              ],
              [0, 1],
              {
                extrapolateLeft:
                  "clamp",

                extrapolateRight:
                  "clamp",
              },
            );

          const exitProgress =
            nextGroup
              ? interpolate(
                  frame,
                  [
                    nextGroupStartFrame,
                    visibleEndFrame,
                  ],
                  [0, 1],
                  {
                    extrapolateLeft:
                      "clamp",

                    extrapolateRight:
                      "clamp",
                  },
                )
              : 0;

          const opacity =
            entranceOpacity *
            (1 -
              exitProgress);

          const entranceTranslateY =
            interpolate(
              entranceProgress,
              [0, 1],
              [
                resolvedPace ===
                "punch"
                  ? 30
                  : 22,
                0,
              ],
            );

          const exitTranslateY =
            interpolate(
              exitProgress,
              [0, 1],
              [0, -12],
            );

          const translateY =
            entranceTranslateY +
            exitTranslateY;

          const entranceScale =
            interpolate(
              entranceProgress,
              [0, 1],
              [
                resolvedPace ===
                "punch"
                  ? 0.91
                  : 0.95,
                1,
              ],
            );

          const exitScale =
            interpolate(
              exitProgress,
              [0, 1],
              [1, 0.98],
            );

          const groupScale =
            entranceScale *
            exitScale;

          /*
           * ======================================================
           * LINE SPLITTING
           * ======================================================
           */
          const subtitleLines =
            splitSubtitleLines({
              words:
                group.words,

              fontSize,

              letterSpacing,

              wordSpacing,

              maxLineWidth:
                subtitleSafeWidth,
            });

          const widestEstimatedLine =
            Math.max(
              1,
              ...subtitleLines.map(
                (lineWords) =>
                  estimateLinePixelWidth({
                    words:
                      lineWords,

                    fontSize,

                    letterSpacing,

                    wordSpacing,
                  }),
              ),
            );

          /*
           * ======================================================
           * HARD SAFE-AREA FIT
           * ======================================================
           *
           * %14 ekstra pay bırakıyoruz.
           *
           * Bunun sebebi:
           * - Arial Black'in gerçek ölçüsü
           * - stroke
           * - shadow
           * - browser font metrics
           * - bold glyph genişliği
           */
          const safeFitScale =
            Math.min(
              1,
              subtitleSafeWidth /
                (
                  widestEstimatedLine *
                  1.14
                ),
            );

          const minimumFontSize =
            resolvedPace === "punch"
              ? 60
              : 58;

          const minimumScale =
            Math.min(
              1,
              minimumFontSize /
                fontSize,
            );

          /*
           * Gruplama aşaması normal cümleleri minimum
           * font boyutunda böler. Yalnızca tek ve aşırı
           * uzun bir kelime güvenli alan için daha fazla
           * küçülebilir.
           */
          const canRespectMinimum =
            widestEstimatedLine *
              1.14 *
              minimumScale <=
            subtitleSafeWidth;

          const fitScale =
            canRespectMinimum
              ? Math.max(
                  minimumScale,
                  safeFitScale,
                )
              : safeFitScale;

          const fittedFontSize =
            fontSize *
            fitScale;

          const fittedLetterSpacing =
            letterSpacing *
            fitScale;

          const fittedWordSpacing =
            wordSpacing *
            fitScale;

          return (
            <div
              key={`subtitle-group-${groupIndex}`}
              style={{
                gridArea:
                  "1 / 1",

                /*
                 * Subtitle grubunun genişliği
                 * doğrudan güvenli alanı geçemez.
                 */
                width:
                  "100%",

                maxWidth:
                  subtitleSafeWidth,

                boxSizing:
                  "border-box",

                opacity:
                  isVisible
                    ? opacity
                    : 0,

                visibility:
                  isVisible
                    ? "visible"
                    : "hidden",

                transform: `
                  translateY(${translateY}px)
                  scale(${groupScale})
                `,

                transformOrigin:
                  "center center",

                willChange:
                  "transform, opacity",

                zIndex:
                  groupIndex + 1,

                /*
                 * Shorts görünümü:
                 * çok daha kalın font.
                 *
                 * Arial Black varsa onu kullanır.
                 * Yoksa Arial → Helvetica →
                 * sans-serif fallback.
                 */
                fontFamily:
                  "Arial Black, Arial, Helvetica, sans-serif",

                fontSize:
                  fittedFontSize,

                fontWeight:
                  900,

                lineHeight:
                  lineHeight,

                letterSpacing:
                  fittedLetterSpacing,

                textAlign:
                  "center",

                textTransform:
                  "uppercase",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                /*
                 * Satırların hiçbir şekilde
                 * kutunun dışına taşmasına izin verme.
                 */
                overflow:
                  "visible",
              }}
            >
              {subtitleLines.map(
                (
                  lineWords,
                  lineIndex,
                ) => {
                  return (
                    <div
                      key={`line-${groupIndex}-${lineIndex}`}
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "center",

                        alignItems:
                          "center",

                        flexWrap:
                          "nowrap",

                        width:
                          "100%",

                        maxWidth:
                          subtitleSafeWidth,

                        boxSizing:
                          "border-box",

                        whiteSpace:
                          "nowrap",

                        textAlign:
                          "center",

                        overflow:
                          "visible",
                      }}
                    >
                      {lineWords.map(
                        (
                          timedWord,
                          wordIndex,
                        ) => {
                          const normalizedCurrentWord =
                            normalizeWord(
                              timedWord.word,
                            );

                          const isManualHighlight =
                            highlightedWords.includes(
                              normalizedCurrentWord,
                            );

                          const currentTime =
                            frame /
                            fps;

                          const isActiveWord =
                            currentTime >=
                              timedWord.start -
                                timingOffset &&
                            currentTime <=
                              timedWord.end;

                          const wordStartFrame =
                            Math.max(
                              0,
                              Math.round(
                                (
                                  timedWord.start -
                                  timingOffset
                                ) * fps,
                              ),
                            );

                          const wordPopProgress =
                            spring({
                              frame:
                                Math.max(
                                  0,
                                  frame -
                                    wordStartFrame,
                                ),
                              fps,
                              config: {
                                damping: 17,
                                stiffness:
                                  resolvedPace ===
                                  "punch"
                                    ? 260
                                    : 190,
                                mass: 0.62,
                              },
                            });

                          const activeWordScale =
                            isActiveWord
                              ? interpolate(
                                  wordPopProgress,
                                  [0, 1],
                                  [
                                    resolvedPace ===
                                    "punch"
                                      ? 0.92
                                      : 0.97,
                                    resolvedPace ===
                                    "punch"
                                      ? 1.06
                                      : 1.025,
                                  ],
                                )
                              : 1;

                          return (
                            <span
                              key={`${groupIndex}-${lineIndex}-${wordIndex}-${timedWord.start}`}
                              style={{
                                display:
                                  "inline-block",

                                /*
                                 * Kelimeler arası
                                 * daha belirgin nefes.
                                 */
                                marginRight:
                                  wordIndex ===
                                  lineWords.length -
                                    1
                                    ? 0
                                    : fittedWordSpacing,

                                color:
                                  isActiveWord ||
                                  isManualHighlight
                                    ? "#FFD400"
                                    : "#FFFFFF",

                                /*
                                 * Kalın fontla birlikte
                                 * okunabilir ama taşmayan
                                 * güçlü outline.
                                 */
                                WebkitTextStroke:
                                  "3px #000000",

                                paintOrder:
                                  "stroke fill",

                                textShadow:
                                  "0 6px 5px rgba(0, 0, 0, 0.92)",

                                filter: `
                                  drop-shadow(3px 0 0 #000000)
                                  drop-shadow(-3px 0 0 #000000)
                                  drop-shadow(0 3px 0 #000000)
                                  drop-shadow(0 -3px 0 #000000)
                                `,

                                /*
                                 * Aktif kelime layout'u değiştirmeden
                                 * kendi merkezinden hafifçe büyür.
                                 */
                                transform:
                                  `scale(${activeWordScale})`,

                                willChange:
                                  "transform",

                                transformOrigin:
                                  "center center",

                                /*
                                 * Kelimenin kendisi de
                                 * güvenli şekilde hesaplanmış
                                 * line box içinde kalır.
                                 */
                                maxWidth:
                                  "100%",

                                boxSizing:
                                  "border-box",
                              }}
                            >
                              {timedWord.word.toLocaleUpperCase(
                                "tr-TR",
                              )}
                            </span>
                          );
                        },
                      )}
                    </div>
                  );
                },
              )}
            </div>
          );
        },
      )}
    </div>
  );
};