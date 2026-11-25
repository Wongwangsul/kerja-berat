import React from "react";
import { Composition, registerRoot } from "remotion";
import { AnakSungai, SUNGAI_FRAMES } from "./videos/sungai/AnakSungai";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "AnakSungai",
    component: AnakSungai,
    durationInFrames: SUNGAI_FRAMES,
    fps: 30,
    width: 1920,
    height: 1080,
  }),
);
registerRoot(Root);
