import * as THREE from "three";
import { KucingRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, swayFlowers, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats (giliran bicara):
//  0  12–298   establishing: yarn rolls right, cat chases with small hops,
//              giraffe walks in from the right, tall neck up
//  1 304–513   giraffe bows its long neck toward the cat, pointing the way;
//              cat nods, ready to chase
//  2 519–669   countdown — cat crouches (squash), then leaps HIGH to the right;
//              giraffe turns in place to face the CAMERA and watches the cat
//  3 675–887   cat overshot the yarn; yarn rolls on under the thorny bush;
//              cat lands right, confused; giraffe (facing camera) leans its
//              neck and muzzle right toward the bush to point it out
//  4 893–1101  cat droops, tail limp; giraffe turns in place, walks left to
//              comfort it, neck bowed down toward the cat
//  5 1107–1348 giraffe turns back right and guides step by step — head dips
//              before each of the cat's three small hops toward the bush
//  6 1354–1530 cat catches the yarn at the bush edge with both front paws;
//              sparkles; giraffe bows deep in affection
//  7 1536–1762 side by side at the garden edge, cat winding the yarn,
//              giraffe nodding twice; closing sparkles

// ATURAN KERAS (pelajaran 25 Nov): arah hadap SELALU searah gerak — setiap
// perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target interaksi
// dijangkau KEPALA, bukan badan yang menembus; jarak pusat-pusat aman.
// Kucing tidak pernah berputar (selalu menghadap kanan, ry=0). Jerapah
// berputar lewat sisi kamera (ry π → 2π, lewat 3π/2) selama ±40 frame.
// PENYEDERHANAAN (jujur, seperti "sentuh cula" Badak): usapan moncong ke
// kepala Kucing tidak dibuat kontak harfiah — leher Jerapah tidak bisa
// mencapai setinggi kepala Kucing (poros leher y≈2,45) tanpa berlutut;
// gantinya tunduk dalam + Kucing menengadah gembira.

// Cat: z 0.6 (front lane). Giraffe: z -0.5 (behind, never hides the cat).
// Yarn: z 0.9. Thorny bush centre x 5.4 — yarn ends at its edge (4.3).
const CAT_KEYS = [
  { f: 0, x: -1.6 },
  { f: 298, x: -1.45 },
  { f: 513, x: -1.3 },
  { f: 600, x: -1.3 },
  { f: 650, x: 1.2 },
  { f: 1175, x: 1.9 },
  { f: 1245, x: 2.8 },
  { f: 1315, x: 3.7 },
  { f: 1792, x: 3.7 },
];

const GIR_KEYS = [
  { f: 0, x: 4.4, ry: Math.PI },     // masuk dari kanan, menghadap kiri
  { f: 298, x: 3.7, ry: Math.PI },
  { f: 470, x: 3.7, ry: Math.PI },
  { f: 525, x: 3.7, ry: Math.PI * 1.5 }, // putar di tempat → menghadap KAMERA
  { f: 887, x: 3.7, ry: Math.PI * 1.5 }, // tahan menghadap kamera giliran 2–3
  { f: 935, x: 3.7, ry: Math.PI },       // putar di tempat → hadap kiri lagi
  { f: 1101, x: 3.0, ry: Math.PI },      // berjalan kiri menghibur (jarak akhir 1,8)
  { f: 1107, x: 3.0, ry: Math.PI },
  { f: 1140, x: 3.0, ry: Math.PI * 2 },   // putar di tempat → hadap kanan
  { f: 1792, x: 3.0, ry: Math.PI * 2 },
];

const YARN_KEYS = [
  { f: 0, x: -0.9 },
  { f: 298, x: -0.5 },
  { f: 513, x: -0.2 },
  { f: 669, x: 0.3 },
  { f: 887, x: 3.9 },
  { f: 1101, x: 4.2 },
  { f: 1348, x: 4.3 },
  { f: 1792, x: 4.3 },
];

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: KucingRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const catM = mouthVal(MOUTH, "cat", f);
  const girM = mouthVal(MOUTH, "giraffe", f);

  // ---- yarn ---------------------------------------------------------------
  const yarnX = keyLerp(YARN_KEYS, f).x;
  refs.yarnG.position.set(yarnX, 0.32, 0.9);
  refs.yarnG.rotation.z = -(yarnX + 0.9) / 0.32; // rolls as it travels
  refs.yarnStrand.position.set(yarnX - 0.5, 0.05, 0.9);

  // ---- giraffe ------------------------------------------------------------
  const gir = keyLerp(GIR_KEYS, f);
  refs.giraffe.position.set(gir.x, 0, -0.5);
  refs.giraffe.rotation.y = gir.ry;
  // walking windows: enter (0–298), walk left to comfort (935–1101).
  // No step right in line 2 any more: the giraffe faces the CAMERA there,
  // so stepping sideways would be a crab-walk — it stands and watches.
  const walkAmp = 0.35 * (
    sstep(0, 40, f) * (1 - sstep(260, 298, f))
    + sstep(935, 965, f) * (1 - sstep(1060, 1101, f))
  );
  const walkPh = f * 0.3;
  refs.girLegFL.rotation.z = Math.sin(walkPh) * walkAmp;
  refs.girLegBR.rotation.z = Math.sin(walkPh) * walkAmp;
  refs.girLegFR.rotation.z = Math.sin(walkPh + Math.PI) * walkAmp;
  refs.girLegBL.rotation.z = Math.sin(walkPh + Math.PI) * walkAmp;
  refs.girBodyG.position.y = 2.0
    + (walkAmp > 0.02 ? Math.abs(Math.sin(walkPh)) * 0.06 : Math.sin(f * 0.07) * 0.02);
  // neck bow (rotation.z negative = head forward-down, local +x = facing dir):
  // invite (1) / comfort (4) / guide dips (5) / deep bow (6) — all while the
  // giraffe faces left/right, where rotation.z is the right axis.
  // POINT (3) is different: the giraffe faces the CAMERA then, so pointing
  // at the bush (world +x) is a sideways lean — rotation.x — plus the head
  // yawing right. Facing the camera also keeps the face visible to the
  // viewer/cat throughout lines 2–3 (perbaikan koordinator atas stills v1).
  const facingCam = sstep(470, 525, f) * (1 - sstep(890, 935, f));
  const bowInvite = sstep(320, 360, f) * (1 - sstep(470, 513, f));
  const bowPoint = sstep(690, 730, f) * (1 - sstep(850, 887, f));
  const bowComfort = sstep(950, 1000, f) * (1 - sstep(1060, 1101, f));
  let guideDip = 0;
  for (const h of [1130, 1200, 1270]) {
    guideDip += sstep(h - 15, h, f) * (1 - sstep(h + 10, h + 35, f));
  }
  const bowDeep = sstep(1400, 1440, f) * (1 - sstep(1500, 1530, f));
  const bowOther = 0.55 * bowInvite + 0.55 * bowComfort
    + 0.3 * guideDip + 0.85 * bowDeep;
  // total bow magnitude (for head height + camera extent)
  const bow = bowOther + 0.35 * bowPoint;
  // happy double nod at the close: ~2 nods over 70 frames
  const nodG = line === 7 ? Math.sin((f - 1560) * 0.18) * 0.14 * sstep(1560, 1590, f) : 0;
  refs.girNeckG.rotation.z = -bowOther + nodG + Math.sin(f * 0.05) * 0.02;
  refs.girNeckG.rotation.x = -0.45 * bowPoint * facingCam;
  // head yaw while facing the camera: left toward the cat in line 2
  // (countdown), right toward the bush in line 3 (pointing)
  const watchCat = sstep(519, 560, f) * (1 - sstep(660, 700, f));
  refs.girHeadG.rotation.y = facingCam * (-0.7 * watchCat + 0.9 * bowPoint);
  refs.girHeadG.rotation.z = -0.25 * bow
    + Math.sin(f * 0.45) * 0.035 * girM
    + Math.sin(f * 0.05) * 0.02;
  refs.girJawG.rotation.z = -girM * 0.4;
  // ears: gentle flick, perked when guiding
  const perk = sstep(1107, 1140, f);
  refs.girEarL.rotation.x = -0.1 - 0.12 * perk + Math.sin(f * 0.06) * 0.04;
  refs.girEarR.rotation.x = 0.1 + 0.12 * perk - Math.sin(f * 0.06) * 0.04;
  refs.girTailG.rotation.y = Math.sin(f * 0.1) * 0.3;
  applyBlink(refs.girEyeL, refs.girEyeR, f, 55, 130);

  // ---- cat ------------------------------------------------------------------
  const catX = keyLerp(CAT_KEYS, f).x;
  // small chase hops (line 0) + three guided hops (line 5) + the big leap (2)
  const hop0 = jumpY(f, 40, 75, 0.22) + jumpY(f, 110, 145, 0.22)
    + jumpY(f, 180, 215, 0.22) + jumpY(f, 250, 285, 0.22)
    + jumpY(f, 340, 375, 0.22) + jumpY(f, 430, 465, 0.22);
  const hop5 = jumpY(f, 1130, 1175, 0.35) + jumpY(f, 1200, 1245, 0.35)
    + jumpY(f, 1270, 1315, 0.35);
  const bigJump = jumpY(f, 600, 650, 1.5);
  const catY = hop0 + hop5 + bigJump;
  refs.cat.position.set(catX, catY, 0.6);
  refs.cat.rotation.y = 0; // cat always faces right, the direction of travel
  // squash & stretch: crouch before the leap, stretch mid-air, squash on landing
  const crouch = sstep(540, 600, f);
  const air = sstep(600, 615, f) * (1 - sstep(635, 650, f));
  const land = sstep(650, 662, f) * (1 - sstep(662, 690, f));
  const breathe = Math.sin(f * 0.09) * 0.02;
  refs.catBodyG.scale.set(
    1 + 0.1 * crouch + 0.08 * land - 0.05 * air,
    1 - 0.18 * crouch - 0.15 * land + 0.12 * air,
    1,
  );
  refs.catBodyG.position.y = 0.45 + breathe;
  // sad droop (line 4), lean forward while catching (line 6)
  const sad = sstep(893, 940, f) * (1 - sstep(1060, 1101, f));
  const reach = sstep(1380, 1420, f) * (1 - sstep(1500, 1530, f));
  const wind = sstep(1536, 1570, f);
  const happy = sstep(1354, 1400, f);
  refs.catBodyG.rotation.z = -0.12 * sad + 0.08 * reach;
  // legs: tucked mid-leap, reaching at the catch, winding at the close
  refs.catLegFL.rotation.z = 0.6 * air + 0.9 * reach
    + (0.5 * wind + 0.3 * Math.sin(f * 0.35) * wind);
  refs.catLegFR.rotation.z = 0.6 * air + 0.9 * reach
    + (0.5 * wind - 0.3 * Math.sin(f * 0.35) * wind);
  refs.catLegBL.rotation.z = -0.6 * air + Math.sin(f * 0.1) * 0.03;
  refs.catLegBR.rotation.z = -0.6 * air + Math.sin(f * 0.1 + Math.PI) * 0.03;
  // head: nod agreeing (1), tilt confused (3), down sad (4), up happy (6–7)
  const nod = Math.sin((f - 330) * 0.22) * 0.12
    * sstep(330, 360, f) * (1 - sstep(470, 513, f));
  const confused = sstep(690, 730, f) * (1 - sstep(850, 887, f));
  refs.catHeadG.rotation.z = nod - 0.35 * sad - 0.1 * reach + 0.15 * happy
    + Math.sin(f * 0.5) * 0.05 * catM;
  refs.catHeadG.rotation.y = -0.3 * confused;
  refs.catHeadG.rotation.x = 0.28 * confused;
  refs.catJawG.rotation.z = -catM * 0.5;
  // ears: twitch while idle, fold back when sad, perked when happy
  const twitch = Math.sin(f * 0.11) * 0.06 + Math.sin(f * 0.043 + 2) * 0.05;
  refs.catEarL.rotation.z = 0.55 * sad - 0.15 * happy + twitch;
  refs.catEarR.rotation.z = 0.55 * sad - 0.15 * happy - twitch;
  // tail: wagging while chasing/happy, limp when sad
  const wagAmp = line === 4 ? 0.08 : 0.5;
  const wagSpd = line === 6 || line === 7 ? 0.28 : 0.15;
  refs.catTailG.rotation.y = Math.sin(f * wagSpd) * wagAmp;
  refs.catTailG.rotation.z = -0.5 * sad;
  applyBlink(refs.catEyeL, refs.catEyeR, f, 77, 120);

  // ---- environment ------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame by true extents (heads/tails flip with facing) --------
  // Head reach gets +0.5 padding (the head sphere itself), margin 1.3, and
  // the camera stays nearly centred (0.95/0.97) — the old 0.85/0.90 pull
  // cropped the giraffe's head at the right edge in round 1 (f600/f780).
  const catHeadX = catX + 0.85;
  const catTailX = catX - 0.7;
  const headReach = 0.95 + 2.05 * Math.sin(bow) + 0.5;
  // while facing the camera the head leans right toward the bush (line 3)
  const girHeadX = gir.x + Math.cos(gir.ry) * headReach + facingCam * 0.9 * bowPoint;
  const girTailX = gir.x - Math.cos(gir.ry) * 1.5;
  // the body's own half-width in x (1.36 long-axis, 0.68 short-axis):
  // when the giraffe faces the camera, cos(ry)=0 collapses the head/tail
  // extents to a point and the body itself was being cropped (f600 round 2)
  const bodyHalf = Math.abs(Math.cos(gir.ry)) * 1.36 + Math.abs(Math.sin(gir.ry)) * 0.68;
  const left = Math.min(catHeadX, catTailX, girHeadX, girTailX, gir.x - bodyHalf, yarnX - 0.4);
  const right = Math.max(catHeadX, catTailX, girHeadX, girTailX, gir.x + bodyHalf, yarnX + 0.4);
  const { mid: midX, z } = frameExtent(left, right, 1.3);
  const headY = 2.45 + 2.05 * Math.cos(bow); // giraffe head height (4.5 upright)
  const midY = (0.6 + headY) / 2;
  camera.position.set(midX * 0.95, midY + 0.25 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.35, 0);
}
