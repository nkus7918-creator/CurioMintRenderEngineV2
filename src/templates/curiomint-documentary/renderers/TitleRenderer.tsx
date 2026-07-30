import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

import { useTheme } from "../themes/ThemeContext";

import { resolveTitleAnimation } from "../title-animation/resolveTitleAnimation";
import { getTitleAnimationStyle } from "../title-animation/getTitleAnimationStyle";
import type { TitleAnimationConfig } from "../title-animation/types";

type TitleRendererProps = {
    title: string;
    animation?: TitleAnimationConfig;
};

export const TitleRenderer = ({
    title,
    animation,
}: TitleRendererProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = useTheme();

    const resolvedAnimation = resolveTitleAnimation(animation);

    const animationStyle = getTitleAnimationStyle({
        frame,
        fps,
        animation: resolvedAnimation,
    });

    return (
        <AbsoluteFill
            style={{
                justifyContent: "flex-start",
                alignItems: "center",
                paddingTop: 90,
                paddingLeft: 120,
                paddingRight: 120,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    maxWidth: 1500,
                    textAlign: "center",
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.titleFontSize,
                    fontWeight: theme.typography.fontWeight,
                    lineHeight: 1.1,
                    ...animationStyle,
                    textShadow: "0 4px 20px rgba(0, 0, 0, 0.55)",
                }}
            >
                {title}
            </div>
        </AbsoluteFill>
    );
};