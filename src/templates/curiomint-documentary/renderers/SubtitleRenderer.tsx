import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

import { useTheme } from "../themes/ThemeContext";

import type { SubtitleWord } from "../types";

import { layoutSubtitleLines } from "../subtitle-engine/layoutSubtitleLines";

type SubtitleRendererProps = {
    text?: string;
    subtitleWords?: SubtitleWord[];
};

export const SubtitleRenderer = ({
    text,
    subtitleWords,
}: SubtitleRendererProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const theme = useTheme();

    const currentTime = frame / fps;

    const subtitleLines = subtitleWords
        ? layoutSubtitleLines(subtitleWords)
        : [];


    if (!text) {
        return null;
    }

    const opacity = interpolate(
        frame,
        [0, fps * 0.25],
        [0, 1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    const translateY = interpolate(
        frame,
        [0, fps * 0.25],
        [30, 0],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    return (
        <AbsoluteFill
            style={{
                justifyContent: "flex-end",
                alignItems: "center",
                paddingLeft: 180,
                paddingRight: 180,
                paddingBottom: 110,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    maxWidth: 1450,
                    padding: "18px 32px",
                    borderRadius: 18,
                    backgroundColor: "rgba(0, 0, 0, 0.55)",
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.subtitleFontSize,
                    fontWeight: theme.typography.fontWeight,
                    lineHeight: 1.25,
                    textAlign: "center",
                    textShadow: "0 3px 12px rgba(0, 0, 0, 0.8)",
                    opacity,
                    transform: `translateY(${translateY}px)`,
                }}
            >

                {subtitleLines.length > 0
                    ? subtitleLines.map((line, lineIndex) => (
                        <div
                            key={lineIndex}
                            style={{
                                marginBottom: 8,
                            }}
                        >
                            {line.map((word, index) => {
                                const isActive =
                                    currentTime >= word.start &&
                                    currentTime <= word.end;

                                return (
                                    <span
                                        key={index}
                                        style={{
                                            color: isActive
                                                ? theme.colors.subtitleActive
                                                : theme.colors.textPrimary,
                                            fontWeight: isActive
                                                ? 800
                                                : theme.typography.fontWeight,
                                        }}
                                    >
                                        {word.word}{" "}
                                    </span>
                                );
                            })}
                        </div>
                    ))
                    : text}

            </div>
        </AbsoluteFill>
    );
};