import type {
    DocumentaryChapter,
    DocumentarySection,
} from "./types";

type CalculateDocumentaryDurationInput = {
    chapters?: DocumentaryChapter[];
    sections?: DocumentarySection[];
    introDurationInSeconds?: number;
    chapterIntroDurationInSeconds?: number;
    outroDurationInSeconds?: number;
};

export const calculateDocumentaryDuration = ({
    chapters,
    sections,
    introDurationInSeconds = 0,
    chapterIntroDurationInSeconds = 0,
    outroDurationInSeconds = 0,
}: CalculateDocumentaryDurationInput): number => {
    const hasChapters =
        Array.isArray(chapters) &&
        chapters.length > 0;

    const normalizedSections = hasChapters
        ? chapters.flatMap(
              (chapter) => chapter.sections,
          )
        : sections ?? [];

    const sectionsDuration =
        normalizedSections.reduce(
            (total, section) =>
                total + section.durationInSeconds,
            0,
        );

    const chapterCardsDuration = hasChapters
        ? chapters.length *
          chapterIntroDurationInSeconds
        : 0;

    return (
        introDurationInSeconds +
        chapterCardsDuration +
        sectionsDuration +
        outroDurationInSeconds
    );
};