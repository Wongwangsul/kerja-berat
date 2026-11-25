import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildWorld, SungaiRefs } from "./world";
import { poseFrame } from "./story";
import { Rig } from "../../shared/Rig";
import { sstep } from "../../shared/kit";

export const SUNGAI_FRAMES = 7200;

/** Palet langit per babak: pagi sejuk → gerah pucat (ladang kering) →
 *  kelabu hujan → segar lagi → fajar keemasan di laut. */
function Atmosphere() {
  const frame = useCurrentFrame();
  const scene = useThree((s) => s.scene);
  const cols = useMemo(() => ({
    morning: new THREE.Color("#a8d8ea"),
    haze: new THREE.Color("#e6dfc0"),
    rain: new THREE.Color("#93a7b4"),
    sunrise: new THREE.Color("#f9c784"),
    tmp: new THREE.Color(),
  }), []);
  const c = cols.tmp.copy(cols.morning);
  const hazeK = sstep(2750, 3300, frame) * (1 - sstep(4150, 4500, frame));
  c.lerp(cols.haze, hazeK * 0.75);
  const rainK = sstep(4200, 4450, frame) * (1 - sstep(4900, 5400, frame));
  c.lerp(cols.rain, rainK * 0.8);
  const sunK = sstep(6000, 6900, frame);
  c.lerp(cols.sunrise, sunK * 0.85);
  if (scene.background instanceof THREE.Color) scene.background.copy(c);
  else scene.background = c.clone();
  if (scene.fog) (scene.fog as THREE.Fog).color.copy(c);
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
    <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 42, near: 0.1, far: 320, position: [-47, 5.5, 12.5] }}>
      <primitive object={group} />
      <Rig<SungaiRefs>
        refs={refs}
        pose={poseFrame}
        lights={{
          fogColor: "#a8d8ea", fogNear: 55, fogFar: 190,
          hemiSky: "#bfe8ff", hemiGround: "#7a9a5a", hemiInt: 1.0,
          sunColor: "#fff2d8", sunInt: 1.5, sunPos: [-20, 38, 18],
          fillColor: "#cfe8ff", fillInt: 0.35,
        }}
      />
      <Atmosphere />
    </ThreeCanvas>
  );
};

const ClosingText: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [6990, 7080], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <div style={{
        fontFamily: "'DejaVu Sans', sans-serif",
        fontWeight: 700,
        fontSize: 58,
        lineHeight: 1.35,
        color: "#ffffff",
        textAlign: "center",
        maxWidth: "72%",
        textShadow: "0 3px 14px rgba(20,40,60,0.85), 0 0 3px rgba(20,40,60,0.9)",
      }}>
        Yang kecil pun sampai, bila terus mengalir.
      </div>
    </AbsoluteFill>
  );
};

export const AnakSungai: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#a8d8ea" }}>
    <World />
    <ClosingText />
  </AbsoluteFill>
);
