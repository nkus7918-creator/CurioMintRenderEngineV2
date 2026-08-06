import {
  registerRoot,
} from "remotion";

import {
  createElement,
  Fragment,
} from "react";

import {
  RemotionRoot,
} from "../templates/curiomint-scenes/Root";

import {
  DocumentaryRoot,
} from "../templates/curiomint-documentary/Root";

import {
  ThumbnailRoot,
} from "../templates/thumbnail/Root";

const CurioMintRoot = () =>
  createElement(
    Fragment,
    null,
    createElement(
      RemotionRoot,
    ),
    createElement(
      DocumentaryRoot,
    ),
    createElement(
      ThumbnailRoot,
    ),
  );

registerRoot(
  CurioMintRoot,
);