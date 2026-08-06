import type {
  DocumentaryChapter,
  DocumentarySection,
} from "./types";

export const DEFAULT_DOCUMENTARY_INTRO_DURATION_IN_SECONDS =
  0;

export const DEFAULT_CHAPTER_INTRO_DURATION_IN_SECONDS =
  2;

export const DEFAULT_DOCUMENTARY_OUTRO_DURATION_IN_SECONDS =
  0;

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

export type DocumentaryTimelineItem =
  | ChapterTimelineItem
  | SectionTimelineItem;

export type DocumentaryTimeline = {
  fps: number;

  introStartFrame: number;

  introDurationInFrames: number;

  contentStartFrame: number;

  items: DocumentaryTimelineItem[];

  chapterIntroCount: number;

  sectionCount: number;

  contentEndFrame: number;

  outroStartFrame: number;

  outroDurationInFrames: number;

  totalDurationInFrames: number;

  totalDurationInSeconds: number;
};

export type CreateDocumentaryTimelineInput = {
  chapters?: DocumentaryChapter[];

  sections?: DocumentarySection[];

  fps: number;

  introDurationInSeconds?: number;

  chapterIntroDurationInSeconds?: number;

  outroDurationInSeconds?: number;
};

const normalizeFps = (
  fps: number,
): number => {
  if (
    !Number.isFinite(fps) ||
    fps <= 0
  ) {
    return 30;
  }

  return fps;
};

const secondsToFrames = (
  durationInSeconds: number | undefined,
  fps: number,
): number => {
  if (
    typeof durationInSeconds !== "number" ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds <= 0
  ) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(
      durationInSeconds * fps,
    ),
  );
};

export const createDocumentaryTimeline = ({
  chapters,
  sections,
  fps,
  introDurationInSeconds =
    DEFAULT_DOCUMENTARY_INTRO_DURATION_IN_SECONDS,
  chapterIntroDurationInSeconds =
    DEFAULT_CHAPTER_INTRO_DURATION_IN_SECONDS,
  outroDurationInSeconds =
    DEFAULT_DOCUMENTARY_OUTRO_DURATION_IN_SECONDS,
}: CreateDocumentaryTimelineInput): DocumentaryTimeline => {
  const safeFps =
    normalizeFps(fps);

  const introDurationInFrames =
    secondsToFrames(
      introDurationInSeconds,
      safeFps,
    );

  const chapterIntroDurationInFrames =
    secondsToFrames(
      chapterIntroDurationInSeconds,
      safeFps,
    );

  const outroDurationInFrames =
    secondsToFrames(
      outroDurationInSeconds,
      safeFps,
    );

  const introStartFrame = 0;

  const contentStartFrame =
    introStartFrame +
    introDurationInFrames;

  const items:
    DocumentaryTimelineItem[] = [];

  let cursor = contentStartFrame;

  let globalSectionIndex = 0;

  let chapterIntroCount = 0;

  const hasChapters =
    Array.isArray(chapters) &&
    chapters.length > 0;

  if (hasChapters) {
    chapters.forEach(
      (
        chapter,
        chapterIndex,
      ) => {
        const shouldShowIntro =
          chapter.showIntro !== false;

        if (
          shouldShowIntro &&
          chapterIntroDurationInFrames > 0
        ) {
          const startFrame = cursor;

          const endFrame =
            startFrame +
            chapterIntroDurationInFrames;

          items.push({
            type: "chapter",

            chapter,

            chapterIndex,

            startFrame,

            durationInFrames:
              chapterIntroDurationInFrames,

            endFrame,
          });

          cursor = endFrame;

          chapterIntroCount += 1;
        }

        chapter.sections.forEach(
          (
            section,
            sectionIndexInChapter,
          ) => {
            const durationInFrames =
              secondsToFrames(
                section.durationInSeconds,
                safeFps,
              );

            /*
             * Validator section süresini
             * zorunlu tuttuğu için normal
             * API akışında sıfır süre gelmez.
             *
             * Yine de timeline doğrudan
             * kullanılırsa geçersiz section
             * sessizce atlanır.
             */
            if (
              durationInFrames === 0
            ) {
              return;
            }

            const startFrame = cursor;

            const endFrame =
              startFrame +
              durationInFrames;

            items.push({
              type: "section",

              section,

              index:
                globalSectionIndex,

              startFrame,

              durationInFrames,

              endFrame,

              chapterId:
                chapter.id,

              chapterTitle:
                chapter.title,

              chapterIndex,

              sectionIndexInChapter,
            });

            cursor = endFrame;

            globalSectionIndex += 1;
          },
        );
      },
    );
  } else {
    (sections ?? []).forEach(
      (section, index) => {
        const durationInFrames =
          secondsToFrames(
            section.durationInSeconds,
            safeFps,
          );

        if (
          durationInFrames === 0
        ) {
          return;
        }

        const startFrame = cursor;

        const endFrame =
          startFrame +
          durationInFrames;

        items.push({
          type: "section",

          section,

          index,

          startFrame,

          durationInFrames,

          endFrame,

          sectionIndexInChapter:
            index,
        });

        cursor = endFrame;

        globalSectionIndex += 1;
      },
    );
  }

  const contentEndFrame = cursor;

  const outroStartFrame =
    contentEndFrame;

  const totalDurationInFrames =
    outroStartFrame +
    outroDurationInFrames;

  return {
    fps: safeFps,

    introStartFrame,

    introDurationInFrames,

    contentStartFrame,

    items,

    chapterIntroCount,

    sectionCount:
      globalSectionIndex,

    contentEndFrame,

    outroStartFrame,

    outroDurationInFrames,

    totalDurationInFrames,

    totalDurationInSeconds:
      totalDurationInFrames /
      safeFps,
  };
};

export const getActiveTimelineItem = (
  timeline: DocumentaryTimeline,
  frame: number,
): DocumentaryTimelineItem | undefined =>
  timeline.items.find(
    (item) =>
      frame >= item.startFrame &&
      frame < item.endFrame,
  );

export const isDocumentaryIntroFrame = (
  timeline: DocumentaryTimeline,
  frame: number,
): boolean =>
  timeline.introDurationInFrames > 0 &&
  frame >= timeline.introStartFrame &&
  frame < timeline.contentStartFrame;

export const isDocumentaryOutroFrame = (
  timeline: DocumentaryTimeline,
  frame: number,
): boolean =>
  timeline.outroDurationInFrames > 0 &&
  frame >= timeline.outroStartFrame &&
  frame <
    timeline.totalDurationInFrames;