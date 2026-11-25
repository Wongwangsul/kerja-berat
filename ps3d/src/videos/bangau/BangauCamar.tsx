import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, BangauRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const BANGAU_FRAMES = 1696;

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
      <Rig<BangauRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#f7a86b", fogNear: 40, fogFar: 120,
          hemiSky: "#ffd9a8", hemiGround: "#6b8a7a", hemiInt: 1.05,
          sunColor: "#ffcf8a", sunInt: 1.8, sunPos: [-14, 16, 8],
          fillColor: "#ffd9c0", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const BangauCamar: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#ff9e57" }}>
    <World />
  </AbsoluteFill>
);
