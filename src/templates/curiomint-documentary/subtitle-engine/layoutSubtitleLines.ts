import type { SubtitleWord } from "../types";

export const layoutSubtitleLines = (
    words: SubtitleWord[],
): SubtitleWord[][] => {
    if (words.length <= 4) {
        return [words];
    }

    let bestSplit = 1;
    let smallestDifference = Number.MAX_SAFE_INTEGER;

    for (let i = 2; i <= words.length - 2; i++) {
        const firstLength = words
            .slice(0, i)
            .map((w) => w.word)
            .join(" ").length;

        const secondLength = words
            .slice(i)
            .map((w) => w.word)
            .join(" ").length;

        const difference = Math.abs(
            firstLength - secondLength,
        );

        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestSplit = i;
        }
    }

    return [
        words.slice(0, bestSplit),
        words.slice(bestSplit),
    ];
};