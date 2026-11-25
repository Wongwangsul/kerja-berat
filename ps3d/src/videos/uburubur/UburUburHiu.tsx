import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, UburUburRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const UBURUBUR_FRAMES = 1530;

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, -0.2, 11.5] }}>
      <primitive object={group} />
      <Rig<UburUburRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#1a6a9e", fogNear: 35, fogFar: 110,
          hemiSky: "#9fd4f2", hemiGround: "#1d4a68", hemiInt: 1.0,
          sunColor: "#e8f6ff", sunInt: 1.4, sunPos: [-8, 24, 12],
          fillColor: "#7fb8dd", fillInt: 0.4,
        }}
      />
    </ThreeCanvas>
  );
};

export const UburUburHiu: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#155a8a" }}>
    <World />
  </AbsoluteFill>
);
