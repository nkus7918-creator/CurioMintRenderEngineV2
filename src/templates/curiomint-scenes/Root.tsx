import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Hello CurioMint",
          subtitle: "Render Engine V2",
        }}
      />
    </>
  );
};