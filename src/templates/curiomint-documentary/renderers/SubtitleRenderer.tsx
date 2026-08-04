import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
  } from "remotion";
  
  import { useTheme } from "../themes/ThemeContext";
  
  import type { SubtitleWord } from "../types";
  
  type SubtitleRendererProps = {
    text?: string;
    subtitleWords?: SubtitleWord[];
  };
  
  type SubtitleChunk = {
    words: SubtitleWord[];
    start: number;
    end: number;
  };
  
  const MAX_WORDS_PER_CHUNK = 10;
  const MAX_CHARACTERS_PER_CHUNK = 76;
  const MAX_CHUNK_DURATION_SECONDS = 3.6;
  const CHUNK_END_HOLD_SECONDS = 0.28;
  
  const isSentenceEnding = (word: string): boolean => {
    return /[.!?]["')\]]?$/.test(word.trim());
  };
  
  const normalizeWords = (
    words: SubtitleWord[],
  ): SubtitleWord[] => {
    return words
      .map((word) => ({
        word: String(word.word ?? "").trim(),
        start: Number(word.start ?? 0),
        end: Number(word.end ?? word.start ?? 0),
      }))
      .filter(
        (word) =>
          word.word.length > 0 &&
          Number.isFinite(word.start) &&
          Number.isFinite(word.end),
      )
      .map((word) => ({
        ...word,
        end: Math.max(word.start, word.end),
      }));
  };
  
  const createSubtitleChunks = (
    subtitleWords: SubtitleWord[],
  ): SubtitleChunk[] => {
    const words = normalizeWords(subtitleWords);
  
    if (words.length === 0) {
      return [];
    }
  
    const chunks: SubtitleChunk[] = [];
    let currentWords: SubtitleWord[] = [];
  
    const pushCurrentChunk = () => {
      if (currentWords.length === 0) {
        return;
      }
  
      chunks.push({
        words: currentWords,
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
      });
  
      currentWords = [];
    };
  
    for (const word of words) {
      const candidateWords = [...currentWords, word];
  
      const candidateText = candidateWords
        .map((item) => item.word)
        .join(" ");
  
      const candidateDuration =
        candidateWords.length > 0
          ? candidateWords[candidateWords.length - 1].end -
            candidateWords[0].start
          : 0;
  
      const exceedsWordLimit =
        candidateWords.length > MAX_WORDS_PER_CHUNK;
  
      const exceedsCharacterLimit =
        candidateText.length > MAX_CHARACTERS_PER_CHUNK;
  
      const exceedsDurationLimit =
        candidateDuration >
        MAX_CHUNK_DURATION_SECONDS;
  
      if (
        currentWords.length > 0 &&
        (exceedsWordLimit ||
          exceedsCharacterLimit ||
          exceedsDurationLimit)
      ) {
        pushCurrentChunk();
      }
  
      currentWords.push(word);
  
      const currentTextLength = currentWords
        .map((item) => item.word)
        .join(" ").length;
  
      const shouldEndAtPunctuation =
        isSentenceEnding(word.word) &&
        currentWords.length >= 4;
  
      const isComfortablyFull =
        currentTextLength >= 48;
  
      if (
        shouldEndAtPunctuation ||
        isComfortablyFull
      ) {
        pushCurrentChunk();
      }
    }
  
    pushCurrentChunk();
  
    return chunks;
  };
  
  const splitChunkIntoTwoLines = (
    words: SubtitleWord[],
  ): SubtitleWord[][] => {
    if (words.length <= 1) {
      return [words];
    }
  
    const totalLength = words.reduce(
      (sum, word) => sum + word.word.length + 1,
      0,
    );
  
    const targetLength = totalLength / 2;
  
    let currentLength = 0;
    let bestSplitIndex = 1;
    let smallestDifference = Number.POSITIVE_INFINITY;
  
    for (
      let index = 1;
      index < words.length;
      index++
    ) {
      currentLength +=
        words[index - 1].word.length + 1;
  
      const difference = Math.abs(
        currentLength - targetLength,
      );
  
      if (difference < smallestDifference) {
        smallestDifference = difference;
        bestSplitIndex = index;
      }
    }
  
    return [
      words.slice(0, bestSplitIndex),
      words.slice(bestSplitIndex),
    ].filter((line) => line.length > 0);
  };
  
  export const SubtitleRenderer = ({
    text,
    subtitleWords,
  }: SubtitleRendererProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = useTheme();
  
    const currentTime = frame / fps;
  
    const chunks = subtitleWords
      ? createSubtitleChunks(subtitleWords)
      : [];
  
    const activeChunk = chunks.find(
      (chunk) =>
        currentTime >= chunk.start &&
        currentTime <=
          chunk.end + CHUNK_END_HOLD_SECONDS,
    );
  
    /*
     * Kelime zamanlaması yoksa bütün narration metnini
     * ekrana basmıyoruz. Büyük paragraf sorununun geri
     * dönmesini önlüyor.
     */
    if (!activeChunk) {
      if (
        !subtitleWords ||
        subtitleWords.length === 0
      ) {
        if (!text?.trim()) {
          return null;
        }
  
        const shortFallback = text
          .trim()
          .split(/\s+/)
          .slice(0, 12)
          .join(" ");
  
        return (
          <AbsoluteFill
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              paddingLeft: 220,
              paddingRight: 220,
              paddingBottom: 92,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                maxWidth: 1120,
                padding: "14px 26px",
                borderRadius: 14,
                backgroundColor:
                  "rgba(0, 0, 0, 0.7)",
                color: theme.colors.textPrimary,
                fontFamily:
                  theme.typography.fontFamily,
                fontSize: Math.min(
                  theme.typography.subtitleFontSize,
                  42,
                ),
                fontWeight: 600,
                lineHeight: 1.2,
                textAlign: "center",
                textShadow:
                  "0 3px 12px rgba(0, 0, 0, 0.9)",
              }}
            >
              {shortFallback}
            </div>
          </AbsoluteFill>
        );
      }
  
      return null;
    }
  
    const lines = splitChunkIntoTwoLines(
      activeChunk.words,
    );
  
    const fadeInDuration = 0.14;
    const fadeOutDuration = 0.16;
  
    const chunkVisibleEnd =
      activeChunk.end +
      CHUNK_END_HOLD_SECONDS;
  
    const opacity = interpolate(
      currentTime,
      [
        activeChunk.start,
        activeChunk.start + fadeInDuration,
        Math.max(
          activeChunk.start + fadeInDuration,
          chunkVisibleEnd - fadeOutDuration,
        ),
        chunkVisibleEnd,
      ],
      [0, 1, 1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    const translateY = interpolate(
      currentTime,
      [
        activeChunk.start,
        activeChunk.start + fadeInDuration,
      ],
      [14, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  
    return (
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: 220,
          paddingRight: 220,
          paddingBottom: 92,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            minWidth: 360,
            padding: "14px 28px",
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(8, 8, 10, 0.72), rgba(3, 3, 5, 0.82))",
            color: theme.colors.textPrimary,
            fontFamily:
              theme.typography.fontFamily,
            fontSize: Math.min(
              theme.typography.subtitleFontSize,
              42,
            ),
            fontWeight: 600,
            lineHeight: 1.18,
            textAlign: "center",
            textShadow:
              "0 3px 14px rgba(0, 0, 0, 0.95)",
            boxShadow:
              "0 10px 35px rgba(0, 0, 0, 0.28)",
            opacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          {lines.map((line, lineIndex) => (
            <div
              key={`${activeChunk.start}-${lineIndex}`}
              style={{
                whiteSpace: "nowrap",
              }}
            >
              {line.map((word, wordIndex) => {
                const isActive =
                  currentTime >= word.start &&
                  currentTime <= word.end;
  
                return (
                  <span
                    key={`${word.start}-${wordIndex}`}
                    style={{
                      color: isActive
                        ? theme.colors.subtitleActive
                        : theme.colors.textPrimary,
                      fontWeight: isActive
                        ? 800
                        : 600,
                      textShadow: isActive
                        ? `0 0 18px ${theme.colors.subtitleActive}`
                        : "0 3px 14px rgba(0, 0, 0, 0.95)",
                    }}
                  >
                    {word.word}
                    {wordIndex <
                    line.length - 1
                      ? " "
                      : ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  };