import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, BadakRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

export const BADAK_FRAMES = 1698;

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 2.5, 11.5] }}>
      <primitive object={group} />
      <Rig<BadakRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#bcd9a8", fogNear: 40, fogFar: 120,
          hemiSky: "#cfe8c0", hemiGround: "#3d6b34", hemiInt: 1.0,
          sunColor: "#fff3cf", sunInt: 1.6, sunPos: [12, 24, 10],
          fillColor: "#cfe8d8", fillInt: 0.3,
        }}
      />
    </ThreeCanvas>
  );
};

export const BadakJawa: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#5d8f4e" }}>
    <World />
  </AbsoluteFill>
);
