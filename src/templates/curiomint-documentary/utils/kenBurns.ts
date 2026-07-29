export type KenBurnsDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

const directions: KenBurnsDirection[] = [
  "left",
  "right",
  "up",
  "down",
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
];

const hash = (value: string) => {
  let h = 0;

  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }

  return h;
};

export const getKenBurnsDirection = (
  seed: string,
): KenBurnsDirection => {
  return directions[
    hash(seed) % directions.length
  ];
};