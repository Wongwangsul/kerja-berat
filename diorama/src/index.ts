import React from "react";
import { Composition, registerRoot } from "remotion";
import { DioramaMini, DIORAMA_FRAMES } from "./videos/diorama/Diorama";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "DioramaMini",
    component: DioramaMini,
    durationInFrames: DIORAMA_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
);
registerRoot(Root);
