import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, KelinciRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const KELINCI_FRAMES = 1742;

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 2.6, 11.5] }}>
      <primitive object={group} />
      <Rig<KelinciRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#dcecc9", fogNear: 40, fogFar: 120,
          hemiSky: "#d8ecff", hemiGround: "#a8933f", hemiInt: 1.05,
          sunColor: "#fff1d6", sunInt: 1.7, sunPos: [-14, 22, 10],
          fillColor: "#ffeecf", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const KelinciSinga: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#87c5ee" }}>
    <World />
  </AbsoluteFill>
);
