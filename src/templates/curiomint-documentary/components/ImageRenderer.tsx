import {
    Img,
    interpolate,
    useCurrentFrame,
} from "remotion";

import type { MediaItem } from "../types";
import { getKenBurnsDirection } from "../utils/kenBurns";

import { resolveTransitionStyle } from "../transitions/resolveTransitionStyle";

import { useTheme } from "../themes/ThemeContext";

type ImageRendererProps = {
    media: MediaItem;
    durationInFrames: number;
};

export const ImageRenderer = ({
    media,
    durationInFrames,
}: ImageRendererProps) => {
    const frame = useCurrentFrame();
    
    const theme = useTheme();

    const safeDuration = Math.max(1, durationInFrames);

    const direction = getKenBurnsDirection(media.url);

    const scale = interpolate(
        frame,
        [0, safeDuration - 1],
        [1, 1.08],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    let fromX = 0;
    let toX = 0;
    let fromY = 0;
    let toY = 0;

    switch (direction) {
        case "left":
            fromX = 20;
            toX = -20;
            break;

        case "right":
            fromX = -20;
            toX = 20;
            break;

        case "up":
            fromY = 20;
            toY = -20;
            break;

        case "down":
            fromY = -20;
            toY = 20;
            break;

        case "topLeft":
            fromX = 20;
            toX = -20;
            fromY = 20;
            toY = -20;
            break;

        case "topRight":
            fromX = -20;
            toX = 20;
            fromY = 20;
            toY = -20;
            break;

        case "bottomLeft":
            fromX = 20;
            toX = -20;
            fromY = -20;
            toY = 20;
            break;

        case "bottomRight":
            fromX = -20;
            toX = 20;
            fromY = -20;
            toY = 20;
            break;
    }

    const translateX = interpolate(
        frame,
        [0, safeDuration - 1],
        [fromX, toX],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    const translateY = interpolate(
        frame,
        [0, safeDuration - 1],
        [fromY, toY],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    const transitionStyle =
        resolveTransitionStyle({
            frame,
            durationInFrames: safeDuration,
            fps: 30,
            transition: media.transition,
        });

    return (
        <Img
            src={media.url}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: theme.media.borderRadius,
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                ...transitionStyle,
            }}
        />  
    );
};