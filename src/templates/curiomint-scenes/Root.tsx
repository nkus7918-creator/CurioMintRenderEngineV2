import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import type { HelloWorldProps } from "./compositions/HelloWorld";

export const RemotionRoot = () => {
  return (
    <Composition
      id="CurioMintScenes"
      component={HelloWorld}
      durationInFrames={855}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={
        {
          title: "CurioMint",
          hook: "Bunu daha önce duymuş muydun?",
          fact1: "İlk ilginç bilgi burada gösterilecek.",
          fact2: "İkinci ilginç bilgi burada gösterilecek.",
      
          enteringVideoUrl:
            "https://remotion.media/BigBuckBunny.mp4",
      
          video1Url:
            "https://remotion.media/BigBuckBunny.mp4",
      
          video2Url:
            "https://remotion.media/BigBuckBunny.mp4",
            hookAudioUrl: "https://remotion.media/audio.mp3",
            fact1AudioUrl: "https://remotion.media/audio.mp3",
            fact2AudioUrl: "https://remotion.media/audio.mp3",
        } satisfies HelloWorldProps
      }
    />
  );
};