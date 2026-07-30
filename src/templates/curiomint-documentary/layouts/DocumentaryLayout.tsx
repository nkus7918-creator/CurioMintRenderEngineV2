import { AbsoluteFill } from "remotion";

import { OverlayRenderer } from "../renderers/OverlayRenderer";
import { SubtitleRenderer } from "../renderers/SubtitleRenderer";
import { TitleRenderer } from "../renderers/TitleRenderer";
import { SectionMedia } from "../components/SectionMedia";

import type { DocumentarySection } from "../types";

type DocumentaryLayoutProps = {
  section: DocumentarySection;
  sectionStartFrame: number;
};

export const DocumentaryLayout = ({
  section,
  sectionStartFrame,
}: DocumentaryLayoutProps) => {
  return (
    <AbsoluteFill>
      <SectionMedia
        section={section}
        sectionStartFrame={sectionStartFrame}
      />

      <OverlayRenderer overlay={section.overlay} />

      <TitleRenderer
        title={section.title}
        animation={section.titleAnimation}
      />

      <SubtitleRenderer
        text={section.narrationText ?? section.subtitle}
        subtitleWords={section.subtitleTiming}
      />
    </AbsoluteFill>
  );
};