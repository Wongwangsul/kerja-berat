import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildJetWorld, JetRefs } from "./world";
import { poseJet } from "./story";
import { WORDS } from "./meta";

export const JET_FRAMES = 348;

const Rig: React.FC<{ refs: JetRefs }> = ({ refs }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.background = new THREE.Color("#8fb6d9");
    scene.fog = new THREE.Fog(new THREE.Color("#f6c48a"), 55, 160);
    scene.add(new THREE.HemisphereLight(0xffe7c4, 0x7a86a0, 1.0));
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xffbe78, 2.0);
    sun.position.set(-18, 7, -30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 5; sc.far = 90;
    sun.shadow.bias = -0.0004;
    scene.add(sun); scene.add(sun.target);
    const rim = new THREE.DirectionalLight(0xbfd9ff, 0.55);
    rim.position.set(14, 4, 18);
    scene.add(rim);
  }, [scene]);
  poseJet(frame, refs, camera as THREE.PerspectiveCamera);
  (camera as THREE.PerspectiveCamera).fov = 50;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

const World: React.FC = () => {
  const { width, height } = useVideoConfig();
  const { group, refs } = useMemo(() => {
    const group = new THREE.Group();
    const refs = buildJetWorld(group as unknown as THREE.Scene);
    return { group, refs };
  }, []);
  return (
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 46, near: 0.1, far: 500, position: [6.2, 1.7, -10.8] }}>
      <primitive object={group} />
      <Rig refs={refs} />
    </ThreeCanvas>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = WORDS.find((w) => t >= w.start && t < w.end);
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: "55%",
      display: "flex", justifyContent: "center", pointerEvents: "none",
    }}>
      <span style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 900, fontSize: 88, color: "#ffffff",
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

export const JetSample: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#8fb6d9" }}>
    <World />
    <Audio src={staticFile("narasi.ogg")} />
    <Audio src={staticFile("musik.ogg")} volume={0.3} />
    <Captions />
  </AbsoluteFill>
);
