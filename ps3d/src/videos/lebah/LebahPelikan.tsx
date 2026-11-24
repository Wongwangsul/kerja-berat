import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, LebahRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const LEBAH_FRAMES = 1506;

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
      <Rig<LebahRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#cfe8f7", fogNear: 40, fogFar: 120,
          hemiSky: "#cfe6ff", hemiGround: "#8a9a5a", hemiInt: 1.05,
          sunColor: "#fff1d6", sunInt: 1.7, sunPos: [-14, 22, 10],
          fillColor: "#d8ecff", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const LebahPelikan: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#7ec3ef" }}>
    <World />
  </AbsoluteFill>
);
