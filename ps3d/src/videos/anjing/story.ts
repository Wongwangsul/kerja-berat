import * as THREE from "three";
import { AnjingRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, swayFlowers, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Batas giliran (diturunkan dari timing.json — otomatis menempel ke
// batas ASLI begitu timing.json diganti agen audio):
const L0 = LINES[0], L1 = LINES[1], L2 = LINES[2],
  L3 = LINES[3], L4 = LINES[4], L5 = LINES[5];
const END = (timing as { frames: number }).frames;

// Beats (giliran bicara):
//  0  establishing: ladang sore; Anjing kiri mengendus udara semangat
//     (lompat kecil), Panda duduk kanan dekat rumpun bambu
//  1  Panda angkat kaki depan isyarat tenang; Anjing berhenti, duduk,
//     telinga terangkat mendengarkan
//  2  Anjing mengendus pelan ke kiri lalu ke kanan, kepala berputar
//     bingung; ekor melambat
//  3  Anjing berputar di tempat menunduk lesu; Panda bangun, berjalan
//     pelan mendekat, menunjuk tanah dengan kaki depannya
//  4  Anjing menengadah ke Panda, lalu menoleh ke langit sore yang
//     meredup — gelisah; Panda tenang menunjuk jejak
//  5  Keduanya mengikuti jejak ke rumpun bambu kanan; Anjing mengendus
//     sekali lagi dengan yakin, lalu menggali pelan — bekal terbalut
//     kain muncul; keduanya gembira, kilau penutup

// ATURAN KERAS: arah hadap SELALU searah gerak — setiap perubahan arah
// PUTAR DI TEMPAT dulu, baru bergerak; target interaksi dijangkau kepala,
// bukan badan yang menembus. Tokoh yang berbicara menghadap 3/4 ke kamera
// (pelajaran Bangau): Anjing ry=-π/4 (kanan-depan), Panda ry=5π/4
// (kiri-depan); putaran 180° lewat sisi kamera (ry lewat 3π/2).

const DOG_KEYS = [
  { f: 0, x: -1.8, ry: -Math.PI / 4 },
  { f: L0.f1, x: -1.8, ry: -Math.PI / 4 },
  { f: L2.f1, x: -1.8, ry: -Math.PI / 4 },
  { f: L3.f0 + 130, x: -1.8, ry: -Math.PI / 4 + Math.PI * 2 }, // putar di tempat (giliran 3)
  { f: L4.f1, x: -1.8, ry: -Math.PI / 4 + Math.PI * 2 },
  { f: L5.f0, x: -1.8, ry: -Math.PI / 4 + Math.PI * 2 },
  { f: L5.f1 - 100, x: 2.8, ry: -Math.PI / 4 + Math.PI * 2 },  // jalan kanan ikut jejak
  { f: END, x: 2.8, ry: -Math.PI / 4 + Math.PI * 2 },
];
const DOG_Z = 0.6;

const PANDA_KEYS = [
  { f: 0, x: 2.2, ry: Math.PI * 1.25 },    // duduk dekat bambu, 3/4 kiri-depan
  { f: L1.f1, x: 2.2, ry: Math.PI * 1.25 },
  { f: L3.f1, x: 0.3, ry: Math.PI * 1.25 }, // berjalan kiri mendekat (giliran 3)
  { f: L4.f1, x: 0.3, ry: Math.PI * 1.25 },
  { f: L5.f0 + 55, x: 0.3, ry: Math.PI * 1.75 }, // putar di tempat → 3/4 kanan-depan
  { f: L5.f1 - 40, x: 1.5, ry: Math.PI * 1.75 }, // jalan kanan di belakang Anjing
  { f: END, x: 1.5, ry: Math.PI * 1.75 },
];
const PANDA_Z = -0.2;

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: AnjingRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const dogM = mouthVal(MOUTH, "dog", f);
  const pandaM = mouthVal(MOUTH, "panda", f);

  // ---- fase-fase turunan ----------------------------------------------
  const standUp = sstep(L1.f1, L1.f1 + 60, f);           // Panda bangun
  const sitting = 1 - standUp;
  const spin = sstep(L3.f0 + 10, L3.f0 + 130, f);        // putaran Anjing
  const crouchSpin = sstep(L3.f0 - 16, L3.f0, f) * (1 - sstep(L3.f0 + 130, L3.f0 + 160, f));
  const digStart = L5.f1 - 100, digEnd = L5.f1 - 40;
  const digging = sstep(digStart, digStart + 20, f) * (1 - sstep(digEnd, digEnd + 30, f));
  const reveal = sstep(L5.f1 - 70, L5.f1 - 40, f);        // bekal muncul
  const happy = sstep(L5.f1 - 40, L5.f1 - 10, f);         // gembira penutup

  // ---- panda ------------------------------------------------------------
  const pan = keyLerp(PANDA_KEYS, f);
  refs.panda.position.set(pan.x, 0, PANDA_Z);
  refs.panda.rotation.y = pan.ry;
  // jalan: bangun → jalan kiri (giliran 3), jalan kanan (giliran 5)
  const panWalkAmp = 0.3 * (
    sstep(L1.f1 + 40, L1.f1 + 80, f) * (1 - sstep(L3.f1 - 40, L3.f1, f))
    + sstep(L5.f0 + 55, L5.f0 + 95, f) * (1 - sstep(L5.f1 - 80, L5.f1 - 40, f))
  );
  const panPh = f * 0.28;
  refs.pandaLegFL.rotation.z = Math.sin(panPh) * panWalkAmp;
  refs.pandaLegBR.rotation.z = Math.sin(panPh) * panWalkAmp;
  refs.pandaLegFR.rotation.z = Math.sin(panPh + Math.PI) * panWalkAmp;
  refs.pandaLegBL.rotation.z = Math.sin(panPh + Math.PI) * panWalkAmp;
  // duduk: badan rendah, kaki depan terlipat ke depan, kaki belakang menekuk
  const sitFL = 0.9 * sitting, sitBL = -0.45 * sitting;
  refs.pandaLegFL.rotation.z += sitFL;
  refs.pandaLegFR.rotation.z += sitFL;
  refs.pandaLegBL.rotation.z += sitBL;
  refs.pandaLegBR.rotation.z += sitBL;
  const breatheP = Math.sin(f * 0.06) * 0.02;
  refs.pandaBodyG.position.y = lerp(0.45, 0.85, standUp)
    + (panWalkAmp > 0.02 ? Math.abs(Math.sin(panPh)) * 0.05 : breatheP);
  // menunjuk tanah: kaki depan kanan terulur ke depan-bawah (giliran 3–4)
  const point = sstep(L3.f0 + 60, L3.f0 + 120, f) * (1 - sstep(L4.f1, L5.f0 + 55, f));
  refs.pandaLegFR.rotation.z = Math.max(refs.pandaLegFR.rotation.z, 0) + 1.05 * point;
  // isyarat tenang (giliran 1): kaki depan kiri terangkat lembut
  const calm = sstep(L1.f0 + 10, L1.f0 + 50, f) * (1 - sstep(L1.f1 - 30, L1.f1, f));
  refs.pandaLegFL.rotation.z += 0.55 * calm;
  // kepala: angguk tenang (1), tunduk menunjuk (3–4), angguk gembira (5 akhir)
  const nodCalm = Math.sin((f - L1.f0) * 0.16) * 0.1 * sstep(L1.f0 + 20, L1.f0 + 60, f)
    * (1 - sstep(L1.f1 - 40, L1.f1, f));
  const nodHappy = line === 5 && f >= digEnd
    ? Math.sin((f - digEnd) * 0.22) * 0.12 * sstep(digEnd, digEnd + 30, f) : 0;
  refs.pandaHeadG.rotation.z = nodCalm - 0.28 * point + nodHappy
    + Math.sin(f * 0.45) * 0.04 * pandaM + Math.sin(f * 0.05) * 0.02;
  refs.pandaHeadG.rotation.y = -0.15 * point;
  refs.pandaJawG.rotation.z = -pandaM * 0.45;
  // telinga bundar: kedut halus, tegak saat menenangkan
  refs.pandaEarL.rotation.x = -0.1 - 0.15 * calm + Math.sin(f * 0.07) * 0.04;
  refs.pandaEarR.rotation.x = 0.1 + 0.15 * calm - Math.sin(f * 0.07) * 0.04;
  applyBlink(refs.pandaEyeL, refs.pandaEyeR, f, 77, 120);

  // ---- dog --------------------------------------------------------------
  const dg = keyLerp(DOG_KEYS, f);
  // lompat kecil semangat (giliran 0): tiga hop
  const hop0 = jumpY(f, L0.f0 + 28, L0.f0 + 63, 0.28)
    + jumpY(f, L0.f0 + 98, L0.f0 + 133, 0.28)
    + jumpY(f, L0.f0 + 168, L0.f0 + 203, 0.28);
  const dogWalkAmp = 0.32 * sstep(L5.f0 + 10, L5.f0 + 50, f)
    * (1 - sstep(digStart - 30, digStart, f));
  const dogPh = f * 0.3;
  refs.dog.position.set(dg.x, hop0, DOG_Z);
  refs.dog.rotation.y = dg.ry;
  // duduk (giliran 1): badan rendah, kaki belakang terlipat
  const dogSit = sstep(L1.f0 + 10, L1.f0 + 50, f) * (1 - sstep(L1.f1, L2.f0 + 20, f));
  const breatheD = Math.sin(f * 0.09) * 0.02;
  refs.dogBodyG.scale.set(
    1 + 0.08 * crouchSpin,
    1 - 0.14 * crouchSpin - 0.06 * dogSit,
    1,
  );
  refs.dogBodyG.position.y = 0.48 - 0.14 * dogSit
    + (dogWalkAmp > 0.02 ? Math.abs(Math.sin(dogPh)) * 0.05 : breatheD);
  // kaki: jalan / menggali / duduk
  refs.dogLegFL.rotation.z = Math.sin(dogPh) * dogWalkAmp
    + 0.55 * Math.sin(f * 0.55) * digging;
  refs.dogLegFR.rotation.z = Math.sin(dogPh + Math.PI) * dogWalkAmp
    - 0.55 * Math.sin(f * 0.55) * digging;
  refs.dogLegBL.rotation.z = Math.sin(dogPh + Math.PI) * dogWalkAmp + 0.85 * dogSit;
  refs.dogLegBR.rotation.z = Math.sin(dogPh) * dogWalkAmp + 0.85 * dogSit;
  // kepala: hidung ke atas semangat (0) → dengar (1) → mengendus kiri-kanan
  // menunduk (2) → lesu menunduk saat berputar (3) → menengadah ke Panda
  // lalu ke langit (4) → mengendus yakin lalu menggali (5)
  const sniffAir = sstep(L0.f0, L0.f0 + 30, f) * (1 - sstep(L0.f1, L1.f0 + 10, f));
  const sniffSide = 0.45 * Math.sin((f - L2.f0) * 0.045)
    * sstep(L2.f0, L2.f0 + 30, f) * (1 - sstep(L2.f1 - 20, L2.f1, f));
  const sniffDown = sstep(L2.f0, L2.f0 + 30, f) * (1 - sstep(L2.f1 - 20, L2.f1, f));
  const droop = sstep(L3.f0, L3.f0 + 40, f) * (1 - sstep(L3.f1, L4.f0 + 20, f));
  const lookUp = sstep(L4.f0 + 10, L4.f0 + 50, f) * (1 - sstep(L4.f1 - 30, L4.f1, f));
  const lookSky = sstep(L4.f0 + 70, L4.f0 + 110, f) * (1 - sstep(L4.f1 - 10, L4.f1, f));
  const sniffSure = sstep(L5.f0 + 10, L5.f0 + 50, f) * (1 - sstep(digStart - 10, digStart, f));
  refs.dogHeadG.rotation.z = 0.28 * sniffAir - 0.3 * sniffDown - 0.35 * droop
    + 0.3 * lookUp + 0.18 * lookSky - 0.28 * sniffSure - 0.32 * digging
    + 0.12 * happy
    + Math.sin(f * 0.5) * 0.05 * dogM;
  refs.dogHeadG.rotation.y = sniffSide - 0.25 * droop + 0.2 * lookSky;
  refs.dogHeadG.rotation.x = 0.22 * lookSky;
  refs.dogJawG.rotation.z = -dogM * 0.45;
  // telinga terkulai: terangkat saat mendengarkan (1), lemas saat lesu (3),
  // follow-through mengayun mengikuti gerak badan
  const perk = sstep(L1.f0 + 10, L1.f0 + 50, f) * (1 - sstep(L1.f1, L2.f0 + 20, f));
  const earSwing = Math.sin(f * 0.1) * 0.06 + Math.sin(f * 0.043 + 2) * 0.05;
  refs.dogEarL.rotation.x = -0.15 - 0.25 * perk + 0.2 * droop + earSwing
    + Math.sin(f * 0.3) * 0.05 * dogWalkAmp;
  refs.dogEarR.rotation.x = 0.15 + 0.25 * perk - 0.2 * droop - earSwing
    - Math.sin(f * 0.3) * 0.05 * dogWalkAmp;
  // ekor: kibas cepat semangat (0), melambat (2), lemas (3), kibas gembira (5)
  const wagAmp = line === 3 ? 0.06 : line === 2 ? 0.15 : 0.5;
  const wagSpd = line === 0 ? 0.3 : line === 5 && f >= digEnd ? 0.28 : 0.15;
  refs.dogTailG.rotation.y = Math.sin(f * wagSpd) * wagAmp;
  refs.dogTailG.rotation.z = -0.45 * droop;
  applyBlink(refs.dogEyeL, refs.dogEyeR, f, 33, 120);

  // ---- bekal + gundukan ---------------------------------------------------
  refs.moundG.scale.setScalar(Math.max(0.001, 1 - sstep(digStart, digStart + 30, f)));
  refs.moundG.visible = refs.moundG.scale.x > 0.01;
  refs.bundleG.scale.setScalar(Math.max(0.001, reveal));
  refs.bundleG.rotation.y = reveal * 0.4;

  // ---- lingkungan ---------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  refs.bamboo.forEach((bg) => {
    bg.rotation.z = Math.sin(f * 0.04 + (bg.userData.phase as number)) * 0.06;
  });
  refs.crops.forEach((cg) => {
    cg.rotation.z = Math.sin(f * 0.045 + (cg.userData.phase as number)) * 0.08;
  });
  pulseSparkles(refs.sparkles, f, f >= L5.f1 - 60);

  // ---- kamera: bingkai menurut bentang sebenarnya --------------------------
  // Jangkauan kepala/ekor memperhitungkan skala akar (Anjing ×1.35,
  // Panda ×1.3) dan hadap 3/4 (cos ry ≈ ±0.707).
  const dogHeadX = dg.x + Math.cos(dg.ry) * 1.3;
  const dogTailX = dg.x - Math.cos(dg.ry) * 1.0;
  const panHeadX = pan.x + Math.cos(pan.ry) * 1.15;
  const panTailX = pan.x - Math.cos(pan.ry) * 0.9;
  const left = Math.min(dogHeadX, dogTailX, panHeadX, panTailX, -2.8);
  const right = Math.max(dogHeadX, dogTailX, panHeadX, panTailX, 4.0);
  const { mid: midX, z } = frameExtent(left, right, 1.0);
  const pandaTop = lerp(1.51, 2.03, standUp);
  const topY = Math.max(pandaTop, 1.38);
  const midY = topY / 2;
  camera.position.set(midX * 0.95, midY + 0.35 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.3, 0);
}
