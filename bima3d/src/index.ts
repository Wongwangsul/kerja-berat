import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { BimaTangga, BIMA_FRAMES } from "./videos/bima/Bima";

const Root: React.FC = () => React.createElement(React.Fragment, null,
  React.createElement(Composition, {
    id: "BridgeShort",
    component: BridgeShort,
    durationInFrames: BRIDGE_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
  React.createElement(Composition, {
    id: "BimaTangga",
    component: BimaTangga,
    durationInFrames: BIMA_FRAMES,
    fps: 30,
    width: 1080,
    height: 1920,
  }),
);
registerRoot(Root);
