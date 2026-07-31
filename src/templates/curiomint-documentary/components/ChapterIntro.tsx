import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

type ChapterIntroProps = {
    chapterIndex: number;
    chapterTitle: string;
    durationInFrames: number;
};

export const ChapterIntro = ({
    chapterIndex,
    chapterTitle,
    durationInFrames,
}: ChapterIntroProps) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(
        frame,
        [
            0,
            12,
            durationInFrames - 12,
            durationInFrames,
        ],
        [0, 1, 1, 0],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        },
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#080808",
                justifyContent: "center",
                alignItems: "center",
                opacity,
            }}
        >
            <div
                style={{
                    color: "#8f8f8f",
                    fontSize: 30,
                    letterSpacing: 8,
                    marginBottom: 20,
                    textTransform: "uppercase",
                }}
            >
                Chapter {chapterIndex + 1}
            </div>

            <div
                style={{
                    color: "white",
                    fontSize: 72,
                    fontWeight: 700,
                    maxWidth: 1300,
                    textAlign: "center",
                    lineHeight: 1.15,
                }}
            >
                {chapterTitle}
            </div>
        </AbsoluteFill>
    );
};