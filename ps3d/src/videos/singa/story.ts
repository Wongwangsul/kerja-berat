import * as THREE from "three";
import { SingaRefs } from "./world";
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
//  0  establishing: tepi sungai siang; Singa kiri menjaga giliran,
//     Monyet di dahan pohon kanan; hewan-hewan kecil menunggu di kejauhan
//     kanan. Singa mengaum (fakta pembuka: auman terdengar berkilometer).
//  1  Monyet menunjuk ke sungai — batu besar bergeser pelan, air beriak;
//     Singa menoleh kaget.
//  2  Air sungai jadi keruh, jalan batu licin; Singa gelisah mondar-mandir,
//     ekor berayun; hewan-hewan menunggu.
//  3  Singa diam menunduk lesu di tepi; Monyet melompat turun, mengangkat
//     tangan memberi isyarat tenang.
//  4  Singa menengadah ke arah hewan-hewan yang menunggu; Monyet berjalan
//     ke pohon, mulai memanjat.
//  5  Monyet menaruh daun penanda di batu aman; Singa mengarahkan hewan
//     satu-satu melewati batu bertanda daun — semua minum dengan tenang;
//     kilau penutup, keduanya berdampingan.

// ATURAN KERAS: arah hadap SELALU searah gerak — setiap perubahan arah
// PUTAR DI TEMPAT dulu, baru bergerak; target interaksi dijangkau kepala,
// bukan badan yang menembus. Tokoh yang berbicara menghadap 3/4 ke kamera
// (pelajaran Bangau): Singa ry=-π/4 (kanan-depan), Monyet ry=5π/4
// (kiri-depan); putaran 180° lewat sisi kamera (ry lewat 3π/2).

// Singa: rumah di tepi kiri (x -2.2, z 0.8); mondar-mandir di L2;
// melangkah ke sungai di L5; penutup berdampingan di kiri.
const LION_KEYS = [
  { f: 0, x: -2.0, z: 0.8, ry: -Math.PI / 4 },
  { f: L1.f1, x: -2.0, z: 0.8, ry: -Math.PI / 4 },
  { f: L2.f0 + 60, x: -1.4, z: 0.8, ry: -Math.PI / 4 },   // gelisah ke kanan
  { f: L2.f0 + 130, x: -2.0, z: 0.8, ry: -Math.PI / 4 },  // kembali ke kiri
  { f: L2.f1, x: -1.6, z: 0.8, ry: -Math.PI / 4 },        // mondar-mandir lagi
  { f: L3.f1, x: -1.8, z: 0.8, ry: -Math.PI / 4 },        // lesu, diam
  { f: L4.f1, x: -1.8, z: 0.8, ry: -Math.PI / 4 },
  { f: L5.f0 + 90, x: -1.4, z: 0.35, ry: -Math.PI / 4 },  // melangkah ke sungai
  { f: L5.f1 - 120, x: -1.4, z: 0.35, ry: -Math.PI / 4 },
  { f: END, x: -1.5, z: 0.7, ry: -Math.PI / 4 },          // penutup berdampingan
];

// Monyet: dahan (1.9, 2.85, -1.2) — di ujung dahan, berlatar langit
// (bukan kanopi) → lompat turun di DEPAN-kanan Singa
// (-0.1, 0, 1.3) supaya tidak tertutup badan Singa saat isyarat tenang
const MON_KEYS = [
  { f: 0, x: 1.9, y: 2.85, z: -1.2, ry: Math.PI * 1.25 },
  { f: L2.f1, x: 1.9, y: 2.85, z: -1.2, ry: Math.PI * 1.25 },
  { f: L3.f0 + 70, x: -0.1, y: 0, z: 1.3, ry: Math.PI * 1.25 },
  { f: L3.f1 - 30, x: -0.1, y: 0, z: 1.3, ry: Math.PI * 1.25 },
  { f: L3.f1, x: -0.1, y: 0, z: 1.3, ry: Math.PI * 1.75 }, // putar di tempat → 3/4 kanan-depan
  { f: L4.f0 + 60, x: 2.6, y: 0, z: -0.6, ry: Math.PI * 1.75 }, // jalan kanan ke pohon
  { f: L4.f1, x: 3.6, y: 1.0, z: -1.1, ry: Math.PI * 1.75 },    // memanjat
  { f: L5.f0 + 50, x: 0.7, y: 0, z: -2.4, ry: Math.PI * 1.25 }, // turun ke batu aman
  { f: L5.f0 + 110, x: 0.7, y: 0, z: -2.4, ry: Math.PI * 1.25 },
  { f: L5.f0 + 170, x: 1.7, y: 0, z: -0.5, ry: Math.PI * 1.75 },
  { f: L5.f1 - 10, x: -0.2, y: 0, z: 0.85, ry: Math.PI * 1.25 }, // kembali ke Singa
  { f: END, x: -0.2, y: 0, z: 0.85, ry: Math.PI * 1.25 },
];

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: SingaRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const lionM = mouthVal(MOUTH, "lion", f);
  const monM = mouthVal(MOUTH, "monkey", f);

  // ---- fase-fase turunan ----------------------------------------------
  const roar = sstep(L0.f0 + 5, L0.f0 + 25, f) * (1 - sstep(L0.f0 + 70, L0.f0 + 110, f));
  const stoneShift = sstep(L1.f0 + 20, L1.f0 + 90, f);          // batu bergeser
  const murky = sstep(L2.f0, L2.f0 + 60, f) * (1 - sstep(L5.f0, L5.f0 + 120, f)); // air keruh
  const droop = sstep(L3.f0, L3.f0 + 40, f) * (1 - sstep(L3.f1, L4.f0 + 20, f));
  const leafIn = sstep(L5.f0 + 50, L5.f0 + 80, f);              // daun penanda muncul
  const happy = sstep(L5.f1 - 90, L5.f1 - 30, f);               // gembira penutup
  const walkersGo = sstep(L5.f0 + 120, L5.f0 + 180, f);         // hewan menyeberang
  const drinking = sstep(L5.f1 - 80, L5.f1 - 40, f);           // hewan minum

  // ---- singa ------------------------------------------------------------
  const li = keyLerp(LION_KEYS, f);
  // mondar-mandir L2: ayunan kaki + bobbing; jalan pelan ke sungai L5
  const lionWalkAmp = 0.3 * (
    sstep(L2.f0 + 10, L2.f0 + 50, f) * (1 - sstep(L2.f1 - 20, L2.f1, f))
    + sstep(L5.f0 + 30, L5.f0 + 70, f) * (1 - sstep(L5.f0 + 130, L5.f0 + 170, f))
  );
  const lionPh = f * 0.3;
  refs.lion.position.set(li.x, 0, li.z);
  refs.lion.rotation.y = li.ry;
  const breatheL = Math.sin(f * 0.09) * 0.02;
  // auman: badan mengembang sedikit, kepala mendongak, rahang terbuka lebar
  refs.lionBodyG.scale.set(1 + 0.05 * roar, 1 + 0.03 * roar - 0.05 * droop, 1);
  refs.lionBodyG.position.y = 1.0 - 0.12 * droop
    + (lionWalkAmp > 0.02 ? Math.abs(Math.sin(lionPh)) * 0.05 : breatheL);
  refs.lionLegFL.rotation.z = Math.sin(lionPh) * lionWalkAmp;
  refs.lionLegBR.rotation.z = Math.sin(lionPh) * lionWalkAmp;
  refs.lionLegFR.rotation.z = Math.sin(lionPh + Math.PI) * lionWalkAmp;
  refs.lionLegBL.rotation.z = Math.sin(lionPh + Math.PI) * lionWalkAmp;
  // mengarahkan giliran (L5): kaki depan kanan terangkat memberi isyarat
  const direct = sstep(L5.f0 + 90, L5.f0 + 130, f) * (1 - sstep(L5.f1 - 140, L5.f1 - 100, f));
  refs.lionLegFR.rotation.z += 0.7 * direct;
  // kepala: mendongak mengaum (0) → menoleh kaget ke batu (1) → gelisah
  // kiri-kanan (2) → menunduk lesu (3) → menengadah ke hewan menunggu (4)
  // → menunduk mengawasi giliran (5) → tegak gembira (penutup)
  const startle = sstep(L1.f0 + 30, L1.f0 + 70, f) * (1 - sstep(L1.f1 - 20, L1.f1, f));
  const lookAround = 0.4 * Math.sin((f - L2.f0) * 0.05)
    * sstep(L2.f0, L2.f0 + 30, f) * (1 - sstep(L2.f1 - 20, L2.f1, f));
  const lookUp = sstep(L4.f0 + 10, L4.f0 + 50, f) * (1 - sstep(L4.f1 - 30, L4.f1, f));
  const watchDown = sstep(L5.f0 + 60, L5.f0 + 100, f) * (1 - sstep(L5.f1 - 120, L5.f1 - 80, f));
  refs.lionHeadG.rotation.z = 0.3 * roar - 0.32 * droop + 0.28 * lookUp
    - 0.24 * watchDown + 0.12 * happy
    + Math.sin(f * 0.5) * 0.05 * lionM;
  refs.lionHeadG.rotation.y = -0.35 * startle + lookAround + 0.25 * lookUp;
  refs.lionHeadG.rotation.x = 0.18 * lookUp;
  refs.lionJawG.rotation.z = -lionM * 0.45 - 0.35 * roar;
  // ekor: kibas gelisah cepat (2), lemas (3), kibas gembira (5 akhir)
  const wagAmp = line === 3 ? 0.08 : line === 2 ? 0.45 : 0.4;
  const wagSpd = line === 2 ? 0.3 : line === 5 && f >= L5.f1 - 90 ? 0.28 : 0.15;
  refs.lionTailG.rotation.y = Math.sin(f * wagSpd) * wagAmp;
  refs.lionTailG.rotation.z = -0.4 * droop;
  applyBlink(refs.lionEyeL, refs.lionEyeR, f, 33, 120);

  // ---- monyet -------------------------------------------------------------
  const mo = keyLerp(MON_KEYS, f);
  // lompat turun dari dahan (L3 awal) + lompat ke batu aman (L5 awal):
  // parabola menutup celah antara kunci posisi
  const jumpDown = jumpY(f, L3.f0 + 5, L3.f0 + 70, 1.1);
  const jumpStone = jumpY(f, L5.f0 - 10, L5.f0 + 50, 0.9);
  const jumpBack = jumpY(f, L5.f0 + 110, L5.f0 + 170, 0.7);
  // jalan: ke pohon (L3 akhir–L4), kembali ke Singa (L5 akhir)
  const monWalkAmp = 0.32 * (
    sstep(L3.f1 + 5, L4.f0 + 20, f) * (1 - sstep(L4.f0 + 40, L4.f0 + 60, f))
    + sstep(L5.f0 + 170, L5.f0 + 200, f) * (1 - sstep(L5.f1 - 40, L5.f1 - 10, f))
  );
  const monPh = f * 0.34;
  refs.monkey.position.set(mo.x, mo.y + jumpDown + jumpStone + jumpBack, mo.z);
  refs.monkey.rotation.y = mo.ry;
  const breatheM = Math.sin(f * 0.11) * 0.02;
  const onBranch = sstep(L2.f1, L3.f0, f) * (1 - sstep(L3.f0 + 5, L3.f0 + 30, f));
  // duduk di dahan: badan rendah, kaki menekuk; memanjat: badan tegak
  const climb = sstep(L4.f0 + 60, L4.f1, f) * (1 - sstep(L5.f0 - 20, L5.f0 + 10, f));
  refs.monBodyG.position.y = 0.62 - 0.14 * onBranch - 0.06 * climb
    + (monWalkAmp > 0.02 ? Math.abs(Math.sin(monPh)) * 0.05 : breatheM);
  refs.monBodyG.scale.set(1, 1 - 0.08 * onBranch, 1);
  // kaki: jalan / duduk di dahan / memanjat (menekuk bergantian)
  refs.monLegBL.rotation.z = Math.sin(monPh + Math.PI) * monWalkAmp
    + 0.9 * onBranch + 0.5 * Math.sin(f * 0.3) * climb;
  refs.monLegBR.rotation.z = Math.sin(monPh) * monWalkAmp
    + 0.9 * onBranch + 0.5 * Math.sin(f * 0.3 + Math.PI) * climb;
  // lengan: menunjuk sungai (1) → isyarat tenang (3) → menaruh daun (5)
  const pointRiver = sstep(L1.f0 + 10, L1.f0 + 50, f) * (1 - sstep(L1.f1 - 30, L1.f1, f));
  const calm = sstep(L3.f0 + 80, L3.f0 + 120, f) * (1 - sstep(L3.f1 - 30, L3.f1, f));
  const placeLeaf = sstep(L5.f0 + 50, L5.f0 + 80, f) * (1 - sstep(L5.f0 + 120, L5.f0 + 150, f));
  refs.monArmR.rotation.z = Math.sin(monPh + Math.PI) * monWalkAmp * 0.6
    + 1.15 * pointRiver + 0.55 * calm + 0.9 * placeLeaf;
  refs.monArmL.rotation.z = Math.sin(monPh) * monWalkAmp * 0.6
    + 0.55 * calm + 0.4 * Math.sin(f * 0.3 + Math.PI) * climb;
  // kepala: menunduk menunjuk (1) → angguk tenang (3) → menengadah memanjat (4)
  // → menunduk menaruh daun (5) → tegak gembira (penutup)
  const nodCalm = Math.sin((f - L3.f0) * 0.16) * 0.1 * calm;
  const nodHappy = line === 5 && f >= L5.f1 - 90
    ? Math.sin((f - (L5.f1 - 90)) * 0.22) * 0.12 * sstep(L5.f1 - 90, L5.f1 - 60, f) : 0;
  refs.monHeadG.rotation.z = -0.25 * pointRiver - 0.3 * placeLeaf + 0.22 * climb
    + 0.12 * happy + nodCalm + nodHappy
    + Math.sin(f * 0.45) * 0.04 * monM + Math.sin(f * 0.05) * 0.02;
  refs.monHeadG.rotation.y = -0.2 * pointRiver;
  refs.monJawG.rotation.z = -monM * 0.45;
  // telinga: kedut halus + follow-through saat melompat
  const earSwing = Math.sin(f * 0.12) * 0.05
    + (jumpDown > 0.05 || jumpStone > 0.05 ? 0.25 : 0);
  refs.monEarL.rotation.x = -0.1 + earSwing;
  refs.monEarR.rotation.x = 0.1 - earSwing;
  // ekor: melengkung mengikuti gerak — berayun saat jalan, tegak saat menunjuk
  refs.monTailG.rotation.y = Math.sin(f * 0.18) * (0.15 + 0.35 * monWalkAmp);
  refs.monTailG.rotation.z = -0.3 * pointRiver - 0.2 * climb;
  applyBlink(refs.monEyeL, refs.monEyeR, f, 77, 120);

  // ---- batu bergeser + air keruh ------------------------------------------
  refs.shiftStone.position.x = (refs.shiftStone.userData.baseX as number)
    - 0.45 * stoneShift;
  refs.shiftStone.rotation.z = -0.12 * stoneShift;
  refs.shiftStone.rotation.y = 0.25 * stoneShift;
  const clearCol = new THREE.Color("#4aa8d8");
  const murkyCol = new THREE.Color("#6f7f4e");
  refs.riverMat.color.lerpColors(clearCol, murkyCol, murky);
  refs.murkG.scale.setScalar(Math.max(0.001, murky));
  // riak: berdenyut pelan, lebih gaduh saat batu bergeser / air keruh
  const agitation = 1 + 1.2 * stoneShift + 0.8 * murky;
  refs.ripples.forEach((rg) => {
    const ph = rg.userData.phase as number;
    const base = rg.userData.base as number;
    const s = base * (1 + 0.22 * Math.sin(f * 0.07 * agitation + ph));
    rg.scale.setScalar(s);
    rg.rotation.y = f * 0.002 * agitation + ph;
  });

  // ---- daun penanda ---------------------------------------------------------
  refs.leafG.scale.setScalar(Math.max(0.001, leafIn));
  refs.leafG.rotation.y = leafIn * 0.5;
  refs.leafG.position.y = 0.32 + 0.05 * Math.sin(f * 0.06) * leafIn;

  // ---- hewan menunggu: menyeberang satu-satu (L5) lalu minum ---------------
  // rusa (0) dan kelinci (1) berjalan kiri ke tepi sungai; burung (2) tinggal
  const w0 = refs.waiters[0], w1 = refs.waiters[1], w2 = refs.waiters[2];
  const deerWalk = sstep(L5.f0 + 90, L5.f0 + 190, f);
  const rabWalk = sstep(L5.f0 + 120, L5.f0 + 200, f);
  w0.position.x = lerp(4.5, 1.9, deerWalk);
  w0.position.z = lerp(-0.8, -1.5, deerWalk);
  w0.position.y = deerWalk > 0 && deerWalk < 1 ? Math.abs(Math.sin(f * 0.35)) * 0.08 : 0;
  w1.position.x = lerp(4.7, 0.9, rabWalk);
  w1.position.z = lerp(-1.2, -1.5, rabWalk);
  w1.position.y = rabWalk > 0 && rabWalk < 1 ? Math.abs(Math.sin(f * 0.4)) * 0.08 : 0;
  // kepala menunduk minum
  refs.waiterHeadGs[0].rotation.z = -0.5 * drinking * deerWalk;
  refs.waiterHeadGs[1].rotation.z = -0.5 * drinking * rabWalk;
  // burung melompat gembira di tempat saat semua minum
  w2.position.y = drinking > 0 ? Math.abs(Math.sin(f * 0.3)) * 0.15 * drinking : 0;
  // helaan napas menunggu: kepala menoleh pelan sebelum giliran
  const waitLook = (1 - walkersGo) * Math.sin(f * 0.03);
  refs.waiterHeadGs[2].rotation.y = 0.3 * waitLook;

  // ---- lingkungan -----------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  refs.canopyG.rotation.z = Math.sin(f * 0.03) * 0.02;
  refs.canopyG.rotation.x = Math.cos(f * 0.023) * 0.015;
  refs.treeG.rotation.z = Math.sin(f * 0.03 + 1) * 0.008;
  refs.branchG.rotation.z = Math.sin(f * 0.04) * 0.02;
  pulseSparkles(refs.sparkles, f, f >= L5.f1 - 60);

  // ---- kamera: bingkai dinamis per fase --------------------------------------
  // L0 establishing lebar (Singa + Monyet di dahan + hewan menunggu kanan);
  // sesudahnya lebih rapat pada Singa + Monyet + batu.
  const frameKeys = [
    { f: 0, left: -3.9, right: 5.4 },
    { f: L0.f1, left: -3.9, right: 5.4 },
    { f: L1.f0 + 60, left: -3.4, right: 4.4 },
    { f: L5.f0, left: -3.6, right: 4.4 },
    { f: END, left: -3.4, right: 4.2 },
  ];
  const fr = keyLerp(frameKeys, f);
  const { mid: midX, z } = frameExtent(fr.left, fr.right, 1.0);
  const midY = 1.15;
  camera.position.set(midX * 0.95, midY + 0.4 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.35, -0.4);
}
