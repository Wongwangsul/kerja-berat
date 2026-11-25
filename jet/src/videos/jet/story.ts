import * as THREE from "three";
import { JetRefs } from "./world";

// 300 frames: front-quarter reveal -> side profile -> rear-quarter burner
// finale. The jet performs in place; clouds stream past to sell the speed.

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (p: number) => p * p * (3 - 2 * p);

// Jet nose points to -z: the camera starts at the front three-quarter,
// sweeps along the flank, and settles at the rear three-quarter so the
// afterburner flare closes the shot. Distances ~12 keep the whole airframe
// inside the narrow vertical frame.
const CAM_KEYS: { f: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { f: 0, pos: [8.2, 2.2, -14.2], look: [0, 0.1, -0.4] },
  { f: 95, pos: [13.5, 1.3, -8.5], look: [0, 0, 0] },
  { f: 185, pos: [16.5, 0.6, 3.5], look: [0, 0, 0.3] },
  { f: 245, pos: [10.5, -1.0, 11.5], look: [0, 0.1, 0.6] },
  { f: 300, pos: [7.5, -1.3, 14.5], look: [0, 0.15, 0.9] },
];

function camAt(frame: number): { pos: [number, number, number]; look: [number, number, number] } {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const p = easeInOut(clamp01((frame - a.f) / (b.f - a.f)));
      const mix = (u: number, v: number) => u + (v - u) * p;
      return {
        pos: [mix(a.pos[0], b.pos[0]), mix(a.pos[1], b.pos[1]), mix(a.pos[2], b.pos[2])],
        look: [mix(a.look[0], b.look[0]), mix(a.look[1], b.look[1]), mix(a.look[2], b.look[2])],
      };
    }
  }
  const last = CAM_KEYS[CAM_KEYS.length - 1];
  return { pos: last.pos, look: last.look };
}

const mtx = new THREE.Matrix4();
const qtn = new THREE.Quaternion();
const eul = new THREE.Euler();
const one = new THREE.Vector3(1, 1, 1);
const posV = new THREE.Vector3();

export function poseJet(frame: number, refs: JetRefs, camera: THREE.PerspectiveCamera) {
  // jet performance: gentle bob, a left bank, a right sway, then level
  const jet = refs.jet;
  jet.position.y = Math.sin(frame * 0.045) * 0.14;
  jet.position.x = Math.sin(frame * 0.021) * 0.2;
  let bank = Math.sin(frame * 0.02) * 0.05;
  bank += -0.3 * easeInOut(clamp01((frame - 35) / 55)) * (1 - easeInOut(clamp01((frame - 105) / 50)));
  bank += 0.16 * easeInOut(clamp01((frame - 150) / 45)) * (1 - easeInOut(clamp01((frame - 205) / 45)));
  jet.rotation.z = bank;
  jet.rotation.x = Math.sin(frame * 0.03 + 1) * 0.03 - 0.02;
  jet.rotation.y = Math.sin(frame * 0.017) * 0.05;

  // burners: idle glow, flaring in the finale
  const flare = easeInOut(clamp01((frame - 225) / 45));
  const flick = 1 + Math.sin(frame * 1.7) * 0.06 + Math.sin(frame * 4.3) * 0.04;
  for (const b of refs.burners) {
    const s = (0.8 + flare * 0.55) * flick;
    b.scale.set(s, s, 1);
  }
  for (const fl of refs.flames) {
    const m = fl.material as THREE.MeshBasicMaterial;
    m.opacity = 0.5 * flare * flick;
    fl.scale.set(1, 1, (0.7 + flare * 0.7) * flick);
  }

  // clouds stream toward the camera and recycle
  const speed = 0.55 + flare * 0.35;
  for (let i = 0; i < refs.cloudBase.length; i++) {
    const c = refs.cloudBase[i];
    let z = c.z + frame * speed;
    z = ((z - -135) % 165 + 165) % 165 - 135 + 0; // wrap into [-135, 30]
    eul.set(0, 0, 0);
    qtn.setFromEuler(eul);
    posV.set(c.x, c.y, z);
    mtx.compose(posV, qtn, new THREE.Vector3(c.s, c.s * 0.52, c.s * 0.85));
    refs.clouds.setMatrixAt(i, mtx);
  }
  refs.clouds.instanceMatrix.needsUpdate = true;

  const { pos, look } = camAt(frame);
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  void one;
}
