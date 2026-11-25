import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorld, WorldRefs } from "./world";
import { poseFrame } from "./story";

export const REL_FRAMES = 300;

const Rig: React.FC<{ refs: WorldRefs }> = ({ refs }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.fog = new THREE.Fog(new THREE.Color("#f0c9a0"), 42, 135);
    const hemi = new THREE.HemisphereLight(0xffe3c0, 0x9a6a4a, 0.95);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(amb);
    const fill = new THREE.DirectionalLight(0xd8ecff, 0.3);
    fill.position.set(40, 24, 60); scene.add(fill);
    const sun = new THREE.DirectionalLight(0xffd9a8, 1.75);
    sun.position.set(-13, 20, 11);
    sun.target.position.set(0, 0, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 2; sc.far = 90;
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
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 400, position: [5.9, 2.0, 10.8] }}>
      <primitive object={group} />
      <Rig refs={refs} />
    </ThreeCanvas>
  );
};

export const RelStickman: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#a8d4f0" }}>
    <World />
  </AbsoluteFill>
);
