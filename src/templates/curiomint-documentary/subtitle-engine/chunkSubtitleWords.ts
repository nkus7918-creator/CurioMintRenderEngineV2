import type {
    SubtitleWord,
  } from "../types";
  
  import type {
    ResolvedSubtitleConfig,
  } from "./resolveSubtitleConfig";
  
  export type SubtitleChunk = {
    words: SubtitleWord[];
  
    start: number;
  
    end: number;
  };
  
  const isSentenceEnding = (
    value: string,
  ): boolean =>
    /[.!?]["')\]]?$/.test(
      value.trim(),
    );
  
  export const normalizeSubtitleWords = (
    words: SubtitleWord[],
  ): SubtitleWord[] =>
    words
      .map((word) => {
        const rawStart =
          Number(word.start);
  
        const rawEnd =
          Number(word.end);
  
        if (
          !Number.isFinite(rawStart) ||
          !Number.isFinite(rawEnd)
        ) {
          return null;
        }
  
        const start =
          Math.max(
            0,
            rawStart,
          );
  
        const end =
          Math.max(
            start,
            rawEnd,
          );
  
        return {
          word:
            String(
              word.word ?? "",
            ).trim(),
  
          start,
  
          end,
        };
      })
      .filter(
        (
          word,
        ): word is SubtitleWord =>
          word !== null &&
          word.word.length > 0,
      )
      .sort(
        (left, right) =>
          left.start -
            right.start ||
          left.end -
            right.end,
      );
  
  export const createSubtitleChunks = (
    subtitleWords: SubtitleWord[],
    config: ResolvedSubtitleConfig,
  ): SubtitleChunk[] => {
    const words =
      normalizeSubtitleWords(
        subtitleWords,
      );
  
    if (words.length === 0) {
      return [];
    }
  
    const chunks:
      SubtitleChunk[] = [];
  
    let currentWords:
      SubtitleWord[] = [];
  
    const pushCurrentChunk =
      (): void => {
        if (
          currentWords.length === 0
        ) {
          return;
        }
  
        const firstWord =
          currentWords[0];
  
        const lastWord =
          currentWords[
            currentWords.length - 1
          ];
  
        if (
          !firstWord ||
          !lastWord
        ) {
          currentWords = [];
  
          return;
        }
  
        chunks.push({
          words: currentWords,
  
          start:
            firstWord.start,
  
          end:
            lastWord.end,
        });
  
        currentWords = [];
      };
  
    for (const word of words) {
      const candidateWords = [
        ...currentWords,
        word,
      ];
  
      const candidateText =
        candidateWords
          .map(
            (item) =>
              item.word,
          )
          .join(" ");
  
      const firstCandidateWord =
        candidateWords[0];
  
      const lastCandidateWord =
        candidateWords[
          candidateWords.length - 1
        ];
  
      const candidateDuration =
        firstCandidateWord &&
        lastCandidateWord
          ? lastCandidateWord.end -
            firstCandidateWord.start
          : 0;
  
      const exceedsWordLimit =
        candidateWords.length >
        config.maxWordsPerChunk;
  
      const exceedsCharacterLimit =
        candidateText.length >
        config.maxCharactersPerChunk;
  
      const exceedsDurationLimit =
        candidateDuration >
        config.maxChunkDurationInSeconds;
  
      if (
        currentWords.length > 0 &&
        (
          exceedsWordLimit ||
          exceedsCharacterLimit ||
          exceedsDurationLimit
        )
      ) {
        pushCurrentChunk();
      }
  
      currentWords.push(word);
  
      const shouldEndAtPunctuation =
        isSentenceEnding(
          word.word,
        ) &&
        currentWords.length >= 4;
  
      if (shouldEndAtPunctuation) {
        pushCurrentChunk();
      }
    }
  
    pushCurrentChunk();
  
    return chunks;
  };
  
  export const splitSubtitleChunkIntoLines =
    (
      words: SubtitleWord[],
      maxLines: number,
    ): SubtitleWord[][] => {
      if (
        words.length <= 1 ||
        maxLines <= 1
      ) {
        return [words];
      }
  
      const totalLength =
        words.reduce(
          (sum, word) =>
            sum +
            word.word.length +
            1,
          0,
        );
  
      const targetLength =
        totalLength / 2;
  
      let currentLength = 0;
  
      let bestSplitIndex = 1;
  
      let smallestDifference =
        Number.POSITIVE_INFINITY;
  
      for (
        let index = 1;
        index < words.length;
        index++
      ) {
        const previousWord =
          words[index - 1];
  
        if (!previousWord) {
          continue;
        }
  
        currentLength +=
          previousWord.word.length +
          1;
  
        const difference =
          Math.abs(
            currentLength -
              targetLength,
          );
  
        if (
          difference <
          smallestDifference
        ) {
          smallestDifference =
            difference;
  
          bestSplitIndex =
            index;
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
      ].filter(
        (line) =>
          line.length > 0,
      );
    };
  
  export const findActiveSubtitleChunk =
    (
      chunks: SubtitleChunk[],
      currentTime: number,
      config: ResolvedSubtitleConfig,
    ): SubtitleChunk | undefined => {
      /*
       * Timestamp'ler hafif overlap
       * ederse eski chunk yerine en yeni
       * başlayan chunk seçilir.
       */
      let activeChunk:
        SubtitleChunk | undefined;
  
      for (const chunk of chunks) {
        const visibleStart =
          chunk.start -
          config.leadInSeconds;
  
        const visibleEnd =
          chunk.end +
          config.holdSeconds;
  
        if (
          currentTime >=
            visibleStart &&
          currentTime <=
            visibleEnd
        ) {
          if (
            !activeChunk ||
            chunk.start >=
              activeChunk.start
          ) {
            activeChunk =
              chunk;
          }
        }
      }
  
      return activeChunk;
    };