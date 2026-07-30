type ComposeTransformProps = {
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotation?: number;
};

export const composeTransform = ({
    translateX = 0,
    translateY = 0,
    scale = 1,
    rotation = 0,
}: ComposeTransformProps) => {
    return [
        `translateX(${translateX}px)`,
        `translateY(${translateY}px)`,
        `scale(${scale})`,
        `rotate(${rotation}deg)`,
    ].join(" ");
};