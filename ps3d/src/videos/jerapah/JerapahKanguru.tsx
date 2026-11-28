import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, JerapahRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";
import timing from "./timing.json";

export const JERAPAH_FRAMES = timing.frames;

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
      <Rig<JerapahRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#f2e2b8", fogNear: 40, fogFar: 120,
          hemiSky: "#cfe6ff", hemiGround: "#a3c256", hemiInt: 1.05,
          sunColor: "#fff3c4", sunInt: 1.7, sunPos: [-14, 22, 10],
          fillColor: "#d8ecff", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const JerapahKanguru: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#a8d8f0" }}>
    <World />
  </AbsoluteFill>
);
