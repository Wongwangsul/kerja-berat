import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, HiuRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";
import timing from "./timing.json";

export const HIU_FRAMES = timing.frames;

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 0.2, 11.5] }}>
      <primitive object={group} />
      <Rig<HiuRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#0f4d7a", fogNear: 35, fogFar: 110,
          hemiSky: "#8fc8ee", hemiGround: "#143d5c", hemiInt: 1.0,
          sunColor: "#dff2ff", sunInt: 1.3, sunPos: [-6, 26, 10],
          fillColor: "#6fa8cf", fillInt: 0.4,
        }}
      />
    </ThreeCanvas>
  );
};

export const HiuBintangLaut: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0e4f7d" }}>
    <World />
  </AbsoluteFill>
);
