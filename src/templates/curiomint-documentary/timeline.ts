import type { DocumentaryChapter, DocumentarySection } from "./types";

export type ChapterTimelineItem = {
  type: "chapter";
  chapter: DocumentaryChapter;
  chapterIndex: number;
  startFrame: number;
  durationInFrames: number;
  endFrame: number;
};

export type SectionTimelineItem = {
  type: "section";
  section: DocumentarySection;

  index: number;
  startFrame: number;
  durationInFrames: number;
  endFrame: number;

  chapterId?: string;
  chapterTitle?: string;
  chapterIndex?: number;
  sectionIndexInChapter?: number;
};

export type DocumentaryTimelineItem = ChapterTimelineItem | SectionTimelineItem;

export type DocumentaryTimeline = {
  introDurationInFrames: number;
  items: DocumentaryTimelineItem[];
  outroStartFrame: number;
  outroDurationInFrames: number;
  totalDurationInFrames: number;
};

type CreateDocumentaryTimelineInput = {
  chapters?: DocumentaryChapter[];
  sections?: DocumentarySection[];
  fps: number;
  introDurationInSeconds?: number;
  chapterIntroDurationInSeconds?: number;
  outroDurationInSeconds?: number;
};

const secondsToFrames = (
  durationInSeconds: number | undefined,
  fps: number,
) => {
  if (
    typeof durationInSeconds !== "number" ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds <= 0
  ) {
    return 0;
  }

  return Math.max(1, Math.ceil(durationInSeconds * fps));
};

export const createDocumentaryTimeline = ({
  chapters,
  sections,
  fps,
  introDurationInSeconds = 0,
  chapterIntroDurationInSeconds = 0,
  outroDurationInSeconds = 0,
}: CreateDocumentaryTimelineInput): DocumentaryTimeline => {
  const introDurationInFrames = secondsToFrames(introDurationInSeconds, fps);

  const chapterIntroDurationInFrames = secondsToFrames(
    chapterIntroDurationInSeconds,
    fps,
  );

  const outroDurationInFrames = secondsToFrames(outroDurationInSeconds, fps);

  const items: DocumentaryTimelineItem[] = [];

  let cursor = introDurationInFrames;
  let globalSectionIndex = 0;

  if (chapters && chapters.length > 0) {
    chapters.forEach((chapter, chapterIndex) => {
      const shouldShowIntro = chapter.showIntro !== false;

      if (shouldShowIntro && chapterIntroDurationInFrames > 0) {
        const startFrame = cursor;
        const endFrame = startFrame + chapterIntroDurationInFrames;

        items.push({
          type: "chapter",
          chapter,
          chapterIndex,
          startFrame,
          durationInFrames: chapterIntroDurationInFrames,
          endFrame,
        });

        cursor = endFrame;
      }

      chapter.sections.forEach((section, sectionIndexInChapter) => {
        const durationInFrames = secondsToFrames(
          section.durationInSeconds,
          fps,
        );

        const startFrame = cursor;
        const endFrame = startFrame + durationInFrames;

        items.push({
          type: "section",
          section,
          index: globalSectionIndex,
          startFrame,
          durationInFrames,
          endFrame,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex,
          sectionIndexInChapter,
        });

        cursor = endFrame;
        globalSectionIndex++;
      });
    });
  } else {
    (sections ?? []).forEach((section, index) => {
      const durationInFrames = secondsToFrames(section.durationInSeconds, fps);

      const startFrame = cursor;
      const endFrame = startFrame + durationInFrames;

      items.push({
        type: "section",
        section,
        index,
        startFrame,
        durationInFrames,
        endFrame,
        sectionIndexInChapter: index,
      });

      cursor = endFrame;
    });
  }

  const outroStartFrame = cursor;

  return {
    introDurationInFrames,
    items,
    outroStartFrame,
    outroDurationInFrames,
    totalDurationInFrames: outroStartFrame + outroDurationInFrames,
  };
};

export const getActiveTimelineItem = (
  timeline: DocumentaryTimeline,
  frame: number,
) => {
  return timeline.items.find(
    (item) => frame >= item.startFrame && frame < item.endFrame,
  );
};
