import React from "react";
import { Composition, registerRoot } from "remotion";
import { KelinciRubahPeta, KELINCI_FRAMES } from "./videos/kelinci/KelinciRubahPeta";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "KelinciRubahPeta",
    component: KelinciRubahPeta,
    durationInFrames: KELINCI_FRAMES,
    fps: 30,
    width: 1920,
    height: 1080,
  }),
);
registerRoot(Root);
