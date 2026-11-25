import React from "react";
import { Composition, registerRoot } from "remotion";
import { JetSample, JET_FRAMES } from "./videos/jet/Jet";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "JetSample",
    component: JetSample,
    durationInFrames: JET_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
);
registerRoot(Root);
