import React from "react";
import { Composition, registerRoot } from "remotion";
import { RelStickman, REL_FRAMES } from "./videos/rel/Rel";
import { RelCepat } from "./videos/rel/RelCepat";
import { TOTAL_FRAMES } from "./videos/rel/meta";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "RelStickman",
    component: RelStickman,
    durationInFrames: REL_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
  React.createElement(Composition, {
    id: "RelCepat",
    component: RelCepat,
    durationInFrames: TOTAL_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
);
registerRoot(Root);
