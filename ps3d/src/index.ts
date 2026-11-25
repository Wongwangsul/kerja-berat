import React from "react";
import { Composition, registerRoot } from "remotion";
import { KucingJerapah, KUCING_FRAMES } from "./videos/kucing/KucingJerapah";
import { UburUburHiu, UBURUBUR_FRAMES } from "./videos/uburubur/UburUburHiu";
import { BangauCamar, BANGAU_FRAMES } from "./videos/bangau/BangauCamar";

const COMPS = [
  { id: "KucingJerapah", component: KucingJerapah, durationInFrames: KUCING_FRAMES },
  { id: "UburUburHiu", component: UburUburHiu, durationInFrames: UBURUBUR_FRAMES },
  { id: "BangauCamar", component: BangauCamar, durationInFrames: BANGAU_FRAMES },
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
