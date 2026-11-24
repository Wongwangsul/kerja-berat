import React from "react";
import { Composition, registerRoot } from "remotion";
import { LebahPelikan, LEBAH_FRAMES } from "./videos/lebah/LebahPelikan";
import { KelinciSinga, KELINCI_FRAMES } from "./videos/kelinci/KelinciSinga";
import { KudaLautPaus, KUDALAUT_FRAMES } from "./videos/kudalaut/KudaLautPaus";
import { BadakJawa, BADAK_FRAMES } from "./videos/badak/BadakJawa";

const COMPS = [
  { id: "LebahPelikan", component: LebahPelikan, durationInFrames: LEBAH_FRAMES },
  { id: "KelinciSinga", component: KelinciSinga, durationInFrames: KELINCI_FRAMES },
  { id: "KudaLautPaus", component: KudaLautPaus, durationInFrames: KUDALAUT_FRAMES },
  { id: "BadakJawa", component: BadakJawa, durationInFrames: BADAK_FRAMES },
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
