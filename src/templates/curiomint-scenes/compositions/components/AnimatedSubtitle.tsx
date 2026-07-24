import React, {useMemo} from "react";
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
  const {fps} = useVideoConfig();

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

  const currentTime = frame / fps;

  /*
   * Altyazı sesi yaklaşık 80 ms önden takip eder.
   */
  const timingOffset = 0.08;

  let activeGroupIndex = groups.findIndex(
    (group, index) => {
      const nextGroup = groups[index + 1];

      const visibleStart = Math.max(
        0,
        group.start - timingOffset,
      );

      const visibleEnd = nextGroup
        ? Math.max(
            visibleStart,
            nextGroup.start - timingOffset,
          )
        : durationInFrames / fps;

      return (
        currentTime >= visibleStart &&
        currentTime < visibleEnd
      );
    },
  );

  /*
   * İlk kelimeden önceki çok kısa sürede ilk grubu göster.
   */
  if (
    activeGroupIndex === -1 &&
    currentTime <
      Math.max(0, groups[0].start - timingOffset)
  ) {
    activeGroupIndex = 0;
  }

  /*
   * Son kelimeden sonra son grubun sahne bitene kadar
   * görünmesini sağla.
   */
  if (
    activeGroupIndex === -1 &&
    currentTime >=
      groups[groups.length - 1].start - timingOffset
  ) {
    activeGroupIndex = groups.length - 1;
  }

  if (activeGroupIndex === -1) {
    return null;
  }

  const activeGroup = groups[activeGroupIndex];

  const groupStartFrame = Math.max(
    0,
    Math.round(
      (activeGroup.start - timingOffset) * fps,
    ),
  );

  const localFrame = Math.max(
    0,
    frame - groupStartFrame,
  );

  const groupEntrance = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 16,
      stiffness: 170,
      mass: 0.72,
    },
  });

  const opacity = interpolate(
    localFrame,
    [0, 5],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const translateY = interpolate(
    groupEntrance,
    [0, 1],
    [28, 0],
  );

  const scale = interpolate(
    groupEntrance,
    [0, 1],
    [0.92, 1],
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",

        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,

        fontFamily: "Anton, sans-serif",
        fontSize,
        fontWeight: 400,
        lineHeight,
        letterSpacing,

        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      {activeGroup.words.map((timedWord, index) => {
        const normalizedCurrentWord =
          normalizeWord(timedWord.word);

        const isHighlighted =
          highlightedWords.includes(
            normalizedCurrentWord,
          );

        const wordStartFrame = Math.max(
          0,
          Math.round(
            (timedWord.start -
              activeGroup.start +
              timingOffset) *
              fps,
          ),
        );

        const wordEntrance = spring({
          frame: Math.max(
            0,
            localFrame - wordStartFrame,
          ),
          fps,
          config: {
            damping: 12,
            stiffness: 190,
            mass: 0.65,
          },
        });

        const highlightScale = isHighlighted
          ? interpolate(
              wordEntrance,
              [0, 1],
              [0.85, 1.08],
            )
          : 1;

        return (
          <span
            key={`${activeGroupIndex}-${index}-${timedWord.start}`}
            style={{
              display: "inline-block",

              marginRight:
                index === activeGroup.words.length - 1
                  ? 0
                  : wordSpacing,

              color: isHighlighted
                ? "#FFD400"
                : "#FFFFFF",

              WebkitTextStroke: "3.5px #000000",
              paintOrder: "stroke fill",

              textShadow:
                "0 7px 4px rgba(0, 0, 0, 0.9)",

              filter: `
                drop-shadow(3px 0 0 #000000)
                drop-shadow(-3px 0 0 #000000)
                drop-shadow(0 3px 0 #000000)
                drop-shadow(0 -3px 0 #000000)
              `,

              transform: `scale(${highlightScale})`,
              transformOrigin: "center",
            }}
          >
            {timedWord.word.toLocaleUpperCase(
              "tr-TR",
            )}
          </span>
        );
      })}
    </div>
  );
};