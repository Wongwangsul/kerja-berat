import React from "react";
import { Composition, registerRoot } from "remotion";
import { TacomaShort, TACOMA_FRAMES } from "./videos/tacoma/Tacoma";

const Root: React.FC = () => React.createElement(Composition, {
  id: "TacomaShort",
  component: TacomaShort,
  durationInFrames: TACOMA_FRAMES,
  fps: 30,
  width: 1080,
  height: 1920,
});
registerRoot(Root);
