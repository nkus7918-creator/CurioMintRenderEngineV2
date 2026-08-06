import {
    Composition,
  } from "remotion";
  
  import {
    Thumbnail,
  } from "./Thumbnail";
  
  import {
    defaultThumbnailProps,
  } from "./defaultProps";
  
  export const ThumbnailRoot = () => {
    return (
      <Composition
        id="orven-thumbnail"
        component={Thumbnail}
        width={1280}
        height={720}
        fps={30}
        durationInFrames={1}
        defaultProps={
          defaultThumbnailProps
        }
      />
    );
  };