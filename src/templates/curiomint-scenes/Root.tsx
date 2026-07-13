import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import type { HelloWorldProps } from "./compositions/HelloWorld";

export const RemotionRoot = () => {
  return (
    <Composition
      id="CurioMintScenes"
      component={HelloWorld}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={
        {
          title: "Hello CurioMint",
          subtitle: "Render Engine V2",
        } satisfies HelloWorldProps
      }
    />
  );
};