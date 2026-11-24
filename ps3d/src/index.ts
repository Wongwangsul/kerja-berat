import React from "react";
import { Composition, registerRoot } from "remotion";
import { RubahLembut, RUBAH_FRAMES } from "./videos/rubah/Rubah";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "RubahLembut",
    component: RubahLembut,
    durationInFrames: RUBAH_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
);
registerRoot(Root);
