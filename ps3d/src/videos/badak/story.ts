import * as THREE from "three";
import { BadakRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats:
//  0  12–232   establishing: mother right, calf left under a tree; mother
//              raises her head, pointing her nose at the forest
//  1 244–433   calf bows shyly, touches its small horn with a front foot
//  2 442–630   mother walks a half-turn, looks at the wide forest; calf
//              follows her gaze
//  3 639–809   calf bows again, scratching the ground
//  4 821–1006  mother comes close, presses her head to the calf (comfort)
//  5 1015–1180 calf looks up asking, ears up; mother nods firmly
//  6 1192–1427 both stand tall and proud facing the forest, light breaks through
//  7 1436–1644 calf jumps twice happily, head held high showing its one horn

const IND_KEYS = [
  { f: 0, x: 1.7, y: 0, ry: Math.PI },
  { f: 442, x: 1.7, y: 0, ry: Math.PI },
  { f: 630, x: 1.15, y: 0, ry: Math.PI - 0.55 },
  { f: 821, x: 1.15, y: 0, ry: Math.PI },
  { f: 1006, x: 0.9, y: 0, ry: Math.PI },
  { f: 1180, x: 0.85, y: 0, ry: Math.PI },
  { f: 1427, x: 0.9, y: 0, ry: Math.PI },
  { f: 1698, x: 0.9, y: 0, ry: Math.PI },
];

const ANA_KEYS = [
  { f: 0, x: -1.7, y: 0, ry: 0 },
  { f: 433, x: -1.7, y: 0, ry: 0 },
  { f: 630, x: -1.6, y: 0, ry: 0 },
  { f: 809, x: -1.6, y: 0, ry: 0 },
  { f: 1006, x: -1.6, y: 0, ry: 0 },
  { f: 1180, x: -1.6, y: 0, ry: 0 },
  { f: 1427, x: -1.6, y: 0, ry: Math.PI },
  { f: 1698, x: -1.6, y: 0, ry: Math.PI },
];

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: BadakRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const indM = mouthVal(MOUTH, "induk", f);
  const anaM = mouthVal(MOUTH, "anak", f);

  // ---- mother -------------------------------------------------------------
  const ind = keyLerp(IND_KEYS, f);
  refs.induk.position.set(ind.x, 0, 0.4);
  refs.induk.rotation.y = ind.ry;
  // slow walk bob while approaching (lines 2 and 4)
  const indWalking = (f > 442 && f < 630) || (f > 821 && f < 1006);
  refs.indBodyG.position.y = 0.95 + (indWalking ? Math.abs(Math.sin(f * 0.28)) * 0.06 : Math.sin(f * 0.07) * 0.02);
  // legs: walk cycle while moving
  const walkPh = f * 0.28;
  const walkAmp = indWalking ? 0.35 : 0.02;
  refs.indLegFL.rotation.z = Math.sin(walkPh) * walkAmp;
  refs.indLegBR.rotation.z = Math.sin(walkPh) * walkAmp;
  refs.indLegFR.rotation.z = Math.sin(walkPh + Math.PI) * walkAmp;
  refs.indLegBL.rotation.z = Math.sin(walkPh + Math.PI) * walkAmp;
  // head: point at the forest (line 0), comfort press (line 4), nod (line 5),
  // proud and raised (line 6)
  const point = sstep(12, 60, f) * (1 - sstep(200, 240, f));
  const comfort = sstep(880, 940, f) * (1 - sstep(980, 1015, f));
  const nod = line === 5 ? Math.sin((f - 1015) * 0.12) * 0.18 * sstep(1015, 1050, f) : 0;
  const proud = sstep(1192, 1260, f);
  refs.indHeadG.rotation.z = 0.28 * point - 0.3 * comfort + nod + 0.14 * proud
    + Math.sin(f * 0.45) * 0.035 * indM;
  refs.indHeadG.rotation.y = 0.15 * point;
  refs.indJawG.rotation.z = -indM * 0.45;
  // ears: gentle flick, perked in the proud pose
  refs.indEarL.rotation.x = -0.1 - 0.15 * proud + Math.sin(f * 0.06) * 0.04;
  refs.indEarR.rotation.x = 0.1 + 0.15 * proud - Math.sin(f * 0.06) * 0.04;
  refs.indTailG.rotation.y = Math.sin(f * 0.1) * 0.25;
  applyBlink(refs.indEyeL, refs.indEyeR, f, 48, 130);

  // ---- calf ----------------------------------------------------------------
  const ana = keyLerp(ANA_KEYS, f);
  const jump = jumpY(f, 1470, 1512, 0.55) + jumpY(f, 1530, 1572, 0.55);
  refs.anak.position.set(ana.x, jump, -0.4);
  refs.anak.rotation.y = ana.ry;
  refs.anaBodyG.position.y = 0.55 + Math.sin(f * 0.09) * 0.015;
  // front foot: touch the horn (line 1), scratch the ground (line 3)
  const touchHorn = sstep(260, 300, f) * (1 - sstep(400, 433, f));
  const scratch = line === 3 ? Math.sin(f * 0.7) * 0.5 : 0;
  refs.anaLegFL.rotation.z = -1.15 * touchHorn + scratch;
  refs.anaLegFR.rotation.z = 0;
  refs.anaLegBL.rotation.z = Math.sin(f * 0.1) * 0.03;
  refs.anaLegBR.rotation.z = Math.sin(f * 0.1 + Math.PI) * 0.03;
  // head: bow shyly (lines 1, 3), look up asking (line 5), raised proud (6–7)
  const shy = sstep(244, 290, f) * (1 - sstep(400, 442, f))
    + sstep(639, 680, f) * (1 - sstep(770, 821, f));
  const lookUp = sstep(1015, 1060, f) * (1 - sstep(1150, 1192, f));
  const anaProud = sstep(1192, 1260, f);
  refs.anaHeadG.rotation.z = -0.42 * Math.min(1, shy) + 0.32 * lookUp + 0.3 * anaProud
    + Math.sin(f * 0.5) * 0.05 * anaM
    + (jump > 0.05 ? 0.25 : 0); // head high while jumping, showing the horn
  refs.anaHeadG.rotation.y = 0.3 * sstep(442, 500, f) * (1 - sstep(600, 639, f)); // follow mother's gaze
  refs.anaJawG.rotation.z = -anaM * 0.45;
  // ears: limp when shy, up when asking/proud
  refs.anaEarL.rotation.x = -0.1 + 0.5 * Math.min(1, shy) - 0.25 * (lookUp + anaProud);
  refs.anaEarR.rotation.x = 0.1 - 0.5 * Math.min(1, shy) + 0.25 * (lookUp + anaProud);
  refs.anaTailG.rotation.y = Math.sin(f * 0.13 + 1) * 0.3;
  applyBlink(refs.anaEyeL, refs.anaEyeR, f, 71, 125);

  // ---- falling leaves (loop) ------------------------------------------------
  refs.leavesG.children.forEach((c, i) => {
    const speed = 0.011 + (i % 3) * 0.004;
    const y = 5.5 - (((f * speed + i * 0.31) % 1) * 7.5);
    c.position.set(-3.5 + (i % 4) * 1.9 + Math.sin(f * 0.02 + i * 2) * 0.5, y, -1 + (i % 3) * 0.9);
    c.rotation.z = Math.sin(f * 0.05 + i) * 0.6;
  });

  // ---- ferns sway -------------------------------------------------------------
  refs.ferns.forEach((fg) => {
    fg.rotation.z = Math.sin(f * 0.02 + (fg.userData.phase as number)) * 0.03;
  });

  // ---- light rays brighten at the proud moment (line 6) -----------------------
  const glow = sstep(1192, 1260, f);
  refs.raysG.children.forEach((m) => {
    ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.05 + glow * 0.07;
  });

  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame by true extents (heads/tails flip with facing) --------
  const indHeadX = ind.x + 1.8 * Math.cos(ind.ry);
  const indTailX = ind.x - 1.45 * Math.cos(ind.ry);
  const anaHeadX = ana.x + 0.97 * Math.cos(ana.ry);
  const anaTailX = ana.x - 0.7 * Math.cos(ana.ry);
  const left = Math.min(indHeadX, indTailX, anaHeadX, anaTailX);
  const right = Math.max(indHeadX, indTailX, anaHeadX, anaTailX);
  const { mid: midX, z } = frameExtent(left, right, 1.2);
  camera.position.set(midX * 0.8, 2.5 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.9, 1.2, 0);
}
