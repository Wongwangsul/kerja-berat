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
//  0  12–228  bee strained, pelican flies in from the right (facing left = travel)
//  1 234–400  pelican bows its beak toward the bee, inviting
//  2 406–528  countdown, bee climbs onto the pelican's back, short flight right
//  3 534–703  strong wind, pollen scatters left, bee blown off, both dragged
//              left-down; pelican lands on the meadow
//  4 709–933  bee droops on the ground, pelican turns and bows close to comfort
//  5 939–1128 pelican opens beak wide, bee climbs into the pouch, steady flight
//              to the nest; bee hops out onto the nest as they arrive
//  6 1134–1294 arrive at the nest, sparkles
//  7 1300–1476 side by side at the nest, happy

// PERBAIKAN 24 Nov (Icul menolak versi lama): arah hadap SELALU searah gerak.
// Pelikan menghadap +x pada ry=0 (paruh di +x) dan −x pada ry=π.
// Setiap perubahan arah dilakukan dengan PUTAR DI TEMPAT (x,y diam), baru
// bergerak — tidak ada lagi meluncur mundur/menyamping.
const PEL_KEYS = [
  { f: 0, x: 4.6, y: 2.4, ry: Math.PI },      // masuk dari kanan, menghadap kiri
  { f: 228, x: 1.9, y: 1.7, ry: Math.PI },    // tiba, menghadap lebah
  { f: 400, x: 1.6, y: 1.55, ry: Math.PI },   // tunduk mengundang, menghadap lebah
  { f: 470, x: 1.6, y: 1.5, ry: Math.PI },    // lebah naik ke punggung
  { f: 495, x: 1.6, y: 1.5, ry: 0 },          // putar di tempat → hadap kanan
  { f: 528, x: 2.6, y: 2.1, ry: 0 },          // terbang kanan bersama lebah
  { f: 560, x: 2.6, y: 2.0, ry: Math.PI },    // putar di tempat → hadap kiri
  { f: 703, x: -4.35, y: -1.53, ry: Math.PI },// angin menyeret kiri-bawah, mendarat
  { f: 732, x: -4.35, y: -1.53, ry: 0 },      // putar di tempat → hadap lebah
  { f: 933, x: -4.35, y: -1.53, ry: 0 },      // diam menghibur (tunduk ke lebah)
  { f: 960, x: -4.35, y: -1.4, ry: 0 },       // lepas landas
  { f: 1020, x: -1.5, y: 0.6, ry: 0 },        // mendaki ke kanan
  { f: 1128, x: 2.7, y: 2.6, ry: 0 },         // tiba di sarang (melayang lebih tinggi
  { f: 1294, x: 3.0, y: 2.7, ry: 0 },         //  agar perut tidak menelan lebah)
  { f: 1506, x: 3.0, y: 2.7, ry: 0 },
];

// Posisi lebah saat diam (tanah / sarang). Fase gerak dihitung di poseFrame.
const BEE_KEYS = [
  { f: 0, x: -1.7, y: 0.5 },
  { f: 228, x: -1.6, y: 0.55 },
  { f: 400, x: -1.5, y: 0.6 },
  { f: 703, x: -1.8, y: -1.0 },
  { f: 933, x: -1.8, y: -1.0 },
  { f: 1110, x: 2.95, y: 2.5 },
  { f: 1506, x: 2.9, y: 2.55 },
];

// Arah hadap lebah: 0 = ke kanan, π = ke kiri. Putar saat terbang berbalik
// arah (jatuh tertiup angin) dan saat masuk paruh; di sarang menghadap pelikan.
const BEE_RY_KEYS = [
  { f: 0, ry: 0 },
  { f: 560, ry: 0 },
  { f: 600, ry: Math.PI },   // berbalik mengikuti arah jatuh (ke kiri)
  { f: 939, ry: Math.PI },   // menatap pelikan yang menghibur
  { f: 990, ry: 0 },         // berbalik masuk paruh menghadap ujung paruh
  { f: 1506, ry: 0 },
];

// Kantong paruh pelikan (dunia, saat paruh terbuka, ry=0):
// pusat kantong ≈ pel + (2.18, 1.23); lebah duduk di bukaan kantong,
// setengah badan di dalam, kepala menjulur ke ujung paruh.
const POUCH_DX = 2.23;
const POUCH_DY = 1.38;
// Punggung pelikan: atas badan di pel.y + 1.96; lebah duduk di atasnya.
const RIDE_DY = 2.35;

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
  // head: bow to invite (line 1, facing the bee now), comfort (line 4),
  // steady in flight. Comfort bow deepened so the beak tip reaches just
  // above the drooping bee's head (head sits above the bee, beak past it).
  const bow = sstep(234, 280, f) * (1 - sstep(380, 420, f));
  const comfort = sstep(740, 790, f) * (1 - sstep(900, 940, f));
  refs.pelHeadG.rotation.z = -0.5 * bow - 0.55 * comfort
    + Math.sin(f * 0.45) * 0.035 * pelM          // nod while speaking
    + Math.sin(f * 0.05) * 0.02;                 // idle sway
  refs.pelHeadG.rotation.y = -0.15 * bow;
  // beak: speaking + wide open while the bee climbs in (line 5)
  const beakOpen = sstep(955, 990, f) * (1 - sstep(1100, 1130, f));
  refs.pelBeakLowG.rotation.z = -pelM * 0.32 - beakOpen * 0.5;
  applyBlink(refs.pelEyeL, refs.pelEyeR, f, 40);

  // ---- bee position ----------------------------------------------------
  // Fase gerak lebah (semua transisi dianimasikan — tidak ada teleport):
  //  <500 diam di tanah | 500–540 naik ke punggung (sesudah pelikan berputar
  //  menghadap kanan, jadi lebah naik dari sisi ekor — bukan lewat paruh) |
  //  540–560 menumpang | 560–703 jatuh tertiup angin (bezier, melewati ATAS
  //  punggung pelikan) | 703–939 diam merunduk | 939–990 naik ke kantong
  //  paruh | 990–1060 di dalam kantong | 1060–1110 melompat ke sarang |
  //  >1110 di sarang
  const ridePos = (ff: number) => {
    const p = keyLerp(PEL_KEYS, ff);
    return { x: p.x - 0.15, y: p.y + RIDE_DY };
  };
  const pouchPos = () => ({ x: pel.x + POUCH_DX, y: pel.y + POUCH_DY });
  let bx: number, by: number, bz = 0.35;
  if (f < 500) {
    const b = keyLerp(BEE_KEYS, f);
    bx = b.x; by = b.y;
  } else if (f < 540) {
    // climb onto the back (countdown): arc up from the ground
    const u = sstep(500, 540, f);
    const r = ridePos(f);
    bx = lerp(-1.5, r.x, u);
    by = lerp(0.6, r.y, u) + Math.sin(u * Math.PI) * 0.6;
  } else if (f < 560) {
    const r = ridePos(f);
    bx = r.x; by = r.y;
  } else if (f < 703) {
    // blown off the back: quadratic bezier, control point high above the
    // pelican's path so the bee arcs OVER the body, never through it
    const u = (f - 560) / (703 - 560);
    const p560 = keyLerp(PEL_KEYS, 560);
    const p0 = { x: p560.x - 0.15, y: p560.y + RIDE_DY };
    const c = { x: p0.x - 2.5, y: p0.y + 1.2 };
    const p2 = { x: -1.8, y: -1.0 };
    const w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u;
    bx = w0 * p0.x + w1 * c.x + w2 * p2.x;
    by = w0 * p0.y + w1 * c.y + w2 * p2.y;
  } else if (f < 939) {
    const b = keyLerp(BEE_KEYS, f);
    bx = b.x; by = b.y;
  } else if (f < 990) {
    // climb into the open pouch (beak opens 955–990)
    const t = sstep(939, 990, f);
    const p = pouchPos();
    bx = lerp(-1.8, p.x, t);
    by = lerp(-1.0, p.y, t);
    bz = lerp(0.35, 0.05, t);
  } else if (f < 1060) {
    const p = pouchPos();
    bx = p.x; by = p.y; bz = 0.05;
  } else if (f < 1110) {
    // hop out of the pouch onto the nest as the pelican arrives
    const t = sstep(1060, 1110, f);
    const p = pouchPos();
    bx = lerp(p.x, 2.95, t);
    by = lerp(p.y, 2.5, t) + Math.sin(t * Math.PI) * 0.5;
    bz = lerp(0.05, 0.35, t);
  } else {
    const b = keyLerp(BEE_KEYS, f);
    bx = b.x; by = b.y;
  }
  refs.bee.position.set(bx, by, bz);
  refs.bee.rotation.y = keyLerp(BEE_RY_KEYS, f).ry;
  // strained bob under the pollen load (line 0), droop (line 4), happy (line 7)
  const strain = line === 0 ? Math.sin(f * 0.5) * 0.07 : 0;
  const droop = line === 4 ? -0.35 : 0;
  // tumble wobble while blown off (rises and settles back to 0 — no snap)
  const tumble = f >= 560 && f < 703 ? Math.sin(((f - 560) / 143) * Math.PI) * 0.9 : 0;
  refs.beeBodyG.position.y = strain;
  refs.beeBodyG.rotation.z = droop * sstep(709, 760, f) * (1 - sstep(900, 940, f))
    - 0.12 * sstep(406, 440, f) * (1 - sstep(470, 500, f)) // crouch before takeoff
    + tumble;
  refs.beeBodyG.rotation.x = Math.sin(f * 0.09) * 0.04; // breathing sway
  // wings: fast flap, drooping when sad (line 4)
  const wingAmp = line === 4 ? 0.12 : 0.55;
  const wingSpd = line === 4 ? 0.12 : 1.05;
  refs.beeWingL.rotation.x = 0.25 + Math.sin(f * wingSpd) * wingAmp;
  refs.beeWingR.rotation.x = -0.25 - Math.sin(f * wingSpd) * wingAmp;
  if (line === 4) { refs.beeWingL.rotation.z = 0.5; refs.beeWingR.rotation.z = -0.5; }
  else { refs.beeWingL.rotation.z = 0; refs.beeWingR.rotation.z = 0; }
  // jaw + head bob while speaking; head tucked in while riding in the pouch
  const tuck = sstep(990, 1000, f) * (1 - sstep(1050, 1060, f));
  refs.beeJawG.rotation.z = -beeM * 0.5;
  refs.beeHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * beeM
    + (line === 4 ? -0.3 * sstep(709, 760, f) : 0)
    - 0.18 * tuck;
  // wave a leg at the close
  refs.beeLegF.rotation.z = line === 7 ? 0.4 + Math.sin(f * 0.5) * 0.5 : 0;
  applyBlink(refs.beeEyeL, refs.beeEyeR, f, 77);

  // pollen ball: carried until the bee mounts the pelican (f460); while
  // riding it would be buried inside the pelican's back, and after the wind
  // it is scattered (see pollenBits) — so it stays hidden from the mount on.
  refs.pollenG.visible = f < 460;

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
