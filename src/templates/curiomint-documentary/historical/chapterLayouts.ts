export type ChapterLayoutId =
  | "classic"
  | "seal-right"
  | "compass-left";

export const chapterLayouts = {
  classic: {
    scroll: {
      width: 1200,
      height: 850,
      left: 360,
      top: 115,
    },
    seal: {
      width: 150,
      height: 150,
      left: 1340,
      top: 775,
      opacity: 0.9,
    },
    compass: {
      width: 130,
      height: 130,
      left: 420,
      top: 150,
      opacity: 0.22,
    },
  },

  "seal-right": {
    scroll: {
      width: 1180,
      height: 820,
      left: 370,
      top: 130,
    },
    seal: {
      width: 175,
      height: 175,
      left: 1360,
      top: 745,
      opacity: 0.95,
    },
    compass: {
      width: 115,
      height: 115,
      left: 465,
      top: 180,
      opacity: 0.16,
    },
  },

  "compass-left": {
    scroll: {
      width: 1220,
      height: 860,
      left: 350,
      top: 105,
    },
    seal: {
      width: 135,
      height: 135,
      left: 1320,
      top: 790,
      opacity: 0.82,
    },
    compass: {
      width: 180,
      height: 180,
      left: 375,
      top: 125,
      opacity: 0.28,
    },
  },
} as const;