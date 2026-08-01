export const createSeededNumber = (seed: string): number => {
    let hash = 0;
  
    for (let index = 0; index < seed.length; index++) {
      hash =
        (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
  
    return hash;
  };
  
  export const pickDeterministicItem = <T>({
    items,
    seed,
  }: {
    items: T[];
    seed: string;
  }): T | undefined => {
    if (items.length === 0) {
      return undefined;
    }
  
    const number = createSeededNumber(seed);
    const index = number % items.length;
  
    return items[index];
  };