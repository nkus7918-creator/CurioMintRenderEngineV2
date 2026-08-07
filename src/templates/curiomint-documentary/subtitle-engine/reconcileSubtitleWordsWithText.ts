import type {
  SubtitleWord,
} from "../types";

const normalizeToken = (
  value: string,
): string =>
  value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(
      /[^\p{L}\p{N}]/gu,
      "",
    );

/*
 * Whisper word timestamps can split punctuation-sensitive values:
 *
 * "1.5"    -> "1", "5"
 * "12,000" -> "12", "000"
 *
 * The full transcription text already contains the correct
 * punctuation. If its normalized content exactly matches the
 * timed words, rebuild the timed tokens using the transcription
 * token boundaries while preserving timestamps.
 *
 * If alignment is not exact, return the original timed words.
 * This keeps subtitle timing safe.
 */
export const reconcileSubtitleWordsWithText = (
  text: string,
  words: SubtitleWord[],
): SubtitleWord[] => {
  const referenceTokens =
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    referenceTokens.length === 0 ||
    words.length === 0
  ) {
    return words;
  }

  const normalizedReference =
    referenceTokens
      .map(normalizeToken)
      .join("");

  const normalizedTimedWords =
    words
      .map((word) =>
        normalizeToken(word.word),
      )
      .join("");

  if (
    !normalizedReference ||
    normalizedReference !==
      normalizedTimedWords
  ) {
    return words;
  }

  const reconciled:
    SubtitleWord[] = [];

  let wordIndex = 0;

  for (
    const referenceToken of
    referenceTokens
  ) {
    const target =
      normalizeToken(
        referenceToken,
      );

    if (!target) {
      continue;
    }

    const startIndex =
      wordIndex;

    let combined = "";
    let matched = false;

    while (
      wordIndex <
      words.length
    ) {
      combined +=
        normalizeToken(
          words[wordIndex].word,
        );

      if (combined === target) {
        reconciled.push({
          word:
            referenceToken,
          start:
            words[startIndex]
              .start,
          end:
            words[wordIndex]
              .end,
        });

        wordIndex += 1;
        matched = true;
        break;
      }

      if (
        combined.length >=
        target.length
      ) {
        return words;
      }

      wordIndex += 1;
    }

    if (!matched) {
      return words;
    }
  }

  if (
    wordIndex !==
    words.length
  ) {
    return words;
  }

  return reconciled;
};