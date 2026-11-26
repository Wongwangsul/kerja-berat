import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, FlamingoRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const FLAMINGO_FRAMES = 1102;

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 2.0, 11] }}>
      <primitive object={group} />
      <Rig<FlamingoRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#ffe3b8", fogNear: 40, fogFar: 120,
          hemiSky: "#ffe9c4", hemiGround: "#7a9a6a", hemiInt: 1.05,
          sunColor: "#ffdf9e", sunInt: 1.8, sunPos: [-14, 20, 10],
          fillColor: "#ffe9d0", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const FlamingoPipit: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#ffd9a0" }}>
    <World />
  </AbsoluteFill>
);
