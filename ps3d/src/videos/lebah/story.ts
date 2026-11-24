import * as THREE from "three";
import { LebahRefs } from "./world";
import {
  clamp01, sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, swayFlowers, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats (giliran bicara):
//  0  12–228  bee strained, pelican flies in from the right
//  1 234–400  pelican bows its beak, inviting
//  2 406–528  countdown, then fly right — bee rides on pelican's back
//  3 534–703  strong wind, pollen scatters left, both dragged left-down
//  4 709–933  bee droops, pelican comes close to comfort
//  5 939–1128 pelican opens beak wide, bee rides inside it, steady flight to nest
//  6 1134–1294 arrive at the nest, sparkles
//  7 1300–1476 side by side at the nest, happy

const PEL_KEYS = [
  { f: 0, x: 4.6, y: 2.4, ry: 0 },
  { f: 228, x: 1.9, y: 1.7, ry: 0 },
  { f: 400, x: 1.6, y: 1.55, ry: 0 },
  { f: 470, x: 1.6, y: 1.5, ry: 0 },
  { f: 528, x: 3.1, y: 2.3, ry: 0 },
  { f: 703, x: -1.7, y: 0.35, ry: 0.25 },
  { f: 740, x: -1.6, y: 0.3, ry: Math.PI },  // quick turn in the air to face the bee
  { f: 933, x: -0.55, y: 0.15, ry: Math.PI },
  { f: 960, x: -0.55, y: 0.3, ry: Math.PI },
  { f: 1020, x: -0.5, y: 0.5, ry: 0 },   // turn around in place before the nest flight
  { f: 1128, x: 2.7, y: 2.25, ry: 0 },
  { f: 1294, x: 3.0, y: 2.35, ry: 0 },
  { f: 1506, x: 3.0, y: 2.35, ry: 0 },
];

const BEE_KEYS = [
  { f: 0, x: -1.7, y: 0.5, ry: 0 },
  { f: 228, x: -1.6, y: 0.55, ry: 0 },
  { f: 400, x: -1.5, y: 0.6, ry: 0 },
  { f: 460, x: -1.5, y: 0.55, ry: 0 },
  // 460–703: riding on the pelican's back (handled below)
  { f: 703, x: -1.8, y: -1.0, ry: 0 },
  { f: 933, x: -1.8, y: -1.0, ry: 0 },
  // 939–1128: inside the pelican's beak (handled below)
  { f: 1128, x: 2.95, y: 2.5, ry: 0 },
  { f: 1506, x: 2.9, y: 2.55, ry: 0 },
];

export function poseFrame(frame: number, refs: LebahRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const beeM = mouthVal(MOUTH, "bee", f);
  const pelM = mouthVal(MOUTH, "pelican", f);

  // ---- pelican position -----------------------------------------------
  const pel = keyLerp(PEL_KEYS, f);
  const flying = line === 0 || line === 2 || line === 3 || line === 5;
  const flap = flying ? 0.3 + Math.sin(f * 0.35) * 0.55 : 0.08 + Math.sin(f * 0.06) * 0.04;
  refs.pelican.position.set(pel.x, pel.y, 0);
  refs.pelican.rotation.y = pel.ry;
  // gentle body bob + breathing while perched
  const bob = flying ? Math.sin(f * 0.22) * 0.05 : Math.sin(f * 0.08) * 0.02;
  refs.pelBodyG.position.y = 1.15 + bob;
  refs.pelBodyG.rotation.z = flying ? Math.sin(f * 0.18) * 0.03 : 0;
  refs.pelWingL.rotation.x = flap;
  refs.pelWingR.rotation.x = -flap;
  // happy double wing-flap at the close (line 7)
  if (line === 7) {
    const w = Math.sin(f * 0.55) * 0.5 * sstep(1300, 1340, f);
    refs.pelWingL.rotation.x += w;
    refs.pelWingR.rotation.x -= w;
  }
  // head: bow to invite (line 1), comfort (line 4), steady in flight
  const bow = sstep(234, 280, f) * (1 - sstep(380, 420, f));
  const comfort = sstep(760, 820, f) * (1 - sstep(900, 940, f));
  refs.pelHeadG.rotation.z = -0.5 * bow - 0.42 * comfort
    + Math.sin(f * 0.45) * 0.035 * pelM          // nod while speaking
    + Math.sin(f * 0.05) * 0.02;                 // idle sway
  refs.pelHeadG.rotation.y = -0.15 * bow;
  // beak: speaking + wide open while the bee climbs in (line 5)
  const beakOpen = sstep(955, 990, f) * (1 - sstep(1100, 1130, f));
  refs.pelBeakLowG.rotation.z = -pelM * 0.32 - beakOpen * 0.5;
  applyBlink(refs.pelEyeL, refs.pelEyeR, f, 40);

  // ---- bee position ----------------------------------------------------
  let bx: number, by: number;
  if (f >= 460 && f < 703) {
    // riding on the pelican's back
    bx = pel.x - 0.15; by = pel.y + 1.95;
  } else if (f >= 939 && f < 1128) {
    // inside the beak, head peeking out at the beak tip
    const t = sstep(939, 990, f);
    bx = lerp(-1.8, pel.x + 1.95, t);
    by = lerp(-1.0, pel.y + 1.45, t);
  } else {
    const b = keyLerp(BEE_KEYS, f);
    bx = b.x; by = b.y;
  }
  refs.bee.position.set(bx, by, 0.35);
  // strained bob under the pollen load (line 0), droop (line 4), happy (line 7)
  const strain = line === 0 ? Math.sin(f * 0.5) * 0.07 : 0;
  const droop = line === 4 ? -0.35 : 0;
  refs.beeBodyG.position.y = strain;
  refs.beeBodyG.rotation.z = droop * sstep(709, 760, f) * (1 - sstep(900, 940, f))
    - 0.12 * sstep(406, 440, f) * (1 - sstep(470, 500, f)); // crouch before takeoff
  refs.beeBodyG.rotation.x = Math.sin(f * 0.09) * 0.04; // breathing sway
  // wings: fast flap, drooping when sad (line 4)
  const wingAmp = line === 4 ? 0.12 : 0.55;
  const wingSpd = line === 4 ? 0.12 : 1.05;
  refs.beeWingL.rotation.x = 0.25 + Math.sin(f * wingSpd) * wingAmp;
  refs.beeWingR.rotation.x = -0.25 - Math.sin(f * wingSpd) * wingAmp;
  if (line === 4) { refs.beeWingL.rotation.z = 0.5; refs.beeWingR.rotation.z = -0.5; }
  else { refs.beeWingL.rotation.z = 0; refs.beeWingR.rotation.z = 0; }
  // jaw + head bob while speaking
  refs.beeJawG.rotation.z = -beeM * 0.5;
  refs.beeHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * beeM
    + (line === 4 ? -0.3 * sstep(709, 760, f) : 0);
  // wave a leg at the close
  refs.beeLegF.rotation.z = line === 7 ? 0.4 + Math.sin(f * 0.5) * 0.5 : 0;
  applyBlink(refs.beeEyeL, refs.beeEyeR, f, 77);

  // pollen ball: carried until line 4, then gone (safe inside the beak)
  refs.pollenG.visible = f < 939;

  // ---- wind + scattered pollen (line 3 only) ---------------------------
  const windy = line === 3;
  refs.windG.visible = windy;
  if (windy) {
    const u = (f - 534) / (703 - 534);
    refs.windG.children.forEach((c, i) => {
      c.position.x = 4 - (((f * 0.12 + i * 1.9) % 9));
      c.position.y = -0.5 + ((i * 0.83) % 4.5);
    });
    void u;
  }
  refs.pollenBits.visible = windy;
  if (windy) {
    refs.pollenBits.children.forEach((c, i) => {
      const t = (f - 534 + i * 17) / 120;
      c.position.set(bx - 0.3 - t * 2.4, by + 0.4 - t * 0.9, 0.4 + Math.sin(i * 2.1) * 0.4);
    });
  }

  // ---- environment ------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame the pair by true extents (beak forward, tails back)
  const fwd = 2.8 * Math.cos(pel.ry); // beak reach in x (negative when facing left)
  const left = Math.min(bx - 0.5, pel.x + Math.min(fwd, -1.5));
  const right = Math.max(bx + 0.5, pel.x + Math.max(fwd, 1.5));
  const { mid: midX, z } = frameExtent(left, right, 1.2);
  const midYb = (by + (pel.y + 1.15)) / 2; // body centres, not roots
  camera.position.set(midX * 0.85, midYb + 0.8 + Math.sin(f * 0.017) * 0.05, z);
  camera.lookAt(midX * 0.92, midYb - 0.1, 0);
  void clamp01;
}
