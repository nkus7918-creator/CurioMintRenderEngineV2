import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type AnimatedSubtitleProps = {
  text: string;
  highlight?: string;
  wordsPerGroup?: number;
  groupDuration?: number;
};

const normalizeWord = (word: string) =>
  word
    .toLocaleUpperCase("tr-TR")
    .replace(/[.,!?;:'"()[\]{}]/g, "");

const splitIntoGroups = (text: string, wordsPerGroup: number) => {
  const words = text.trim().split(/\s+/);
  const groups: string[][] = [];

  for (let index = 0; index < words.length; index += wordsPerGroup) {
    groups.push(words.slice(index, index + wordsPerGroup));
  }

  return groups;
};

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({
  text,
  highlight,
  wordsPerGroup = 3,
  groupDuration = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const groups = splitIntoGroups(text, wordsPerGroup);

  const activeGroupIndex = Math.min(
    Math.floor(frame / groupDuration),
    groups.length - 1,
  );

  const activeGroup = groups[activeGroupIndex] ?? [];

  const localFrame = frame - activeGroupIndex * groupDuration;

  const entrance = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 180,
      mass: 0.7,
    },
  });

  const opacity = interpolate(localFrame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrance, [0, 1], [45, 0]);
  const scale = interpolate(entrance, [0, 1], [0.82, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        fontFamily: "Anton",
        fontSize: 72,
        lineHeight: 1.12,
        letterSpacing: 4,
        textAlign: "center",
        textTransform: "uppercase",
        maxWidth: 900,
      }}
    >
      {activeGroup.map((word, index) => {
        const isHighlighted =
          highlight &&
          normalizeWord(word) === normalizeWord(highlight);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              marginRight: 16,
              color: isHighlighted ? "#FFD400" : "#FFFFFF",

              WebkitTextStroke: "3.5px #000000",
              paintOrder: "stroke fill",

              filter: `
                drop-shadow(3px 0 0 #000)
                drop-shadow(-3px 0 0 #000)
                drop-shadow(0 3px 0 #000)
                drop-shadow(0 -3px 0 #000)
              `,

              textShadow: "0 7px 5px rgba(0,0,0,0.9)",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};