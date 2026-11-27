import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { buildWorld, SingaRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";

// Final dari timing.json (37,57 dtk — aturan 30–40 dtk).
export const SINGA_FRAMES = 1127;

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
      <Rig<SingaRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#bfe3f2", fogNear: 40, fogFar: 120,
          hemiSky: "#cfeaff", hemiGround: "#5da843", hemiInt: 1.05,
          sunColor: "#fff2c0", sunInt: 1.8, sunPos: [-14, 16, 8],
          fillColor: "#d8ecff", fillInt: 0.35,
        }}
      />
    </ThreeCanvas>
  );
};

export const SingaMonyet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#8ecfeb" }}>
    <World />
  </AbsoluteFill>
);
