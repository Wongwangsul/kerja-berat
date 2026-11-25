import * as THREE from "three";
import { BangauRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats (giliran bicara):
//  0  12–195   establishing: heron stands left on one leg, gull flies in from
//              the right; fish swims near the rock
//  1  201–411  gull hovers above, peering down at the rock; heron nods;
//              fish hides behind the rock edge
//  2  417–617  countdown — heron stands still on one leg, gull hovers calm
//  3  623–802  heron strikes TOO EARLY; fish startles and flees right with a
//              splash; gull swoops down pointing at the fleeing fish
//  4  808–1004 heron droops, neck bowed, beak near the water; gull lands on
//              the rock to comfort from the right
//  5  1010–1270 gull flies up again to scout from above; heron stands still
//              waiting for the signal; fish slowly returns toward the rock
//  6  1276–1439 gull flaps once (the signal) — heron strikes RIGHT! Fish
//              caught in the beak; sparkles + splash; both happy
//  7  1445–1666 warm close side by side in the shallows, heron holding the
//              fish proudly, gull flapping twice joyfully; closing sparkles

// ATURAN KERAS (pelajaran 25 Nov + Kucing 26 Nov): arah hadap SELALU searah
// gerak — setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target
// interaksi dijangkau KEPALA/paruh, bukan badan yang menembus; tokoh yang
// berbicara menghadap kamera/penonton (ry 3/4), tidak pernah membelakangi
// kamera; putaran 180° cepat dan lewat sisi kamera (ry lewat -π/2 atau 3π/2).
// Heron menghadap +x pada ry=0 (paruh di +x); ry=-π/4 = 3/4 ke kamera-kanan.

const HERON_KEYS = [
  { f: 0, x: -1.8, ry: -Math.PI / 4 },   // 3/4 ke kamera, bicara
  { f: 617, x: -1.8, ry: -Math.PI / 4 },
  { f: 660, x: -1.8, ry: 0 },            // putar di tempat → hadap ikan
  { f: 802, x: -1.8, ry: 0 },
  { f: 860, x: -1.8, ry: -Math.PI / 4 }, // putar di tempat → 3/4, lesu
  { f: 1010, x: -1.8, ry: -Math.PI / 4 },
  { f: 1050, x: -1.8, ry: 0 },           // putar di tempat → siap menyambar
  { f: 1439, x: -1.8, ry: 0 },
  { f: 1500, x: -1.8, ry: -Math.PI / 4 },// putar di tempat → bangga ke kamera
  { f: 1696, x: -1.8, ry: -Math.PI / 4 },
];
const HERON_Z = 0.4;

const GULL_KEYS = [
  { f: 0, x: 4.4, y: 3.8, ry: Math.PI },       // masuk dari kanan, menghadap kiri
  { f: 195, x: 2.4, y: 3.6, ry: Math.PI },
  { f: 260, x: 1.9, y: 3.5, ry: Math.PI * 1.25 }, // putar di tempat → 3/4 kamera
  { f: 617, x: 1.5, y: 3.4, ry: Math.PI * 1.25 },
  { f: 665, x: 1.5, y: 3.4, ry: Math.PI * 2 },    // putar di tempat → hadap kanan
  { f: 730, x: 2.6, y: 2.2, ry: Math.PI * 2 },    // menukik kanan-bawah menunjuk
  { f: 802, x: 2.7, y: 2.1, ry: Math.PI * 2 },
  { f: 850, x: 2.2, y: 1.7, ry: Math.PI },        // putar di tempat → hadap kiri
  { f: 920, x: 1.0, y: 1.2, ry: Math.PI },        // mendarat di batu
  { f: 1004, x: 1.0, y: 1.2, ry: Math.PI },
  { f: 1050, x: 1.2, y: 1.6, ry: Math.PI * 1.25 },// lepas landas, 3/4 kamera
  { f: 1120, x: 0.9, y: 3.3, ry: Math.PI * 1.25 },// naik mengintai di atas
  { f: 1439, x: 0.9, y: 3.3, ry: Math.PI * 1.25 },
  { f: 1490, x: 0.9, y: 3.3, ry: Math.PI },       // putar di tempat → hadap kiri
  { f: 1560, x: -0.7, y: 0.65, ry: Math.PI },     // turun ke air di sisi bangau
  { f: 1600, x: -0.7, y: 0.65, ry: Math.PI * 1.5 },// putar di tempat → kamera
  { f: 1696, x: -0.7, y: 0.65, ry: Math.PI * 1.5 },
];
const GULL_Z = -0.2;

const FISH_KEYS = [
  { f: 0, x: 0.2, z: 0.15 },
  { f: 195, x: 0.5, z: 0.1 },
  { f: 300, x: 1.5, z: -0.55 },   // bersembunyi di tepi batu
  { f: 617, x: 1.5, z: -0.55 },
  { f: 650, x: 1.5, z: -0.55 },
  { f: 740, x: 3.8, z: 0.1 },     // kaget, berenang menjauh ke kanan
  { f: 1004, x: 3.9, z: 0.2 },
  { f: 1100, x: 3.4, z: 0.2 },
  { f: 1270, x: 1.3, z: 0.1 },    // kembali mendekat ke batu
  { f: 1330, x: 0.7, z: 0.15 },   // di titik sambar
  { f: 1696, x: 0.7, z: 0.15 },
];
const FISH_RY_KEYS = [
  { f: 0, ry: 0 },
  { f: 1004, ry: 0 },
  { f: 1060, ry: Math.PI },       // berbalik mengikuti arah pulang (ke kiri)
  { f: 1696, ry: Math.PI },
];
const FISH_Y = -0.25;

const _tip = new THREE.Vector3();

export function poseFrame(frame: number, refs: BangauRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const heronM = mouthVal(MOUTH, "heron", f);
  const gullM = mouthVal(MOUTH, "gull", f);

  // ---- heron neck phases -----------------------------------------------
  // coil = antisipasi (leher menarik ke belakang) sebelum menyambar;
  // strike = leher melesat ke bawah-depan; droop = lesu giliran 4;
  // lift/proud = mengangkat ikan sesudah tertangkap.
  const coil1 = sstep(623, 655, f) * (1 - sstep(660, 690, f));
  const strike1 = sstep(660, 695, f) * (1 - sstep(730, 800, f));
  const midLook = sstep(730, 760, f) * (1 - sstep(770, 802, f));
  const droop = sstep(820, 870, f) * (1 - sstep(960, 1010, f));
  const coil2 = sstep(1290, 1325, f) * (1 - sstep(1330, 1360, f));
  const strike2 = sstep(1330, 1362, f) * (1 - sstep(1400, 1435, f));
  const lift = sstep(1400, 1435, f);
  const proud = sstep(1445, 1500, f);
  const strikeMax = Math.max(strike1, strike2);

  // ---- heron -------------------------------------------------------------
  const her = keyLerp(HERON_KEYS, f);
  refs.heron.position.set(her.x, 0, HERON_Z);
  refs.heron.rotation.y = her.ry;
  // squash before the strike, stretch through it, breathing otherwise
  const coil = Math.max(coil1, coil2);
  const breathe = Math.sin(f * 0.07) * 0.02;
  refs.heronBodyG.scale.set(1 + 0.05 * coil, 1 - 0.12 * coil, 1);
  refs.heronBodyG.position.y = 2.05 + breathe + 0.06 * strikeMax;
  refs.heronBodyG.rotation.z = -0.08 * strikeMax - 0.05 * droop;
  // neck: upright -0.12; coil back +0.30; strike -2.10; droop -2.20; proud -0.30
  refs.heronNeckG.rotation.z = -0.12
    + 0.42 * coil1 - 1.98 * strike1 - 0.38 * midLook
    - 2.08 * droop + 0.42 * coil2 - 1.98 * strike2
    - 0.23 * lift - 0.18 * proud;
  // head: level 0.08; tucked in coil; bowed down in strike/droop; nod speaking
  refs.heronHeadG.rotation.z = 0.08
    + 0.07 * coil1 - 0.63 * strike1 - 0.18 * midLook
    - 0.38 * droop + 0.07 * coil2 - 0.63 * strike2
    + 0.07 * lift + 0.07 * proud
    + Math.sin(f * 0.45) * 0.035 * heronM   // nod while speaking
    + Math.sin(f * 0.05) * 0.02;            // idle sway
  // beak: speaking; held open a touch while the fish is caught (line 6–7)
  const heldOpen = sstep(1365, 1400, f);
  refs.heronBeakLowG.rotation.z = -heronM * 0.32 - 0.12 * heldOpen;
  // wings: folded, lift a little in the strike, proud lift at the close
  const wingLift = 0.25 * strikeMax + 0.15 * proud;
  refs.heronWingL.rotation.x = 0.05 + Math.sin(f * 0.06) * 0.02 + wingLift;
  refs.heronWingR.rotation.x = -0.05 - Math.sin(f * 0.06) * 0.02 - wingLift;
  // one-leg stand (classic heron): right leg folded lines 0–2 and 5,
  // down for the strikes and the droop.
  // PERBAIKAN v2 (koordinator 25 Nov): kaki terangkat JANGAN menjulur ke
  // depan-atas (v1: rotasi +2.6 → batang hitam melayang di samping leher).
  // Kini kaki dilipat ke belakang-atas (-2.9) SAMBIL dipendekkan (scale 0.4)
  // sehingga seluruh kaki tersembunyi di dalam bulu perut — seperti bangau
  // asli: kaki yang terangkat memang tidak terlihat dari luar.
  const oneLeg = sstep(0, 30, f) * (1 - sstep(600, 623, f))
    + sstep(1010, 1040, f) * (1 - sstep(1276, 1310, f));
  const oneLegC = Math.min(1, oneLeg);
  refs.heronLegR.rotation.z = -2.9 * oneLegC;
  refs.heronLegR.scale.y = 1 - 0.6 * oneLegC;
  refs.heronLegL.rotation.z = Math.sin(f * 0.09) * 0.02;
  applyBlink(refs.heronEyeL, refs.heronEyeR, f, 40);

  // ---- gull ---------------------------------------------------------------
  const gul = keyLerp(GULL_KEYS, f);
  const airborne = line !== 4 || f < 850 || f > 1004;
  const hoverBob = airborne ? Math.sin(f * 0.22) * 0.07 : 0;
  refs.gull.position.set(gul.x, gul.y + hoverBob, GULL_Z);
  refs.gull.rotation.y = gul.ry;
  refs.gullBodyG.rotation.z = airborne ? Math.sin(f * 0.18) * 0.03 : 0;
  refs.gullBodyG.position.y = airborne ? Math.sin(f * 0.15) * 0.03 : 0;
  // wings: flap while airborne; folded when perched/standing;
  // ONE signal flap in line 6; joyful double flap at the close
  const signal = sstep(1290, 1305, f) * (1 - sstep(1305, 1330, f));
  const joyFlap = line === 7
    ? Math.sin((f - 1600) * 0.3) * 0.6 * sstep(1600, 1630, f)
    : 0;
  const flap = airborne ? 0.3 + Math.sin(f * 0.5) * 0.55 : 0.1 + Math.sin(f * 0.06) * 0.03;
  refs.gullWingL.rotation.x = flap + 0.9 * signal + joyFlap;
  refs.gullWingR.rotation.x = -flap - 0.9 * signal - joyFlap;
  // head: peer down at the rock (1), point at the fleeing fish (3),
  // signal from above (5); nod while speaking
  const peer = sstep(230, 280, f) * (1 - sstep(380, 411, f));
  const point = sstep(665, 700, f) * (1 - sstep(760, 802, f));
  const signalHead = sstep(1050, 1100, f) * (1 - sstep(1240, 1270, f));
  refs.gullHeadG.rotation.z = -0.35 * peer - 0.5 * point - 0.3 * signalHead
    + Math.sin(f * 0.45) * 0.035 * gullM
    + Math.sin(f * 0.05) * 0.02;
  refs.gullBeakLowG.rotation.z = -gullM * 0.32;
  applyBlink(refs.gullEyeL, refs.gullEyeR, f, 90);

  // ---- fish ---------------------------------------------------------------
  const caught = f >= 1365;
  if (caught) {
    // fish hangs from the heron's beak tip (true world position via marker)
    refs.heron.updateMatrixWorld(true);
    refs.heronBeakTip.getWorldPosition(_tip);
    refs.fish.position.set(_tip.x, _tip.y - 0.12, _tip.z);
    refs.fish.rotation.set(0, her.ry, -0.6);
    refs.fishBodyG.rotation.y = Math.sin(f * 0.3) * 0.2; // last wiggle
  } else {
    const fp = keyLerp(FISH_KEYS, f);
    refs.fish.position.set(fp.x, FISH_Y + Math.sin(f * 0.12) * 0.03, fp.z);
    refs.fish.rotation.set(0, keyLerp(FISH_RY_KEYS, f).ry, 0);
    refs.fishBodyG.rotation.y = Math.sin(f * 0.4) * 0.25; // tail wiggle
  }

  // ---- splashes ------------------------------------------------------------
  // windows: strike 1 (too early), catch (line 6), gull landing in water (7)
  type SplashWin = { f0: number; f1: number; c: [number, number, number] };
  const wins: SplashWin[] = [
    { f0: 665, f1: 790, c: [0.75, 0.1, 0.15] },
    { f0: 1355, f1: 1439, c: [0.65, 0.1, 0.3] },
    { f0: 1550, f1: 1620, c: [-0.7, 0.1, 0.4] },
  ];
  let active: SplashWin | null = null;
  for (const w of wins) if (f >= w.f0 && f <= w.f1) { active = w; break; }
  refs.splash.visible = active !== null;
  if (active) {
    const t = (f - active.f0) / (active.f1 - active.f0);
    refs.splashDrops.forEach((d) => {
      const a = d.userData.a as number;
      const r = d.userData.r as number;
      const h = d.userData.h as number;
      const spread = r * (0.3 + 0.7 * t);
      d.position.set(
        active!.c[0] + Math.cos(a) * spread,
        0.05 + h * t * (1 - t) * 2.2,
        active!.c[2] + Math.sin(a) * spread * 0.6,
      );
      d.scale.setScalar(1 - t * 0.5);
    });
  }

  // ---- ripples --------------------------------------------------------------
  refs.rippleHeron.scale.setScalar(1 + 0.25 * Math.sin(f * 0.08));
  refs.rippleRock.scale.setScalar(1 + 0.2 * Math.sin(f * 0.06 + 1.5));
  if (!caught) {
    const fp = keyLerp(FISH_KEYS, f);
    refs.rippleFish.visible = true;
    refs.rippleFish.position.set(fp.x, 0.03, fp.z);
    refs.rippleFish.scale.setScalar(1 + 0.2 * Math.sin(f * 0.09 + 0.7));
  } else {
    refs.rippleFish.visible = false;
  }
  refs.rippleGull.visible = f >= 1550;
  if (f >= 1550) refs.rippleGull.scale.setScalar(1 + 0.25 * Math.sin(f * 0.1));

  // ---- environment ------------------------------------------------------
  driftClouds(refs.clouds, f);
  refs.reeds.forEach((rg) => {
    rg.rotation.z = Math.sin(f * 0.04 + (rg.userData.phase as number)) * 0.08;
  });
  pulseSparkles(refs.sparkles, f, (line === 6 && f >= 1365) || line === 7);

  // ---- camera: frame by true extents -------------------------------------
  // heron head reach: upright ~0.65, strike/droop up to ~2.85 from heron x
  const headReach = 0.65 + 2.2 * Math.max(strikeMax, droop);
  const heronHeadX = her.x + headReach;
  const heronTailX = her.x - 1.35;
  const gullHeadX = gul.x + 1.0;
  const gullTailX = gul.x - 1.0;
  const fishX = caught ? _tip.x : keyLerp(FISH_KEYS, f).x;
  const left = Math.min(heronHeadX, heronTailX, gullHeadX, gullTailX, fishX - 0.4, -0.7);
  const right = Math.max(heronHeadX, heronTailX, gullHeadX, gullTailX, fishX + 0.4, 1.7);
  const { mid: midX, z } = frameExtent(left, right, 1.3);
  // top of frame: heron head upright ~4.27, strike ~2.6, droop ~1.3; gull top
  const heronTop = 4.27 - 2.95 * droop - 1.7 * strikeMax;
  const gullTop = gul.y + hoverBob + 0.9;
  const topY = Math.max(heronTop, gullTop);
  const midY = (topY - 0.2) / 2;
  camera.position.set(midX * 0.95, midY + 0.35 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.3, 0);
}
