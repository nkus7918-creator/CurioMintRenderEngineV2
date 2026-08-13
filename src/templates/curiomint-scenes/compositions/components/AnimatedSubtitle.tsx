import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

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
  return value.replace(/[^\p{L}\p{N}]/gu, "").toLocaleUpperCase("tr-TR");
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

const estimateWordPixelWidth = ({
  word,
  fontSize,
  letterSpacing,
}: {
  word: string;
  fontSize: number;
  letterSpacing: number;
}): number => {
  const visible = word.trim().toLocaleUpperCase("tr-TR");

  if (!visible) {
    return 0;
  }

  let widthUnits = 0;

  for (const character of visible) {
    if (/[Iİ1!|.,:;]/u.test(character)) {
      widthUnits += 0.34;
      continue;
    }

    if (/[MW@%&]/u.test(character)) {
      widthUnits += 0.82;
      continue;
    }

    widthUnits += 0.58;
  }

  return (
    widthUnits * fontSize + Math.max(0, visible.length - 1) * letterSpacing
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

  const wordsWidth = words.reduce((total, item) => {
    return (
      total +
      estimateWordPixelWidth({
        word: item.word,
        fontSize,
        letterSpacing,
      })
    );
  }, 0);

  return wordsWidth + Math.max(0, words.length - 1) * wordSpacing;
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

  const fullWidth = estimateLinePixelWidth({
    words,
    fontSize,
    letterSpacing,
    wordSpacing,
  });

  if (fullWidth <= maxLineWidth) {
    return [words];
  }

  let bestSplitIndex = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let splitIndex = 1; splitIndex < words.length; splitIndex++) {
    const firstLine = words.slice(0, splitIndex);
    const secondLine = words.slice(splitIndex);

    const firstWidth = estimateLinePixelWidth({
      words: firstLine,
      fontSize,
      letterSpacing,
      wordSpacing,
    });

    const secondWidth = estimateLinePixelWidth({
      words: secondLine,
      fontSize,
      letterSpacing,
      wordSpacing,
    });

    const widestLine = Math.max(firstWidth, secondWidth);
    const balancePenalty = Math.abs(firstWidth - secondWidth);
    const overflowPenalty = Math.max(0, widestLine - maxLineWidth) * 8;

    const orphanPenalty =
      firstLine.length === 1 || secondLine.length === 1 ? 140 : 0;

    const score =
      widestLine + balancePenalty * 0.35 + overflowPenalty + orphanPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestSplitIndex = splitIndex;
    }
  }

  return [words.slice(0, bestSplitIndex), words.slice(bestSplitIndex)];
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
      currentGroup.length > 0 ? currentGroup[0].start : word.start;

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

  if (groups.length >= 2) {
    const lastGroup = groups[groups.length - 1];
    const previousGroup = groups[groups.length - 2];

    const combinedWordCount =
      previousGroup.words.length + lastGroup.words.length;

    const lastGroupDuration = lastGroup.end - lastGroup.start;

    const shouldMergeLastGroup =
      (lastGroup.words.length <= 2 || lastGroupDuration < 0.7) &&
      combinedWordCount <= 9;

    if (shouldMergeLastGroup) {
      previousGroup.words = [...previousGroup.words, ...lastGroup.words];

      previousGroup.end = lastGroup.end;
      groups.pop();
    }
  }

  return groups;
};

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({
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
  const { fps, width } = useVideoConfig();

  /*
   * 1080x1920 Shorts için yaklaşık 820 px güvenli subtitle alanı.
   * Daha küçük composition gelirse oranlı olarak küçülür.
   */
  const subtitleSafeWidth = Math.min(820, width * 0.76);

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
    return (highlight ?? "").split(/\s+/).map(normalizeWord).filter(Boolean);
  }, [highlight]);

  if (groups.length === 0) {
    return null;
  }

  const timingOffset = 0.08;

  const transitionDurationInFrames = Math.max(5, Math.round(fps * 0.23));

  return (
    <div
      style={{
        width: "100%",
        maxWidth: subtitleSafeWidth,
        margin: "0 auto",
        display: "grid",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      {groups.map((group, groupIndex) => {
        const nextGroup = groups[groupIndex + 1];

        const naturalStartFrame = Math.max(
          0,
          Math.round((group.start - timingOffset) * fps),
        );

        const visibleStartFrame = groupIndex === 0 ? 0 : naturalStartFrame;

        const nextGroupStartFrame = nextGroup
          ? Math.max(
              visibleStartFrame,
              Math.round((nextGroup.start - timingOffset) * fps),
            )
          : durationInFrames;

        const visibleEndFrame = nextGroup
          ? nextGroupStartFrame + transitionDurationInFrames
          : durationInFrames;

        const isVisible =
          frame >= visibleStartFrame && frame <= visibleEndFrame;

        const localFrame = Math.max(0, frame - visibleStartFrame);

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

        const exitProgress = nextGroup
          ? interpolate(frame, [nextGroupStartFrame, visibleEndFrame], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        const opacity = entranceOpacity * (1 - exitProgress);

        const entranceTranslateY = interpolate(
          entranceProgress,
          [0, 1],
          [isHook ? 30 : 22, 0],
        );

        const exitTranslateY = interpolate(exitProgress, [0, 1], [0, -12]);

        const translateY = entranceTranslateY + exitTranslateY;

        const entranceScale = interpolate(
          entranceProgress,
          [0, 1],
          [isHook ? 0.91 : 0.95, 1],
        );

        const exitScale = interpolate(exitProgress, [0, 1], [1, 0.98]);

        const groupScale = entranceScale * exitScale;

        const subtitleLines = splitSubtitleLines({
          words: group.words,
          fontSize,
          letterSpacing,
          wordSpacing,
          maxLineWidth: subtitleSafeWidth,
        });

        const widestEstimatedLine = Math.max(
          1,
          ...subtitleLines.map((lineWords) =>
            estimateLinePixelWidth({
              words: lineWords,
              fontSize,
              letterSpacing,
              wordSpacing,
            }),
          ),
        );

        /*
         * %4 güvenlik payı: stroke + shadow + font ölçüm farkları.
         * Uzun subtitle gerekiyorsa font küçülür, ama merkez değişmez.
         */
        const fitScale = Math.min(
          1,
          subtitleSafeWidth / (widestEstimatedLine * 1.04),
        );

        const fittedFontSize = fontSize * fitScale;
        const fittedLetterSpacing = letterSpacing * fitScale;
        const fittedWordSpacing = wordSpacing * fitScale;

        return (
          <div
            key={`subtitle-group-${groupIndex}`}
            style={{
              gridArea: "1 / 1",
              width: "100%",
              opacity: isVisible ? opacity : 0,
              visibility: isVisible ? "visible" : "hidden",
              transform: `translateY(${translateY}px) scale(${groupScale})`,
              transformOrigin: "center center",
              willChange: "transform, opacity",
              zIndex: groupIndex + 1,
              fontFamily: "Anton, sans-serif",
              fontSize: fittedFontSize,
              fontWeight: 400,
              lineHeight,
              letterSpacing: fittedLetterSpacing,
              textAlign: "center",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {subtitleLines.map((lineWords, lineIndex) => {
              return (
                <div
                  key={`line-${groupIndex}-${lineIndex}`}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    width: "100%",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {lineWords.map((timedWord, wordIndex) => {
                    const normalizedCurrentWord = normalizeWord(timedWord.word);

                    const isManualHighlight = highlightedWords.includes(
                      normalizedCurrentWord,
                    );

                    const currentTime = frame / fps;

                    const isActiveWord =
                      currentTime >= timedWord.start - timingOffset &&
                      currentTime <= timedWord.end;

                    return (
                      <span
                        key={`${groupIndex}-${lineIndex}-${wordIndex}-${timedWord.start}`}
                        style={{
                          display: "inline-block",
                          marginRight:
                            wordIndex === lineWords.length - 1
                              ? 0
                              : fittedWordSpacing,
                          color:
                            isActiveWord || isManualHighlight
                              ? "#FFD400"
                              : "#FFFFFF",
                          WebkitTextStroke: "3.5px #000000",
                          paintOrder: "stroke fill",
                          textShadow: "0 7px 4px rgba(0, 0, 0, 0.9)",
                          filter: `
                            drop-shadow(3px 0 0 #000000)
                            drop-shadow(-3px 0 0 #000000)
                            drop-shadow(0 3px 0 #000000)
                            drop-shadow(0 -3px 0 #000000)
                          `,
                          transform: "none",
                          transformOrigin: "center center",
                        }}
                      >
                        {timedWord.word.toLocaleUpperCase("tr-TR")}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
