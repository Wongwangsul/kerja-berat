import React from "react";
import { Composition, registerRoot } from "remotion";
import { LumbaPenyuMatahari, LUMBA_FRAMES } from "./videos/lumba/LumbaPenyuMatahari";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "LumbaPenyuMatahari",
    component: LumbaPenyuMatahari,
    durationInFrames: LUMBA_FRAMES,
    fps: 30,
    width: 1920,
    height: 1080,
  }),
);
registerRoot(Root);
