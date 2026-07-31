import type {
    DocumentaryChapter,
    DocumentarySection,
} from "./types";

type NormalizeDocumentarySectionsInput = {
    chapters?: DocumentaryChapter[];
    sections?: DocumentarySection[];
};

export const normalizeDocumentarySections = ({
    chapters,
    sections,
}: NormalizeDocumentarySectionsInput): DocumentarySection[] => {
    if (chapters && chapters.length > 0) {
        return chapters.flatMap((chapter) => chapter.sections);
    }

    return sections ?? [];
};