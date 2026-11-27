import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorld, KelinciRefs } from "./world";
import { poseFrame, TOTAL_FRAMES } from "./story";
import { Rig } from "../../shared/Rig";
import { sstep } from "../../shared/kit";

export const KELINCI_FRAMES = TOTAL_FRAMES;

/** Warm shift for the late-afternoon light: fog + scene background lerp
 *  blue sky → warm across s5 (frames 13747–16156). Runs inside the canvas. */
function Atmosphere() {
  const frame = useCurrentFrame();
  const scene = useThree((s) => s.scene);
  const { blueBg, warmBg, blueFog, warmFog } = useMemo(() => ({
    blueBg: new THREE.Color("#8ec9ee"),
    warmBg: new THREE.Color("#f2b879"),
    blueFog: new THREE.Color("#d7ecfa"),
    warmFog: new THREE.Color("#f0c090"),
  }), []);
  const w = sstep(13747, 16156, frame);
  const bg = new THREE.Color().lerpColors(blueBg, warmBg, w);
  const fog = new THREE.Color().lerpColors(blueFog, warmFog, w);
  if (scene.background instanceof THREE.Color) scene.background.copy(bg);
  else scene.background = bg;
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(fog);
  return null;
}

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 1.35, 11.5] }}>
      <primitive object={group} />
      <Rig<KelinciRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#d7ecfa", fogNear: 38, fogFar: 115,
          hemiSky: "#cfe6ff", hemiGround: "#8a9a5a", hemiInt: 1.05,
          sunColor: "#fff1d6", sunInt: 1.7, sunPos: [-14, 22, 10],
          fillColor: "#d8ecff", fillInt: 0.35,
        }}
      />
      <Atmosphere />
    </ThreeCanvas>
  );
};

export const KelinciRubahPeta: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#8ec9ee" }}>
    <World />
  </AbsoluteFill>
);
