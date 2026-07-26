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
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const totalDurationSeconds = durationInFrames / fps;
  const durationPerWord = totalDurationSeconds / words.length;

  return words.map((word, index) => ({
    word,
    start: index * durationPerWord,
    end: (index + 1) * durationPerWord,
  }));
};

const createGroup = (words: TimedWord[]): SubtitleGroup => {
  return {
    words,
    start: words[0].start,
    end: words[words.length - 1].end,
  };
};
const getWordVisualLength = (word: string): number => {
  /*
   * Noktalama işaretleri ekranda alan kapladığı için
   * burada kelimenin görünen uzunluğunu kullanıyoruz.
   */
  return word.trim().length;
};

const getLineVisualLength = (
  words: TimedWord[],
): number => {
  if (words.length === 0) {
    return 0;
  }

  const wordsLength = words.reduce(
    (total, item) =>
      total + getWordVisualLength(item.word),
    0,
  );

  /*
   * Kelimeler arasındaki boşlukları da hesaba kat.
   */
  return wordsLength + words.length - 1;
};

const splitSubtitleLines = (
  words: TimedWord[],
): TimedWord[][] => {
  /*
   * Kısa grupları tek satırda bırakıyoruz.
   */
  if (words.length <= 3) {
    return [words];
  }

  const totalLength = getLineVisualLength(words);

  /*
   * Zaten kısa olan grupları gereksiz yere bölme.
   */
  if (totalLength <= 24) {
    return [words];
  }

  let bestSplitIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;

  /*
   * İlk veya son satırda tek kelime kalmasını şimdilik
   * mümkün olduğunca engelliyoruz.
   */
  for (
    let splitIndex = 2;
    splitIndex <= words.length - 2;
    splitIndex++
  ) {
    const firstLine = words.slice(0, splitIndex);
    const secondLine = words.slice(splitIndex);

    const firstLength =
      getLineVisualLength(firstLine);

    const secondLength =
      getLineVisualLength(secondLine);

    const difference = Math.abs(
      firstLength - secondLength,
    );

    if (difference < bestDifference) {
      bestDifference = difference;
      bestSplitIndex = splitIndex;
    }
  }

  return [
    words.slice(0, bestSplitIndex),
    words.slice(bestSplitIndex),
  ];
};

const createSubtitleGroups = ({
  words,
  isHook,
}: {
  words: TimedWord[];
  isHook: boolean;
}): SubtitleGroup[] => {
  if (words.length === 0) {
    return [];
  }

  /*
   * Kısa hook cümlelerini bölmüyoruz.
   * Örnek: "Lightning creates tiny x-rays."
   */
  if (isHook && words.length <= 6) {
    return [createGroup(words)];
  }

  const groups: SubtitleGroup[] = [];
  let currentGroup: TimedWord[] = [];

  const maximumWords = isHook ? 6 : 7;
  const maximumDuration = isHook ? 2.2 : 2.5;
  const pauseThreshold = isHook ? 0.2 : 0.26;

  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const previousWord = words[index - 1];

    const pause =
      previousWord === undefined
        ? 0
        : Math.max(0, word.start - previousWord.end);

    const groupStart =
      currentGroup.length > 0
        ? currentGroup[0].start
        : word.start;

    const newGroupDuration = word.end - groupStart;

    const shouldCreateNewGroup =
      currentGroup.length > 0 &&
      (pause >= pauseThreshold ||
        currentGroup.length >= maximumWords ||
        newGroupDuration >= maximumDuration);

    if (shouldCreateNewGroup) {
      groups.push(createGroup(currentGroup));
      currentGroup = [];
    }

    currentGroup.push(word);
  }

  if (currentGroup.length > 0) {
    groups.push(createGroup(currentGroup));
  }

  /*
   * Son grup yalnızca 1-2 kelimeyse önceki grupla birleştiriyoruz.
   * Böylece tek başına kalan "x-rays" gibi parçalar azalıyor.
   */
  if (groups.length >= 2) {
    const lastGroup = groups[groups.length - 1];
    const previousGroup = groups[groups.length - 2];

    const combinedWordCount =
      previousGroup.words.length + lastGroup.words.length;

    const lastGroupDuration =
      lastGroup.end - lastGroup.start;

    const shouldMergeLastGroup =
      (lastGroup.words.length <= 2 ||
        lastGroupDuration < 0.7) &&
      combinedWordCount <= 9;

    if (shouldMergeLastGroup) {
      previousGroup.words = [
        ...previousGroup.words,
        ...lastGroup.words,
      ];

      previousGroup.end = lastGroup.end;

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
  highlight,
  fontSize = 64,
  letterSpacing = 2,
  lineHeight = 1.15,
  wordSpacing = 14,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const validWords = useMemo<TimedWord[]>(() => {
      const sanitizedWords = (words ?? [])
        .map((item) => ({
          word: String(item?.word ?? "").trim(),
          start: Number(item?.start),
          end: Number(item?.end),
        }))
        .filter((item) => {
          return (
            item.word.length > 0 &&
            Number.isFinite(item.start) &&
            Number.isFinite(item.end) &&
            item.start >= 0 &&
            item.end >= item.start
          );
        })
        .sort((first, second) => first.start - second.start);

      if (sanitizedWords.length > 0) {
        
        return sanitizedWords;
      }

      return createFallbackWords({
        text,
        durationInFrames,
        fps,
      });
    }, [words, text, durationInFrames, fps]);

    const groups = useMemo(() => {
      return createSubtitleGroups({
        words: validWords,
        isHook,
      });
    }, [validWords, isHook]);

    const highlightedWords = useMemo(() => {
      return (highlight ?? "")
        .split(/\s+/)
        .map(normalizeWord)
        .filter(Boolean);
    }, [highlight]);

    if (groups.length === 0) {
      return null;
    }

    /*
     * Altyazı sesi yaklaşık 80 ms önden takip eder.
     */
    const timingOffset = 0.08;

    /*
     * Eski ve yeni altyazının kısa süre üst üste görünmesini sağlar.
     * 30 FPS'te yaklaşık 230 ms.
     */
    const transitionDurationInFrames = Math.max(
      5,
      Math.round(fps * 0.23),
    );

    return (
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",

          /*
           * Bütün gruplar aynı grid alanında bulunur.
           * Böylece geçiş sırasında eski ve yeni grup
           * aynı anda gösterilebilir.
           */
          display: "grid",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {groups.map((group, groupIndex) => {
          const nextGroup = groups[groupIndex + 1];

          const naturalStartFrame = Math.max(
            0,
            Math.round(
              (group.start - timingOffset) * fps,
            ),
          );

          /*
           * İlk grup, ilk kelimeden önceki kısa boşlukta da
           * ekranda görünsün.
           */
          const visibleStartFrame =
            groupIndex === 0 ? 0 : naturalStartFrame;

          const nextGroupStartFrame = nextGroup
            ? Math.max(
              visibleStartFrame,
              Math.round(
                (nextGroup.start - timingOffset) * fps,
              ),
            )
            : durationInFrames;

          /*
           * Önceki grup, yeni grup başladıktan sonra da
           * birkaç kare görünmeye devam eder.
           */
          const visibleEndFrame = nextGroup
            ? nextGroupStartFrame +
            transitionDurationInFrames
            : durationInFrames;

          const isVisible =
            frame >= visibleStartFrame &&
            frame <= visibleEndFrame;

          /*
           * Görünür olmayan grupları DOM'da tutuyoruz.
           * Böylece grid yüksekliği değişmiyor ve altyazı
           * yukarı-aşağı zıplamıyor.
           */
          const localFrame = Math.max(
            0,
            frame - visibleStartFrame,
          );

          const entranceProgress = spring({
            frame: localFrame,
            fps,
            config: isHook
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

          const entranceOpacity = interpolate(
            localFrame,
            [0, Math.max(4, Math.round(fps * 0.16))],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          /*
           * Yeni grup başladığı anda eski grup:
           * - hafif yukarı çıkar
           * - küçülür
           * - saydamlaşır
           */
          const exitProgress = nextGroup
            ? interpolate(
              frame,
              [
                nextGroupStartFrame,
                visibleEndFrame,
              ],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )
            : 0;

          const opacity =
            entranceOpacity * (1 - exitProgress);

          const entranceTranslateY = interpolate(
            entranceProgress,
            [0, 1],
            [isHook ? 30 : 22, 0],
          );

          const exitTranslateY = interpolate(
            exitProgress,
            [0, 1],
            [0, -12],
          );

          const translateY =
            entranceTranslateY + exitTranslateY;

          const entranceScale = interpolate(
            entranceProgress,
            [0, 1],
            [isHook ? 0.91 : 0.95, 1],
          );

          const exitScale = interpolate(
            exitProgress,
            [0, 1],
            [1, 0.98],
          );

          const groupScale =
            entranceScale * exitScale;

          const subtitleLines =
            splitSubtitleLines(group.words);

          return (
            <div
              key={`subtitle-group-${groupIndex}`}
              style={{
                gridArea: "1 / 1",

                width: "100%",

                opacity: isVisible ? opacity : 0,
                visibility: isVisible
                  ? "visible"
                  : "hidden",

                transform: `
                translateY(${translateY}px)
                scale(${groupScale})
              `,

                transformOrigin: "center",
                willChange: "transform, opacity",

                /*
                 * Yeni grup eski grubun üzerinde görünür.
                 */
                zIndex: groupIndex + 1,

                fontFamily: "Anton, sans-serif",
                fontSize,
                fontWeight: 400,
                lineHeight,
                letterSpacing,

                textAlign: "center",
                textTransform: "uppercase",

                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {subtitleLines.map(
                (lineWords, lineIndex) => {
                  return (
                    <div
                      key={`line-${groupIndex}-${lineIndex}`}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "nowrap",
                        width: "100%",
                      }}
                    >
                      {lineWords.map(
                        (timedWord, wordIndex) => {
                          const normalizedCurrentWord =
                            normalizeWord(timedWord.word);

                          const isManualHighlight =
                            highlightedWords.includes(
                              normalizedCurrentWord,
                            );

                          const currentTime = frame / fps;

                          const isActiveWord =
                            currentTime >=
                            timedWord.start - timingOffset &&
                            currentTime <= timedWord.end;

                          const isHighlighted =
                            isManualHighlight || isActiveWord;

                          const wordStartFrame = Math.max(
                            0,
                            Math.round(
                              (timedWord.start -
                                timingOffset) *
                              fps,
                            ),
                          );

                          const wordLocalFrame = Math.max(
                            0,
                            frame - wordStartFrame,
                          );

                          const wordEntrance = spring({
                            frame: wordLocalFrame,
                            fps,
                            config: {
                              damping: 12,
                              stiffness: 190,
                              mass: 0.65,
                            },
                          });

                          const activeWordScale = isActiveWord
                            ? 1.12
                            : isManualHighlight
                              ? interpolate(
                                wordEntrance,
                                [0, 0.7, 1],
                                [0.88, 1.1, 1.06],
                              )
                              : 1;

                          return (
                            <span
                              key={`${groupIndex}-${lineIndex}-${wordIndex}-${timedWord.start}`}
                              style={{
                                display: "inline-block",

                                marginRight:
                                  wordIndex ===
                                    lineWords.length - 1
                                    ? 0
                                    : wordSpacing,

                                color: isActiveWord
                                  ? "#FFD400"
                                  : isManualHighlight
                                    ? "#FFD400"
                                    : "#FFFFFF",

                                WebkitTextStroke:
                                  "3.5px #000000",

                                paintOrder: "stroke fill",

                                textShadow:
                                  "0 7px 4px rgba(0, 0, 0, 0.9)",

                                filter: `
                    drop-shadow(3px 0 0 #000000)
                    drop-shadow(-3px 0 0 #000000)
                    drop-shadow(0 3px 0 #000000)
                    drop-shadow(0 -3px 0 #000000)
                  `,

                                transform: `scale(${activeWordScale})`,
                                transformOrigin: "center",
                                willChange: "transform",
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
        })}
      </div>
    );
  };