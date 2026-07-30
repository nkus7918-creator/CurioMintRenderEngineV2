import type { SubtitleWord } from "../types";

export const splitSubtitleWords = (
    words: SubtitleWord[],
    maxWordsPerLine = 4,
): SubtitleWord[][] => {
    const lines: SubtitleWord[][] = [];

    for (let i = 0; i < words.length; i += maxWordsPerLine) {
        lines.push(
            words.slice(i, i + maxWordsPerLine),
        );
    }

    return lines.slice(0, 2);
};