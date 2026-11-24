import * as THREE from "three";
import { WorldRefs } from "./world";

// 150 frames @30fps = 5 s. Beats:
//  0–58   walk in from the left, full gait, tail wagging
// 59–78   ease to a stop, head turns to camera, near ear flicks (70–79)
// 79–90   anticipation: crouch + squash
// 91–112  little jump: stretch up, legs reach/trail, tail streams
// 113–123 landing squash, tail follow-through overshoot
// 124–149 walk on, head eases back to forward

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, f: number) => {
  const t = clamp01((f - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function foxX(f: number): number {
  if (f <= 58) return -3.4 + (f / 58) * 2.85;
  if (f <= 78) return -0.55 + 0.5 * sstep(59, 78, f);
  if (f <= 123) return -0.05;
  return -0.05 + 1.75 * sstep(124, 149, f);
}

function jumpY(f: number): number {
  if (f < 91 || f > 112) return 0;
  const u = (f - 91) / 21;
  return 1.5 * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: WorldRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const x = foxX(f);
  const jy = jumpY(f);

  // walk amount: full gait -> 0 for the stop/jump -> back on after landing
  let walkAmt = 1;
  if (f >= 55) walkAmt = 1 - sstep(55, 70, f);
  if (f >= 120) walkAmt = sstep(120, 134, f);
  if (f > 70 && f < 120) walkAmt = 0;

  // gait phase tied to distance travelled so feet match the ground speed
  const phase = (x + 3.4) * 3.1;
  const bob = Math.abs(Math.sin(phase)) * 0.055 * walkAmt;

  // ---- body squash & stretch -------------------------------------------
  let sy = 1 + Math.sin(phase * 2) * 0.02 * walkAmt;
  let sxz = 1;
  let bodyDrop = 0;
  if (f >= 79 && f < 91) {           // anticipation crouch
    const t = sstep(79, 90, f);
    sy = lerp(sy, 0.77, t); sxz = lerp(1, 1.12, t); bodyDrop = lerp(0, 0.2, t);
  } else if (f >= 91 && f <= 112) {  // airborne stretch
    const u = (f - 91) / 21;
    sy = 1.13 - Math.abs(u - 0.5) * 0.22; sxz = 0.94;
  } else if (f > 112 && f < 126) {   // landing squash + settle
    const t = (f - 112) / 13;
    sy = 0.82 + 0.18 * (t * t * (3 - 2 * t)) + Math.sin(t * Math.PI) * 0.03;
    sxz = 1.1 - 0.1 * t; bodyDrop = 0.15 * (1 - t);
  }

  refs.fox.position.set(x, jy, 0);
  refs.bodyG.position.y = 1.05 - bodyDrop + bob;
  refs.bodyG.scale.set(sxz, sy, sxz);
  refs.bodyG.rotation.z = Math.sin(phase * 2) * 0.018 * walkAmt + (jy > 0 ? 0.05 : 0);

  // ---- legs -------------------------------------------------------------
  const jumpBlend = sstep(88, 94, f) * (1 - sstep(108, 116, f));
  const legPose = (leg: THREE.Group, ph: number, jumpRot: number) => {
    const walk = Math.sin(ph) * 0.62 * walkAmt;
    leg.rotation.z = lerp(walk, jumpRot, jumpBlend);
  };
  legPose(refs.legFL, phase, 0.55);
  legPose(refs.legBR, phase, -0.5);
  legPose(refs.legFR, phase + Math.PI, 0.55);
  legPose(refs.legBL, phase + Math.PI, -0.5);

  // ---- head: turn to camera, ear flick ----------------------------------
  const turn = sstep(62, 78, f) * (1 - sstep(124, 138, f));
  refs.headG.rotation.y = -0.95 * turn;
  refs.headG.rotation.z =
    -0.16 * sstep(79, 90, f) * (1 - sstep(108, 118, f))   // dip in anticipation
    + 0.1 * jumpBlend                                       // chin up mid-jump
    + Math.sin(phase) * 0.03 * walkAmt;                     // gait bob
  // near-ear flick while looking at camera
  let flick = 0;
  if (f >= 70 && f <= 80) flick = Math.sin(((f - 70) / 10) * Math.PI * 2) * 0.55 * (1 - (f - 70) / 14);
  refs.earL.rotation.x = -flick - 0.12 * turn;
  refs.earR.rotation.x = flick * 0.4 - 0.12 * turn;
  refs.earL.rotation.z = 0.08 * turn;
  refs.earR.rotation.z = -0.08 * turn;

  // ---- tail: lagged wag + jump stream + landing overshoot ----------------
  const wag = Math.sin(phase * 1.0 - 1.3) * 0.14 * walkAmt + Math.sin(f * 0.11) * 0.05;
  let tailZ = 0.06 + Math.sin(phase - 1.3) * 0.05 * walkAmt;
  tailZ = lerp(tailZ, 0.42, jumpBlend);                       // streams up in the jump
  if (f > 112 && f < 140) {                                   // follow-through overshoot
    tailZ += Math.sin((f - 112) * 0.5) * Math.exp(-(f - 112) * 0.11) * 0.3;
  }
  refs.tailG.rotation.y = wag;
  refs.tailG.rotation.z = tailZ;

  // ---- clouds drift (pure function of frame) ------------------------------
  refs.clouds.forEach((c, i) => {
    c.position.x = (c.userData.baseX as number) + Math.sin(f * 0.004 + i * 1.7) * 0.7 + f * 0.0022 * (i + 1);
  });

  // ---- camera: smooth tracking dolly, never frozen -----------------------
  const camX = x * 0.86 + 0.3;
  camera.position.set(camX, 2.95 + Math.sin(f * 0.021) * 0.06, 9.6);
  camera.lookAt(x + 0.4, 1.35 + jy * 0.35, 0);
}
