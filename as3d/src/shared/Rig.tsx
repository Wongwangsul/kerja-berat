import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface LightsOpts {
  fogColor: string; fogNear: number; fogFar: number;
  hemiSky: string; hemiGround: string; hemiInt: number;
  sunColor: string; sunInt: number; sunPos: [number, number, number];
  fillColor: string; fillInt: number;
  shadowBounds?: [number, number, number, number];
}

/** Rig bersama: cahaya + fog (gaya uji Rubah) + panggil poseFrame tiap frame. */
export function Rig<T>({ refs, pose, lights, fov = 42 }: {
  refs: T;
  pose: (frame: number, refs: T, camera: THREE.PerspectiveCamera) => void;
  lights: LightsOpts;
  fov?: number;
}) {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.fog = new THREE.Fog(new THREE.Color(lights.fogColor), lights.fogNear, lights.fogFar);
    const hemi = new THREE.HemisphereLight(
      new THREE.Color(lights.hemiSky), new THREE.Color(lights.hemiGround), lights.hemiInt);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(amb);
    const fill = new THREE.DirectionalLight(new THREE.Color(lights.fillColor), lights.fillInt);
    fill.position.set(40, 24, 60); scene.add(fill);
    const sun = new THREE.DirectionalLight(new THREE.Color(lights.sunColor), lights.sunInt);
    sun.position.set(...lights.sunPos);
    sun.target.position.set(2, 0, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    const b = lights.shadowBounds ?? [-24, 24, 24, -16];
    sc.left = b[0]; sc.right = b[1]; sc.top = b[2]; sc.bottom = b[3]; sc.near = 2; sc.far = 90;
    sun.shadow.bias = -0.0004;
    (sun.shadow as THREE.DirectionalLightShadow & { radius: number }).radius = 4;
    scene.add(sun); scene.add(sun.target);
  }, [scene]);
  pose(frame, refs, camera as THREE.PerspectiveCamera);
  (camera as THREE.PerspectiveCamera).fov = fov;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
}
