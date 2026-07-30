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

  title: "Roma Yolları Neden Bu Kadar Dayanıklıydı?",
  subtitle: "CurioMint Documentary",

  durationInSeconds: 18,

  sections: [
    {
      id: "hook",
      title: "2000 Yıllık Yollar",
      subtitle:
        "Roma yollarının bazı bölümleri bugün hâlâ ayakta.",
      narrationText:
        "Roma yollarının bazı bölümleri bugün hâlâ ayakta.",
      durationInSeconds: 4,

      titleAnimation: {
        preset: "fadeUp",
        durationInSeconds: 0.6,
      },

      overlay: {
        preset: "cinematic",
        opacity: 1,
      },

      media: [
        {
          id: "hook-image",
          type: "image",
          url: staticFile("test-images/image1.jpg"),

          motion: {
            preset: "slowPush",
            intensity: 0.7,
          },

          transition: {
            type: "fade",
            durationInSeconds: 0.6,
          },
        },
      ],
    },

    {
      id: "layered-structure",
      title: "Tek Katman Değildi",
      subtitle:
        "Yollar taş, çakıl ve kumdan oluşan birden fazla katmanla inşa ediliyordu.",
      narrationText:
        "Yollar taş, çakıl ve kumdan oluşan birden fazla katmanla inşa ediliyordu.",
      durationInSeconds: 5,

      titleAnimation: {
        preset: "slideLeft",
        durationInSeconds: 0.5,
      },

      overlay: {
        preset: "minimal",
        opacity: 1,
      },

      media: [
        {
          id: "layered-road-image",
          type: "image",
          url: staticFile("test-images/image2.jpg"),

          motion: {
            preset: "driftLeft",
            intensity: 0.6,
          },

          transition: {
            type: "slideLeft",
            durationInSeconds: 0.5,
          },
        },
      ],
    },

    {
      id: "drainage",
      title: "Suyun Birikmesi Engellendi",
      subtitle:
        "Eğimli yüzey ve drenaj kanalları, yağmur suyunu yolun dışına taşıyordu.",
      narrationText:
        "Eğimli yüzey ve drenaj kanalları, yağmur suyunu yolun dışına taşıyordu.",
      durationInSeconds: 5,

      titleAnimation: {
        preset: "slideRight",
        durationInSeconds: 0.5,
      },

      overlay: {
        preset: "history",
        opacity: 0.9,
      },

      media: [
        {
          id: "drainage-image",
          type: "image",
          url: staticFile("test-images/image3.jpg"),

          motion: {
            preset: "driftRight",
            intensity: 0.6,
          },

          transition: {
            type: "slideRight",
            durationInSeconds: 0.5,
          },
        },
      ],
    },

    {
      id: "ending",
      title: "Mühendislik Mirası",
      subtitle:
        "Dayanıklılığın sırrı yalnızca taşlarda değil, doğru tasarımdaydı.",
      narrationText:
        "Dayanıklılığın sırrı yalnızca taşlarda değil, doğru tasarımdaydı.",
      durationInSeconds: 4,

      titleAnimation: {
        preset: "scaleIn",
        durationInSeconds: 0.6,
      },

      overlay: {
        preset: "cinematic",
        opacity: 1,
      },

      media: [
        {
          id: "ending-image",
          type: "image",
          url: staticFile("test-images/image4.jpg"),

          motion: {
            preset: "slowPull",
            intensity: 0.7,
          },

          transition: {
            type: "zoom",
            durationInSeconds: 0.6,
          },
        },
      ],
    },
  ],

  introDurationInSeconds: 0,
  outroDurationInSeconds: 0,

  narrationVolume: 1,

  musicUrl: "",
  musicVolume: 0,

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