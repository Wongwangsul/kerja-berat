import * as THREE from "three";
import { KelinciRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, swayFlowers, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats:
//  0  12–279   establishing: rabbit left, lion right, thorn bush between
//  1 294–481   lion raises a paw, pointing; rabbit nods, ears up
//  2 496–641   countdown, crouch, then dig at the bush base; dirt flies
//  3 650–822   hard ground, paws slip, tunnel bends right; dragged right-down
//               (FIX 24 Nov: lion turns IN PLACE to face right first, then
//               both slide right keeping >=1.9 apart — was: lion slid right
//               while facing left = walking backwards, ending wedged into
//               the rabbit at sep 0.7)
//  4 837–1066  rabbit droops (ears limp), lion comes close to comfort
//               (FIX 24 Nov: rabbit STAYS put (no backwards drift 1.8->1.5);
//               lion turns in place, takes one slow step left and DIPS its
//               head toward the rabbit — body stops at a safe distance
//               (sep 1.8), the HEAD reaches, never the body; was: lion's
//               body ended on top of the rabbit, head far away by the bush)
//  5 1081–1295 rabbit stands tall watching from above, lion digs slowly on cue
//               (FIX 24 Nov: lion digs IN PLACE where it stands (2.4) —
//               was: lion trekked left 1.9->0.9 straight across the rabbit's
//               path while the rabbit reared against its hindquarters)
//  6 1310–1477 arrive at the green meadow, sparkles
//               (FIX 24 Nov: lion turns IN PLACE first, then BOTH walk
//               right (rabbit left of lion throughout, no crossing) — was:
//               lion slid right while rotating pi->0 and the two crossed
//               through each other at f~1400, rabbit swallowed by the lion)
//  7 1492–1658 side by side: lion waves a paw, rabbit jumps twice happily
//               (FIX 24 Nov: lion ends at 3.8 not 3.4, sep 1.9 — was: the
//               rabbit's face was buried in the lion's rear/tail)

const RAB_KEYS = [
  { f: 0, x: -1.9, y: 0, ry: 0 },
  { f: 481, x: -1.8, y: 0, ry: 0 },
  { f: 560, x: -1.15, y: 0, ry: 0 },
  { f: 641, x: -0.9, y: 0, ry: 0 },
  { f: 681, x: -0.85, y: 0, ry: 0 },   // hold while the lion turns (f641-681)
  { f: 822, x: 0.6, y: 0, ry: 0 },     // dragged right, sep from lion ~1.9
  { f: 1066, x: 0.6, y: 0, ry: 0 },    // STAYS for the comfort (no drift)
  { f: 1295, x: 0.6, y: 0, ry: 0 },    // rears up IN PLACE watching
  { f: 1350, x: 0.6, y: 0, ry: 0 },    // hold while the lion turns (f1310-1350)
  { f: 1477, x: 1.9, y: 0, ry: 0 },    // walks right into the meadow
  { f: 1742, x: 1.9, y: 0, ry: 0 },
];

const LION_KEYS = [
  { f: 0, x: 1.7, y: 0, ry: Math.PI },
  { f: 481, x: 1.6, y: 0, ry: Math.PI },
  { f: 560, x: 1.3, y: 0, ry: Math.PI },
  { f: 641, x: 1.1, y: 0, ry: Math.PI },
  { f: 681, x: 1.1, y: 0, ry: 0 },     // turn IN PLACE to face the drag (right)
  { f: 822, x: 2.5, y: 0, ry: 0 },     // dragged right, facing right
  { f: 862, x: 2.5, y: 0, ry: Math.PI }, // turn IN PLACE to face the rabbit
  { f: 1066, x: 2.4, y: 0, ry: Math.PI }, // one slow step closer (sep 1.8)
  { f: 1295, x: 2.4, y: 0, ry: Math.PI }, // digs slowly IN PLACE (no trek back)
  { f: 1350, x: 2.4, y: 0, ry: 0 },    // turn IN PLACE to face the meadow
  { f: 1477, x: 3.8, y: 0, ry: 0 },    // step right into the meadow
  { f: 1742, x: 3.8, y: 0, ry: 0 },
];

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: KelinciRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const rabM = mouthVal(MOUTH, "rabbit", f);
  const lionM = mouthVal(MOUTH, "lion", f);

  const digging = line === 2 || line === 5;
  const digSpeed = line === 2 ? 0.9 : 0.35;
  const digAmp = line === 2 ? 0.8 : 0.35;

  // ---- lion ------------------------------------------------------------
  const li = keyLerp(LION_KEYS, f);
  refs.lion.position.set(li.x, 0, 0.4);
  refs.lion.rotation.y = li.ry;
  // walk bob while moving between keys
  const lionMoving = (line === 2 && f > 500 && f < 560) || (line === 3) || (line === 4 && f < 1000) || (line === 5);
  refs.lionBodyG.position.y = 1.0 + (lionMoving ? Math.abs(Math.sin(f * 0.35)) * 0.05 : Math.sin(f * 0.08) * 0.02);
  // crouch before digging (line 2)
  const crouch = sstep(496, 540, f) * (1 - sstep(600, 640, f));
  refs.lionBodyG.scale.set(1 + 0.1 * crouch, 1 - 0.18 * crouch, 1 + 0.08 * crouch);
  refs.lionBodyG.rotation.z = -0.06 * crouch;
  // front paws: point (line 1), dig (lines 2, 5), wave (line 7)
  const point = sstep(300, 340, f) * (1 - sstep(440, 480, f));
  const wave = line === 7 ? Math.sin(f * 0.5) * 0.5 : 0;
  const dig = digging ? Math.sin(f * digSpeed * 6) * digAmp : 0;
  refs.lionLegFL.rotation.z = -0.95 * point + dig + wave;
  refs.lionLegFR.rotation.z = -0.95 * point + Math.sin(f * digSpeed * 6 + Math.PI) * digAmp * (digging ? 1 : 0);
  refs.lionLegBL.rotation.z = Math.sin(f * 0.3) * 0.05;
  refs.lionLegBR.rotation.z = Math.sin(f * 0.3 + Math.PI) * 0.05;
  // head: nod while speaking, look back at the bush in line 3
  refs.lionHeadG.rotation.z = Math.sin(f * 0.45) * 0.04 * lionM
    - 0.3 * sstep(650, 700, f) * (1 - sstep(800, 840, f))
    // comfort dip (line 4, FIX 24 Nov): after the turn (f862) the lion
    // bows its head down toward the rabbit — the head reaches, the body
    // stays at a safe distance (cf. Badak look-dev fix #6)
    - 0.3 * sstep(880, 940, f) * (1 - sstep(1020, 1066, f));
  refs.lionHeadG.rotation.y = 0.5 * sstep(660, 720, f) * (1 - sstep(800, 840, f))
    // finale (line 7): turn the head back toward the camera/rabbit so the
    // face is visible in the closing shot instead of the back of the head
    - 0.85 * sstep(1490, 1550, f);
  refs.lionJawG.rotation.z = -lionM * 0.5;
  // tail sway with follow-through
  refs.lionTailG.rotation.y = Math.sin(f * 0.12) * 0.2 + Math.sin(f * 0.3) * 0.05 * (lionMoving ? 1 : 0.3);
  refs.lionTailG.rotation.z = 0.15 + Math.sin(f * 0.09) * 0.08;
  applyBlink(refs.lionEyeL, refs.lionEyeR, f, 55);

  // ---- rabbit -----------------------------------------------------------
  const ra = keyLerp(RAB_KEYS, f);
  const jump = jumpY(f, 1520, 1562, 0.85) + jumpY(f, 1580, 1622, 0.85);
  // rabbit rides in FRONT (z 0.9) so the big lion never hides it
  refs.rabbit.position.set(ra.x, jump, 0.9);
  refs.rabbit.rotation.y = ra.ry;
  // stand tall watching from above (line 5): pitch body up
  const upright = sstep(1081, 1130, f) * (1 - sstep(1270, 1310, f));
  refs.rabBodyG.rotation.z = 0.55 * upright;
  refs.rabBodyG.position.y = 0.55 + 0.28 * upright + Math.sin(f * 0.1) * 0.015;
  const rabCrouch = crouch; // same countdown crouch
  refs.rabBodyG.scale.set(1 + 0.1 * rabCrouch, 1 - 0.2 * rabCrouch, 1 + 0.08 * rabCrouch);
  // front paws dig in sync with the lion
  refs.rabLegFL.rotation.z = digging ? Math.sin(f * digSpeed * 6 + 0.6) * digAmp * 0.8 : 0;
  refs.rabLegFR.rotation.z = digging ? Math.sin(f * digSpeed * 6 + Math.PI + 0.6) * digAmp * 0.8 : 0;
  // hind feet kick during the happy jumps
  const jumpBlend = jump > 0.05 ? 1 : 0;
  refs.rabLegBL.rotation.z = lerp(0, 0.5, jumpBlend);
  refs.rabLegBR.rotation.z = lerp(0, -0.4, jumpBlend);
  // head: nod while speaking, droop when sad, scan while watching (line 5)
  const droop = sstep(837, 890, f) * (1 - sstep(1040, 1080, f));
  refs.rabHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * rabM - 0.35 * droop;
  refs.rabHeadG.rotation.y = upright * Math.sin(f * 0.06) * 0.5;
  refs.rabJawG.rotation.z = -rabM * 0.5;
  // ears: limp when sad, upright + scanning when watching, flick occasionally
  const earDroop = droop * 0.95;
  const earFlick = (f >= 240 && f <= 252) ? Math.sin(((f - 240) / 12) * Math.PI) * 0.5 : 0;
  refs.rabEarL.rotation.z = -0.12 - earDroop - earFlick + Math.sin(f * 0.07) * 0.03;
  refs.rabEarR.rotation.z = 0.12 + earDroop * 0.9 + earFlick * 0.5;
  refs.rabEarL.rotation.x = upright * Math.sin(f * 0.06 + 0.4) * 0.25;
  refs.rabEarR.rotation.x = -upright * Math.sin(f * 0.06 + 0.4) * 0.25;
  applyBlink(refs.rabEyeL, refs.rabEyeR, f, 90);

  // ---- dirt particles while digging -------------------------------------
  refs.dirtG.visible = digging || line === 3;
  if (refs.dirtG.visible) {
    const srcX = line === 5 ? li.x - 0.9 : (ra.x + li.x) / 2;
    refs.dirtG.children.forEach((c, i) => {
      const ph = ((f * 0.09 + i * 0.7) % 1);
      const dir = i % 2 === 0 ? 1 : -1;
      c.position.set(srcX + ph * 1.1 * dir, 0.25 + ph * 1.3 - ph * ph * 1.1, 0.3 + Math.sin(i * 2.4) * 0.5);
      const s = 0.6 + ph * 0.8;
      c.scale.setScalar(s);
    });
  }

  // ---- environment -------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  // thorn bush sways gently
  refs.bushG.rotation.z = Math.sin(f * 0.02) * 0.015;
  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame by true extents (lion head/tail flip with its turn) ---
  const lionHeadX = li.x + 1.6 * Math.cos(li.ry);
  const lionTailX = li.x - 1.75 * Math.cos(li.ry);
  const left = Math.min(ra.x - 0.75, lionHeadX, lionTailX);
  const right = Math.max(ra.x + 0.95, lionHeadX, lionTailX);
  const { mid: midX, z } = frameExtent(left, right, 1.2, 12.5);
  camera.position.set(midX * 0.82, 2.6 + Math.sin(f * 0.017) * 0.05, z);
  camera.lookAt(midX * 0.9, 1.15, 0);
}
