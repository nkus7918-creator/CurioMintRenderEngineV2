export type MusicTheme =
  | "history"
  | "mystery"
  | "science"
  | "ancient"
  | "emotional"
  | "nature"
  | "space"
  | "investigation"
  | "inspirational"
  | "tension";

export const musicLibrary: Record<
  MusicTheme,
  string[]
> = {
  history: [],
  mystery: [],
  science: [],
  ancient: [],
  emotional: [],
  nature: [],
  space: [],
  investigation: [],
  inspirational: [],
  tension: [],
};