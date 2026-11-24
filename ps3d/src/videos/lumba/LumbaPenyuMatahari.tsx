import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorld, LumbaRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";
import { sstep } from "../../shared/kit";

export const LUMBA_FRAMES = 17557;

/** Warm shift for the sunrise: fog + scene background lerp blue → warm
 *  across s5 (frames 14392–16800). Runs inside the canvas every frame. */
function Atmosphere() {
  const frame = useCurrentFrame();
  const scene = useThree((s) => s.scene);
  const { blueBg, warmBg, blueFog, warmFog } = useMemo(() => ({
    blueBg: new THREE.Color("#155a8a"),
    warmBg: new THREE.Color("#e8975a"),
    blueFog: new THREE.Color("#1a6a9e"),
    warmFog: new THREE.Color("#dd8046"),
  }), []);
  const w = sstep(14392, 16800, frame);
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
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, -0.2, 11.5] }}>
      <primitive object={group} />
      <Rig<LumbaRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#1a6a9e", fogNear: 35, fogFar: 110,
          hemiSky: "#9fd4f2", hemiGround: "#1d4a68", hemiInt: 1.0,
          sunColor: "#e8f6ff", sunInt: 1.4, sunPos: [-8, 24, 12],
          fillColor: "#7fb8dd", fillInt: 0.4,
        }}
      />
      <Atmosphere />
    </ThreeCanvas>
  );
};

export const LumbaPenyuMatahari: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#155a8a" }}>
    <World />
  </AbsoluteFill>
);
