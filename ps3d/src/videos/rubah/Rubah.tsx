import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorld, WorldRefs } from "./world";
import { poseFrame } from "./story";

export const RUBAH_FRAMES = 150;

const Rig: React.FC<{ refs: WorldRefs }> = ({ refs }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.fog = new THREE.Fog(new THREE.Color("#d7ecfa"), 38, 115);
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a9a5a, 1.05);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(amb);
    const fill = new THREE.DirectionalLight(0xd8ecff, 0.35);
    fill.position.set(40, 24, 60); scene.add(fill);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.7);
    sun.position.set(-14, 22, 10);
    sun.target.position.set(2, 0, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -16; sc.near = 2; sc.far = 90;
    sun.shadow.bias = -0.0004;
    (sun.shadow as THREE.DirectionalLightShadow & { radius: number }).radius = 4;
    scene.add(sun); scene.add(sun.target);
  }, [scene]);
  poseFrame(frame, refs, camera as THREE.PerspectiveCamera);
  (camera as THREE.PerspectiveCamera).fov = 42;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 300, position: [0, 2.95, 9.6] }}>
      <primitive object={group} />
      <Rig refs={refs} />
    </ThreeCanvas>
  );
};

export const RubahLembut: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#8ec9ee" }}>
    <World />
  </AbsoluteFill>
);
