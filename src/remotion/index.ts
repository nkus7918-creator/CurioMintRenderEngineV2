import { registerRoot } from "remotion";
import { createElement, Fragment } from "react";

import { RemotionRoot } from "../templates/curiomint-scenes/Root";
import { DocumentaryRoot } from "../templates/curiomint-documentary/Root";

const CurioMintRoot = () =>
  createElement(
    Fragment,
    null,
    createElement(RemotionRoot),
    createElement(DocumentaryRoot),
  );

registerRoot(CurioMintRoot);