type ComposeTransformProps = {
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: number;
  };
  
  export const composeTransform = ({
    translateX = 0,
    translateY = 0,
    scale = 1,
    rotate = 0,
  }: ComposeTransformProps): string => {
    return [
      `translate(${translateX}px, ${translateY}px)`,
      `scale(${scale})`,
      `rotate(${rotate}deg)`,
    ].join(" ");
  };