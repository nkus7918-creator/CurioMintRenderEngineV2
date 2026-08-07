type AdaptiveFontSizeInput = {
    text: string;
  
    baseSize: number;
  
    minSize: number;
  
    softLimit: number;
  
    shrinkPerCharacter?: number;
  };
  
  export const getAdaptiveCardFontSize = ({
    text,
    baseSize,
    minSize,
    softLimit,
    shrinkPerCharacter = 0.65,
  }: AdaptiveFontSizeInput): number => {
    const normalizedLength =
      text.trim().length;
  
    if (
      normalizedLength <=
      softLimit
    ) {
      return baseSize;
    }
  
    const overflow =
      normalizedLength -
      softLimit;
  
    return Math.max(
      minSize,
  
      Math.round(
        baseSize -
          overflow *
            shrinkPerCharacter,
      ),
    );
  };