import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorldFast, FastRefs } from "./worldfast";
import { poseFast } from "./faststory";
import { BOUNDS, WORDS } from "./meta";

const Rig: React.FC<{ refs: FastRefs }> = ({ refs }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.fog = new THREE.Fog(new THREE.Color("#f0c9a0"), 42, 135);
    scene.add(new THREE.HemisphereLight(0xffe3c0, 0x9a6a4a, 0.95));
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
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
  poseFast(frame, refs, camera as THREE.PerspectiveCamera, BOUNDS);
  (camera as THREE.PerspectiveCamera).fov = 42;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildWorldFast(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 400, position: [3.6, 1.15, 10.2] }}>
      <primitive object={group} />
      <Rig refs={refs} />
    </ThreeCanvas>
  );
};

// Word-by-word captions in the reference style: one bold word at a time,
// white with a heavy black outline, centred in the safe zone (~57% height).
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = WORDS.find((w) => t >= w.start && t < w.end);
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: "54%",
      display: "flex", justifyContent: "center", pointerEvents: "none",
    }}>
      <span style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 900, fontSize: 92, color: "#ffffff",
        WebkitTextStroke: "10px #111111",
        paintOrder: "stroke fill",
        textShadow: "0 6px 0 rgba(0,0,0,0.9)",
        letterSpacing: 1,
      }}>
        {active.w}
      </span>
    </div>
  );
};

export const RelCepat: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#a8d4f0" }}>
    <World />
    <Audio src={staticFile("narasi.ogg")} />
    <Audio src={staticFile("musik.ogg")} volume={0.22} />
    <Captions />
  </AbsoluteFill>
);
