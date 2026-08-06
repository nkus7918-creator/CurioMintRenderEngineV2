import {
    AbsoluteFill,
    Img,
  } from "remotion";
  
  import type {
    ThumbnailProps,
    ThumbnailThemeId,
  } from "./types";
  
  type ThumbnailTheme = {
    backgroundFallback: string;
  
    titleColor: string;
    subtitleColor: string;
    brandColor: string;
  
    titleFontFamily: string;
    titleFontWeight: number;
  
    titleStroke: string;
    titleShadow: string;
  
    overlay: string;
  
    contentWidth: number;
    contentPaddingLeft: number;
    contentPaddingRight: number;
  };
  
  const thumbnailThemes: Record<
    ThumbnailThemeId,
    ThumbnailTheme
  > = {
    documentary: {
      backgroundFallback:
        "radial-gradient(circle at 70% 40%, #34240f 0%, #0a0a0c 48%, #020203 100%)",
  
      titleColor: "#FFFFFF",
  
      subtitleColor:
        "rgba(255,255,255,0.78)",
  
      brandColor: "#D9B75E",
  
      titleFontFamily:
        "Arial, Helvetica, sans-serif",
  
      titleFontWeight: 900,
  
      titleStroke:
        "0px transparent",
  
      titleShadow: [
        "0 5px 2px rgba(0,0,0,0.9)",
        "0 12px 34px rgba(0,0,0,0.82)",
      ].join(", "),
  
      overlay: [
        "linear-gradient(",
        "90deg,",
        "rgba(2,3,5,0.94) 0%,",
        "rgba(2,3,5,0.82) 32%,",
        "rgba(2,3,5,0.36) 64%,",
        "rgba(2,3,5,0.08) 100%",
        ")",
      ].join(" "),
  
      contentWidth: 680,
      contentPaddingLeft: 74,
      contentPaddingRight: 46,
    },
  
    entertainment: {
      backgroundFallback:
        "linear-gradient(135deg, #21104f 0%, #90235b 48%, #ff7b26 100%)",
  
      titleColor: "#FFFFFF",
  
      subtitleColor:
        "rgba(255,255,255,0.9)",
  
      brandColor: "#FFD84D",
  
      titleFontFamily:
        "Arial Black, Arial, Helvetica, sans-serif",
  
      titleFontWeight: 950,
  
      titleStroke:
        "4px rgba(10,10,14,0.95)",
  
      titleShadow: [
        "0 6px 0 rgba(0,0,0,0.85)",
        "0 14px 28px rgba(0,0,0,0.58)",
        "0 0 22px rgba(255,216,77,0.3)",
      ].join(", "),
  
      overlay: [
        "linear-gradient(",
        "90deg,",
        "rgba(7,5,20,0.9) 0%,",
        "rgba(7,5,20,0.68) 40%,",
        "rgba(7,5,20,0.12) 78%,",
        "rgba(7,5,20,0.02) 100%",
        ")",
      ].join(" "),
  
      contentWidth: 720,
      contentPaddingLeft: 68,
      contentPaddingRight: 42,
    },
  };
  
  const normalizeTitle = (
    value: string,
  ): string[] => {
    const words = String(value ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  
    if (words.length === 0) {
      return [];
    }
  
    const maxLines = 4;
  
    const totalCharacters = words.reduce(
      (total, word) =>
        total + word.length,
      0,
    );
  
    const targetCharactersPerLine =
      Math.max(
        8,
        Math.ceil(
          totalCharacters /
            Math.min(maxLines, words.length),
        ),
      );
  
    const lines: string[] = [];
    let currentLine: string[] = [];
  
    for (const word of words) {
      const candidate = [
        ...currentLine,
        word,
      ].join(" ");
  
      const remainingWords =
        words.length -
        (
          lines.reduce(
            (total, line) =>
              total +
              line.split(/\s+/).length,
            0,
          ) +
          currentLine.length +
          1
        );
  
      const remainingLines =
        maxLines - lines.length - 1;
  
      const shouldPush =
        currentLine.length > 0 &&
        candidate.length >
          targetCharactersPerLine &&
        remainingLines > 0 &&
        remainingWords >= remainingLines;
  
      if (shouldPush) {
        lines.push(
          currentLine.join(" "),
        );
  
        currentLine = [word];
      } else {
        currentLine.push(word);
      }
    }
  
    if (currentLine.length > 0) {
      lines.push(
        currentLine.join(" "),
      );
    }
  
    /*
     * Dört satırdan fazlası oluşursa
     * kalan kelimeleri son satırda birleştir.
     */
    if (lines.length > maxLines) {
      return [
        ...lines.slice(
          0,
          maxLines - 1,
        ),
  
        lines
          .slice(maxLines - 1)
          .join(" "),
      ];
    }
  
    return lines;
  };
  
  const getTitleFontSize = ({
    title,
    lineCount,
    theme,
  }: {
    title: string;
    lineCount: number;
    theme: ThumbnailThemeId;
  }) => {
    const characterCount =
      title.trim().length;
  
    const themeAdjustment =
      theme === "entertainment"
        ? 4
        : 0;
  
    if (
      characterCount <= 18 &&
      lineCount <= 2
    ) {
      return 92 + themeAdjustment;
    }
  
    if (
      characterCount <= 32 &&
      lineCount <= 3
    ) {
      return 78 + themeAdjustment;
    }
  
    if (characterCount <= 48) {
      return 67 + themeAdjustment;
    }
  
    return 58 + themeAdjustment;
  };
  
  export const Thumbnail = ({
    title,
    subtitle,
    backgroundImageUrl,
    theme = "documentary",
    brandName = "ORVEN",
    showBrand = true,
    accentColor,
    backgroundPosition = "center",
    darkenBackground = 0.58,
    titleAlignment = "left",
  }: ThumbnailProps) => {
    const activeTheme =
      thumbnailThemes[theme];
  
    const resolvedAccentColor =
      accentColor ||
      activeTheme.brandColor;
  
    const titleLines =
      normalizeTitle(title);
  
    const titleFontSize =
      getTitleFontSize({
        title,
        lineCount:
          titleLines.length,
        theme,
      });
  
    const resolvedDarkness =
      Math.min(
        0.92,
        Math.max(
          0,
          Number.isFinite(
            darkenBackground,
          )
            ? darkenBackground
            : 0.58,
        ),
      );
  
    return (
      <AbsoluteFill
        style={{
          overflow: "hidden",
          background:
            activeTheme.backgroundFallback,
        }}
      >
        {backgroundImageUrl ? (
          <AbsoluteFill>
            <Img
              src={backgroundImageUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition:
                  backgroundPosition,
                transform: "scale(1.025)",
                filter:
                  theme ===
                  "documentary"
                    ? "saturate(0.92) contrast(1.08)"
                    : "saturate(1.18) contrast(1.06)",
              }}
            />
          </AbsoluteFill>
        ) : null}
  
        <AbsoluteFill
          style={{
            backgroundColor:
              `rgba(0,0,0,${resolvedDarkness * 0.34})`,
          }}
        />
  
        <AbsoluteFill
          style={{
            background:
              activeTheme.overlay,
          }}
        />
  
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 34%, transparent 70%, rgba(0,0,0,0.48) 100%)",
          }}
        />
  
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 74% 44%, transparent 0%, transparent 34%, rgba(0,0,0,0.35) 100%)",
          }}
        />
  
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems:
              titleAlignment ===
              "left"
                ? "flex-start"
                : titleAlignment ===
                    "right"
                  ? "flex-end"
                  : "center",
  
            paddingLeft:
              activeTheme
                .contentPaddingLeft,
  
            paddingRight:
              activeTheme
                .contentPaddingRight,
  
            paddingTop: 44,
            paddingBottom: 42,
          }}
        >
          <div
            style={{
              width:
                activeTheme.contentWidth,
  
              display: "flex",
              flexDirection: "column",
  
              alignItems:
                titleAlignment ===
                "left"
                  ? "flex-start"
                  : titleAlignment ===
                      "right"
                    ? "flex-end"
                    : "center",
  
              textAlign:
                titleAlignment,
            }}
          >
            {showBrand ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius:
                      "50%",
                    display: "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
  
                    color: "#080808",
                    backgroundColor:
                      resolvedAccentColor,
  
                    fontFamily:
                      "Georgia, serif",
                    fontSize: 29,
                    fontWeight: 800,
  
                    boxShadow:
                      `0 0 22px ${resolvedAccentColor}55`,
                  }}
                >
                  O
                </div>
  
                <div
                  style={{
                    color:
                      resolvedAccentColor,
  
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
  
                    fontSize: 22,
                    fontWeight: 800,
  
                    letterSpacing: 7,
  
                    textTransform:
                      "uppercase",
  
                    textShadow:
                      "0 4px 12px rgba(0,0,0,0.75)",
                  }}
                >
                  {brandName}
                </div>
              </div>
            ) : null}
  
            <div
              style={{
                width: 94,
                height: 5,
                marginBottom: 22,
                borderRadius: 999,
  
                backgroundColor:
                  resolvedAccentColor,
  
                boxShadow:
                  `0 0 18px ${resolvedAccentColor}66`,
              }}
            />
  
            <div
              style={{
                color:
                  activeTheme.titleColor,
  
                fontFamily:
                  activeTheme
                    .titleFontFamily,
  
                fontSize:
                  titleFontSize,
  
                fontWeight:
                  activeTheme
                    .titleFontWeight,
  
                lineHeight: 0.93,
  
                letterSpacing:
                  theme ===
                  "entertainment"
                    ? -3.5
                    : -2.8,
  
                textTransform:
                  "uppercase",
  
                textShadow:
                  activeTheme
                    .titleShadow,
  
                WebkitTextStroke:
                  activeTheme
                    .titleStroke,
  
                paintOrder:
                  "stroke fill",
  
                wordBreak:
                  "normal",
              }}
            >
              {titleLines.map(
                (line, index) => (
                  <div
                    key={`${line}-${index}`}
                    style={{
                      whiteSpace:
                        "nowrap",
  
                      marginTop:
                        index === 0
                          ? 0
                          : 5,
                    }}
                  >
                    {line}
                  </div>
                ),
              )}
            </div>
  
            {subtitle?.trim() ? (
              <div
                style={{
                  marginTop: 22,
                  maxWidth: 610,
  
                  color:
                    activeTheme
                      .subtitleColor,
  
                  fontFamily:
                    "Arial, Helvetica, sans-serif",
  
                  fontSize:
                    theme ===
                    "entertainment"
                      ? 27
                      : 24,
  
                  fontWeight:
                    theme ===
                    "entertainment"
                      ? 700
                      : 500,
  
                  lineHeight: 1.22,
  
                  letterSpacing:
                    theme ===
                    "documentary"
                      ? 0.4
                      : 0,
  
                  textShadow:
                    "0 4px 16px rgba(0,0,0,0.9)",
                }}
              >
                {subtitle.trim()}
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };