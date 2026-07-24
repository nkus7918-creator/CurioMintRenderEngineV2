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
  durationInFrames: number;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  wordSpacing?: number;
};

const normalizeWord = (word: string) => {
  return word
    .replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ]/g, "")
    .toLocaleUpperCase("tr-TR");
};

const splitIntoGroups = (text: string, wordsPerGroup: number) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
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
  durationInFrames,
  fontSize = 72,
  letterSpacing = 4,
  lineHeight = 1.12,
  wordSpacing = 16,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const groups = splitIntoGroups(text, wordsPerGroup);

  if (groups.length === 0) {
    return null;
  }

  const groupDuration = durationInFrames / groups.length;

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

  const translateY = interpolate(entrance, [0, 1], [35, 0]);
  const scale = interpolate(entrance, [0, 1], [0.88, 1]);

  const normalizedHighlight = normalizeWord(highlight ?? "");

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        fontFamily: "Anton",
        fontSize,
        lineHeight,
        letterSpacing,
        textAlign: "center",
        textTransform: "uppercase",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {activeGroup.map((word, index) => {
        const isHighlighted =
          normalizedHighlight.length > 0 &&
          normalizeWord(word) === normalizedHighlight;

        const highlightEntrance = spring({
          frame: Math.max(0, localFrame - index * 2),
          fps,
          config: {
            damping: 10,
            stiffness: 190,
            mass: 0.6,
          },
        });

        const highlightScale = isHighlighted
          ? interpolate(highlightEntrance, [0, 1], [0.72, 1.1])
          : 1;

        return (
          <span
            key={`${activeGroupIndex}-${word}-${index}`}
            style={{
              display: "inline-block",
              marginRight:
                index === activeGroup.length - 1 ? 0 : wordSpacing,

              color: isHighlighted ? "#FFD400" : "#FFFFFF",

              WebkitTextStroke: "3.5px #000000",
              paintOrder: "stroke fill",

              filter: `
                drop-shadow(3px 0 0 #000000)
                drop-shadow(-3px 0 0 #000000)
                drop-shadow(0 3px 0 #000000)
                drop-shadow(0 -3px 0 #000000)
              `,

              textShadow: "0 7px 4px rgba(0,0,0,0.9)",

              transform: `scale(${highlightScale})`,
              transformOrigin: "center",
            }}
          >
            {word.toLocaleUpperCase("tr-TR")}
          </span>
        );
      })}
    </div>
  );
};