import React from "react";
import { Composition, registerRoot } from "remotion";
import { PenguinUdang, PENGUIN_FRAMES } from "./videos/penguin/PenguinUdang";
import { FlamingoPipit, FLAMINGO_FRAMES } from "./videos/flamingo/FlamingoPipit";
import { AnjingPanda, ANJING_FRAMES } from "./videos/anjing/AnjingPanda";

const COMPS = [
  { id: "PenguinUdang", component: PenguinUdang, durationInFrames: PENGUIN_FRAMES },
  { id: "FlamingoPipit", component: FlamingoPipit, durationInFrames: FLAMINGO_FRAMES },
  { id: "AnjingPanda", component: AnjingPanda, durationInFrames: ANJING_FRAMES },
] as const;

const Root: React.FC = () => React.createElement(React.Fragment, null,
  ...COMPS.map((c) => React.createElement(Composition, {
    id: c.id,
    component: c.component,
    durationInFrames: c.durationInFrames,
    fps: 30,
    width: 1080,
    height: 1920,
  })),
);
registerRoot(Root);
