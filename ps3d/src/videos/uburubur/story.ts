import * as THREE from "three";
import { UburUburRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats:
//  0   12–195  jelly left, glowing; shark enters from the right, calm
//  1  201–397  shark swims to the jelly's side (facing left), then turns in
//              place to face right; jelly nods, dome swells in readiness
//  2  403–540  countdown crouch, then both drift right with the current —
//              jelly ahead, shark alongside
//  3  546–707  current bends DOWN: jelly is dragged right-down toward the
//              sharp coral; shark swims right PAST it (facing right) then
//              turns in place to block between jelly and coral
//  4  713–922  jelly droops, turns in place to face left and drifts to the
//              lower left, then turns back toward the approaching shark;
//              shark swims left (facing left) to comfort it
//  5  928–1123 shark turns in place, then leads in front breaking the
//              current; jelly drifts up into the station exactly behind it
//              (3.4 behind the centre — clear of the tail fluke) and they
//              pass the coral safely above it
//  6 1129–1298 calm water: slow happy drift right, sparkles + bubbles
//  7 1304–1499 side by side, warm close: jelly pulses joyfully, shark wags
//              its tail twice
//
// Hard rules applied (from PERBAIKAN-25NOV): facing always matches travel —
// every turn happens IN PLACE before moving; no sliding backwards/sideways;
// interaction targets end at the right point (heads close, bodies clear).

const JELLY_KEYS = [
  { f: 0, x: -2.0, y: 0.3, ry: 0 },
  { f: 397, x: -2.0, y: 0.35, ry: 0 },
  { f: 540, x: -0.6, y: 0.55, ry: 0 },       // upper lane in line 2
  { f: 630, x: 0.7, y: -0.85, ry: 0 },       // steep dive toward the coral
  { f: 707, x: 1.6, y: -1.05, ry: 0 },
  { f: 760, x: 1.6, y: -1.05, ry: Math.PI },   // turn in place, then drift left
  { f: 860, x: -0.9, y: -1.15, ry: Math.PI },
  { f: 910, x: -0.9, y: -1.15, ry: 0 },       // turn back toward the shark
  { f: 928, x: -0.9, y: -1.15, ry: 0 },
  { f: 1123, x: 0.2, y: -0.1, ry: 0 },        // must match the line-5 station
  { f: 1298, x: 1.2, y: 0.5, ry: 0 },        // clear left of the shark's tail
  { f: 1530, x: 1.2, y: 0.55, ry: 0 },
];

const SHARK_KEYS = [
  { f: 0, x: 2.0, y: 0.6, ry: Math.PI },
  { f: 201, x: 0.0, y: 0.4, ry: Math.PI },
  { f: 360, x: 0.0, y: 0.4, ry: Math.PI },
  { f: 397, x: 0.0, y: 0.4, ry: 0 },          // turn in place, then swim right
  { f: 540, x: 1.2, y: -0.6, ry: 0 },        // lower lane in line 2
  { f: 660, x: 3.0, y: 0.0, ry: 0 },         // swim right PAST the jelly
  { f: 707, x: 3.0, y: 0.0, ry: Math.PI },   // turn in place: block the coral
  { f: 922, x: 1.5, y: -0.5, ry: Math.PI },   // swim left to comfort
  { f: 965, x: 1.5, y: -0.5, ry: 0 },         // turn in place, then lead
  { f: 1123, x: 3.6, y: 0.1, ry: 0 },
  { f: 1298, x: 4.4, y: 0.25, ry: 0 },
  { f: 1530, x: 4.4, y: 0.25, ry: 0 },
];

export function poseFrame(frame: number, refs: UburUburRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const jellyM = mouthVal(MOUTH, "jelly", f);
  const sharkM = mouthVal(MOUTH, "shark", f);

  // ---- shark --------------------------------------------------------------
  const sh = keyLerp(SHARK_KEYS, f);
  refs.shark.position.set(sh.x, sh.y, -0.6);
  refs.shark.rotation.y = sh.ry;
  // swimming undulation + tail wag (strong in line 5, double wag in line 7)
  const wagAmp = line === 5 ? 0.4 : line === 7 ? 0.35 : 0.22;
  const wagFreq = line === 7 ? 0.35 : 0.12;
  refs.sharkTailG.rotation.y = Math.sin(f * wagFreq) * wagAmp;
  refs.sharkBodyG.rotation.z = 0.05 * Math.sin(f * 0.09);
  refs.sharkBodyG.position.y = Math.sin(f * 0.07) * 0.05;
  // fins: steady rowing, braced in line 5
  const brace = sstep(928, 980, f) * (1 - sstep(1080, 1123, f));
  refs.sharkFinL.rotation.x = -0.3 * brace + Math.sin(f * 0.08) * 0.1;
  refs.sharkFinR.rotation.x = 0.3 * brace - Math.sin(f * 0.08) * 0.1;
  refs.sharkDorsalG.rotation.z = Math.sin(f * 0.06) * 0.04;
  // jaw + head nod while speaking; worried dip in line 3
  refs.sharkJawG.rotation.z = -sharkM * 0.45;
  refs.sharkHeadG.rotation.z = Math.sin(f * 0.45) * 0.03 * sharkM
    - 0.18 * sstep(546, 600, f) * (1 - sstep(680, 720, f));
  applyBlink(refs.sharkEyeL, refs.sharkEyeR, f, 90, 140);

  // ---- jellyfish ------------------------------------------------------------
  const j = keyLerp(JELLY_KEYS, f);
  let jx: number, jy: number;
  if (f >= 928 && f < 1123) {
    // drift up into the station exactly behind the shark (3.4 behind its
    // centre). The tail fluke reaches 2.8 back, so in screen space the dome
    // sits just behind the fluke — but the jelly rides at z 0.9 vs the
    // shark's z -0.6, a 1.5-unit depth gap, so nothing actually touches.
    const t = sstep(928, 1000, f);
    jx = lerp(-0.9, sh.x - 3.4, t);
    jy = lerp(-1.15, sh.y - 0.2, t);
  } else {
    jx = j.x; jy = j.y;
  }
  refs.jelly.position.set(jx, jy, 0.9);
  refs.jelly.rotation.y = j.ry;
  // pulse: dome squash & stretch (drooped in line 4, joyful in lines 6–7)
  const droop = sstep(713, 760, f) * (1 - sstep(900, 928, f));
  const joy = line === 6 || line === 7 ? 1 : 0.4;
  const pulse = Math.sin(f * 0.22) * (0.1 * joy + 0.04);
  const domeScale = 1 - 0.15 * droop;
  refs.jellyDomeG.scale.set(
    domeScale * (1 + pulse),
    domeScale * (1 - pulse * 0.8),
    domeScale * (1 + pulse),
  );
  // anticipation crouch before the countdown launch (line 2)
  const crouch = sstep(403, 450, f) * (1 - sstep(500, 540, f));
  refs.jellyDomeG.scale.y *= 1 - 0.12 * crouch;
  // nod in line 1 (ready), droop tilt in line 4
  refs.jellyDomeG.rotation.z = 0.12 * sstep(201, 260, f) * (1 - sstep(360, 397, f))
    - 0.22 * droop;
  refs.jellyDomeG.position.y = Math.sin(f * 0.11) * 0.05 * (1 - droop);
  // tentacles: sway + follow-through lagging the dome pulse; limp in line 4
  refs.jellyTentG.children.forEach((c, i) => {
    const ph = (c.userData.phase as number) ?? i;
    const limp = 1 - 0.55 * droop;
    c.rotation.z = Math.sin(f * 0.07 + ph) * 0.18 * limp
      + Math.sin(f * 0.22 - 0.9) * 0.1 * limp;
    c.rotation.x = Math.cos(f * 0.06 + ph) * 0.1 * limp;
  });
  // mouth: small opening under the dome, driven by the jelly mouth track
  refs.jellyMouthG.scale.set(1 + jellyM * 0.4, 0.4 + jellyM * 1.8, 0.9);
  applyBlink(refs.jellyEyeL, refs.jellyEyeR, f, 45, 130);

  // ---- seaweed sway (wild in the bending current, line 3) -------------------
  const wild = line === 3 ? 1 : 0.25;
  refs.seaweed.forEach((b) => {
    const ph = b.userData.phase as number;
    b.rotation.z = Math.sin(f * 0.05 * (line === 3 ? 2.2 : 1) + ph) * 0.16 * wild;
  });

  // ---- bubbles rising (loop, pure function of frame) ------------------------
  refs.bubblesG.children.forEach((c, i) => {
    const speed = 0.012 + (i % 4) * 0.004;
    const y = -2.0 + (((f * speed + i * 0.53) % 1) * 5.2);
    c.position.set(-3.5 + (i % 6) * 1.3 + Math.sin(f * 0.02 + i) * 0.25, y, -0.5 + (i % 3) * 0.6);
    c.scale.setScalar(0.6 + ((i * 0.37) % 1) * 0.7);
  });

  // ---- plankton drifting with the current (faster in lines 2/3/5) -----------
  refs.planktonG.children.forEach((c, i) => {
    const sp = line === 3 ? 0.05 : line === 2 || line === 5 ? 0.035 : 0.02;
    c.position.set(
      -5.5 + ((f * sp + i * 0.83) % 11),
      -1.6 + (i % 7) * 0.5 + Math.sin(f * 0.015 + i) * 0.2,
      -1 + (i % 3) * 0.8,
    );
  });

  // ---- current streaks: drift right; bend DOWN in line 3 --------------------
  const bend = sstep(546, 600, f) * (1 - sstep(680, 707, f));
  refs.currentG.children.forEach((c, i) => {
    const sp = line === 3 ? 0.09 : line === 2 || line === 5 ? 0.06 : 0.035;
    c.position.x = -5 + ((f * sp + i * 2.1) % 10);
    c.position.y = -1 + i * 0.9 + Math.sin(f * 0.01 + i) * 0.15 - bend * 0.6;
    c.rotation.z = -0.55 * bend;
    (c as THREE.Mesh).material.opacity = 0.2 + 0.25 * bend;
  });

  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame by true extents (shark head/tail flip with its turn) ---
  // snout tip 2.1 ahead, tail fluke 2.45 behind (both along local +x/-x)
  const headX = sh.x + 2.1 * Math.cos(sh.ry);
  const tailX = sh.x - 2.45 * Math.cos(sh.ry);
  const left = Math.min(jx - 0.65, headX, tailX);
  const right = Math.max(jx + 0.65, headX, tailX);
  const { mid: midX, z } = frameExtent(left, right, 1.0);
  const midY = (jy + 0.4 + sh.y) / 2;
  camera.position.set(midX * 0.8, midY + 0.3 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, midY - 0.2, 0);
}
