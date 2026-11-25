import * as THREE from "three";
import { WorldRefs } from "./world";

// Timeline (300 frames @30fps = 10 s):
//   0–85    the engineer waits by the switch stand, watching the distant
//           train's headlight; he grips the lever
//   88–132  he hauls the lever over (leaning back with the effort)
//   120–138 the point blades snap across
//   135–200 he steps back, proud, and watches the train approach
//   245–300 the train thunders past: wind wobble, camera shake, smoke wash

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (p: number) => p * p * (3 - 2 * p);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

export function trainZAt(frame: number): number {
  const p = clamp01(frame / 300);
  return -95 + 112 * Math.pow(p, 1.12);
}

const CAM_KEYS: [number, [number, number, number]][] = [
  [0, [5.9, 2.0, 10.8]],
  [150, [5.5, 1.9, 10.0]],
  [300, [5.2, 1.85, 9.5]],
];

function camPos(frame: number): [number, number, number] {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const [f0, p0] = CAM_KEYS[i];
    const [f1, p1] = CAM_KEYS[i + 1];
    if (frame >= f0 && frame <= f1) {
      const p = easeInOut(clamp01((frame - f0) / (f1 - f0)));
      return [
        p0[0] + (p1[0] - p0[0]) * p,
        p0[1] + (p1[1] - p0[1]) * p,
        p0[2] + (p1[2] - p0[2]) * p,
      ];
    }
  }
  return CAM_KEYS[CAM_KEYS.length - 1][1];
}

export function poseFrame(frame: number, refs: WorldRefs, camera: THREE.PerspectiveCamera) {
  // ---- train
  const tz = trainZAt(frame);
  refs.train.position.z = tz;
  const dist = tz + 95;
  for (const w of refs.wheels) w.rotation.x = dist * 2.1;

  // ---- smoke: deterministic recycled puffs emitted at the chimney
  for (let i = 0; i < refs.smoke.length; i++) {
    const puff = refs.smoke[i];
    const age = ((frame - i * 5) % 150 + 150) % 150;
    if (age < 78) {
      const spawnFrame = frame - age;
      const sz = trainZAt(Math.max(0, spawnFrame));
      puff.visible = true;
      puff.position.set(
        Math.sin(i * 12.9898) * 0.3 + Math.sin(i * 7.3 + age * 0.05) * 0.22 + age * 0.006,
        2.35 + age * 0.075,
        sz + 1.55 - age * 0.012,
      );
      const s = 0.55 + age * 0.075;
      puff.scale.set(s, s * 0.8, s);
      const m = puff.material as THREE.MeshStandardMaterial;
      m.opacity = 0.34 * (1 - age / 78) * Math.min(1, age / 5 + 0.15);
      const grey = 0.55 + 0.38 * (age / 78);
      m.color.setRGB(grey, grey, grey * 0.98);
    } else {
      puff.visible = false;
    }
  }

  // headlight glow breathes slightly
  const glowS = 2.0 + Math.sin(frame * 0.35) * 0.18;
  refs.lampGlow.scale.set(glowS, glowS, 1);

  // ---- lever + points
  const pullP = easeInOut(clamp01((frame - 88) / 44));
  let leverA = -0.85 + pullP * 1.6;
  if (frame > 132 && frame < 155) {
    leverA += Math.sin((frame - 132) * 0.55) * 0.05 * (1 - (frame - 132) / 23);
  }
  refs.lever.rotation.z = leverA;
  const ptP = easeOut(clamp01((frame - 120) / 18));
  refs.pointsL.rotation.y = -0.05 * ptP;
  refs.pointsR.rotation.y = 0.05 * ptP;

  // ---- the engineer
  const man = refs.man;
  const stepP = easeInOut(clamp01((frame - 138) / 26));
  man.position.x = 2.82 + stepP * 0.73;
  man.position.z = 2.75 + stepP * 0.25;
  man.rotation.y = -0.3 + stepP * 0.08;

  // body lean: hauling effort, then wind blast as the train passes
  const windP = clamp01((frame - 243) / 18) * (frame > 292 ? Math.max(0, 1 - (frame - 292) / 8) : 1);
  let lean = -0.14 * Math.sin(pullP * Math.PI);
  lean += -0.07 * windP;
  man.rotation.x = lean;

  // arms: grip + haul, then proud stance, then one hand to the cap in the wind
  const gripP = easeInOut(clamp01((frame - 55) / 25));
  const releaseP = easeInOut(clamp01((frame - 120) / 22));
  const capHandP = easeInOut(clamp01((frame - 248) / 14)) * (1 - easeInOut(clamp01((frame - 288) / 12)));
  const haul = Math.sin(pullP * Math.PI);
  refs.armR.rotation.x = -0.15 - gripP * 1.0 + releaseP * 0.95 - haul * 0.3 - capHandP * 1.9;
  refs.armR.rotation.z = -0.12 - releaseP * 0.35 + capHandP * 0.55;
  refs.armL.rotation.x = -0.1 - gripP * 0.9 + releaseP * 0.85 - haul * 0.25;
  refs.armL.rotation.z = 0.12 + releaseP * 0.4;

  // legs: brace during the haul, then planted
  refs.legL.rotation.x = 0.16 * haul - 0.05 * stepP;
  refs.legR.rotation.x = -0.2 * haul + 0.04 * stepP;

  // head: watch the train, glance at the lever, nod, then track the pass
  let headY = -0.3 + Math.sin(frame * 0.02) * 0.05;
  if (frame > 58 && frame < 88) headY += easeInOut(clamp01((frame - 58) / 30)) * 0.45;
  if (frame >= 88) headY += (1 - easeInOut(clamp01((frame - 88) / 30))) * 0.45 - 0.1;
  if (frame > 235) headY += easeInOut(clamp01((frame - 235) / 40)) * 0.5;
  refs.headG.rotation.y = headY;
  const nod = frame > 148 && frame < 172 ? Math.sin((frame - 148) / 24 * Math.PI) * 0.16 : 0;
  refs.headG.rotation.x = 0.05 + nod;

  // cap + scarf in the wind
  refs.cap.rotation.x = Math.sin(frame * 0.9) * 0.07 * windP - 0.05 * windP;
  refs.cap.rotation.z = Math.sin(frame * 0.7 + 1) * 0.05 * windP;
  refs.scarf.rotation.x = Math.sin(frame * 1.35) * 0.45 * windP;
  refs.scarf.position.z = 0.16 + Math.sin(frame * 1.35) * 0.03 * windP;

  // ---- camera: slow push-in + shake as the train passes
  const [cxp, cyp, czp] = camPos(frame);
  const shake = clamp01((frame - 246) / 12) * (frame > 294 ? 0.4 : 1);
  camera.position.set(
    cxp + Math.sin(frame * 1.7) * 0.022 * shake,
    cyp + Math.sin(frame * 2.3) * 0.03 * shake,
    czp,
  );
  camera.lookAt(0.95, 1.0, 0.7);
}
