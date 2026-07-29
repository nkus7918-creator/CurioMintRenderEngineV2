import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import { Documentary } from "./compositions/Documentary";
import type { DocumentaryProps } from "./types";

import { ThemeProvider } from "./themes/ThemeContext";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<
  DocumentaryProps
> = ({ props }) => {
  const durationInSeconds =
    typeof props.durationInSeconds === "number" &&
      props.durationInSeconds > 0
      ? props.durationInSeconds
      : 30;

  return {
    durationInFrames: Math.ceil(
      durationInSeconds * FPS,
    ),
  };
};

const defaultProps: DocumentaryProps = {
  theme: "documentary-dark",
  title: "The Empire That Changed History",
  subtitle: "A CurioMint Documentary",
  durationInSeconds: 30,

  sections: [
    {
      id: "intro",
      title: "The Beginning",
      subtitle: "How a small state became an empire",
      narrationText:
        "Every empire begins with a single turning point.",
      narrationUrl: "",
      durationInSeconds: 10,
      media: [
        {
          id: "intro-image",
          type: "image",
          url: "https://images.pexels.com/photos/161815/architecture-building-old-historical-161815.jpeg",
        },
      ],
    },
    {
      id: "rise",
      title: "The Rise",
      subtitle: "Power, strategy and expansion",
      narrationText:
        "Its influence spread across cities and continents.",
      narrationUrl: "",
      durationInSeconds: 10,
      media: [
        {
          id: "rise-image",
          type: "image",
          url: "https://images.pexels.com/photos/2087391/pexels-photo-2087391.jpeg",
        },
      ],
    },
    {
      id: "legacy",
      title: "The Legacy",
      subtitle: "The effects can still be seen today",
      narrationText:
        "Centuries later, its legacy still shapes the modern world.",
      narrationUrl: "",
      durationInSeconds: 10,
      media: [
        {
          id: "legacy-image",
          type: "image",
          url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
        },
      ],
    },
  ],

  introDurationInSeconds: 0,
  outroDurationInSeconds: 0,

  narrationVolume: 1,
  musicUrl: "",
  musicVolume: 0.1,

  logoUrl: "",
};

const ThemedDocumentary = (
  props: React.ComponentProps<typeof Documentary>,
) => {
  return (
    <ThemeProvider theme={props.theme ?? "documentary-dark"}>
      <Documentary {...props} />
    </ThemeProvider>
  );
};

export const DocumentaryRoot = () => {
  return (
    <Composition
      id="curiomint-documentary"
      component={ThemedDocumentary}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={30 * FPS}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};