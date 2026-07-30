import { Composition, staticFile } from "remotion";
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
  durationInSeconds: 12,

  sections: [
    {
      id: "fade-transition",
      title: "Fade",
      subtitle: "Opacity transition test",
      narrationText: "",
      narrationUrl: "",
      durationInSeconds: 3,
      media: [
        {
          id: "fade-image",
          type: "image",
          url: staticFile("test-images/image1.jpg"),
          transition: {
            type: "fade",
            durationInSeconds: 0.5,
          },
          motion: {
            preset: "kenBurns",
            intensity: 1,

            overlap: {
              positionDelay: 0.08,
              rotationDelay: 0.16,
            },
          },
        },
      ],
    },

    {
      id: "slide-left-transition",
      title: "Slide Left",
      subtitle: "Horizontal transition test",
      narrationText: "",
      narrationUrl: "",
      durationInSeconds: 3,
      media: [
        {
          id: "slide-left-image",
          type: "image",
          url: staticFile("test-images/image2.jpg"),
          transition: {
            type: "slideLeft",
            durationInSeconds: 0.5,
          },
          motion: {
            preset: "kenBurns",
            intensity: 0.5,
          },
        },
      ],
    },

    {
      id: "slide-right-transition",
      title: "Slide Right",
      subtitle: "Opposite horizontal transition",
      narrationText: "",
      narrationUrl: "",
      durationInSeconds: 3,
      media: [
        {
          id: "slide-right-image",
          type: "image",
          url: staticFile("test-images/image1.jpg"),
          transition: {
            type: "slideRight",
            durationInSeconds: 0.5,
          },
          motion: {
            preset: "kenBurns",
            intensity: 0.5,
          },
        },
      ],
    },

    {
      id: "zoom-transition",
      title: "Zoom",
      subtitle: "Scale transition test",
      narrationText: "",
      narrationUrl: "",
      durationInSeconds: 3,
      media: [
        {
          id: "zoom-image",
          type: "image",
          url: staticFile("test-images/image2.jpg"),
          transition: {
            type: "zoom",
            durationInSeconds: 0.5,
          },
          motion: {
            preset: "kenBurns",
            intensity: 0.5,
          },
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