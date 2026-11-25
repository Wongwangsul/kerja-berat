import * as THREE from "three";
import {
  SungaiRefs, Bird, Human, pointAt, uAtX, updateRibbon, ribbonDataOf, baseWidth,
} from "./world";
import { sstep, lerp, keyLerp, clamp01, blinkScale } from "../../shared/kit";

// =====================================================================
// ANAK SUNGAI — peta gerak (7.200 frame @30fps = 240 dtk)
//  Babak 1 hutan & mata air   f 0–1350      (0–45 dtk)
//  Babak 2 anak pohon         f 1350–2700   (45–90 dtk)
//  Babak 3 ladang kering      f 2700–4200   (90–140 dtk)
//  Babak 4 hujan & desa       f 4200–5850   (140–195 dtk)
//  Babak 5 laut & matahari    f 5850–6840   (195–228 dtk)
//  Koda anak pohon tumbuh     f 6840–6960   (228–232 dtk)
//  Penutup lebar + teks       f 6960–7200   (232–240 dtk)
// =====================================================================

const HEAD_KEYS = [
  { f: 0, u: 0.0 }, { f: 150, u: 0.006 }, { f: 600, u: 0.055 }, { f: 1000, u: 0.10 },
  { f: 1350, u: 0.135 }, { f: 1750, u: 0.20 }, { f: 2350, u: 0.205 }, { f: 2700, u: 0.335 },
  { f: 3050, u: 0.42 }, { f: 3400, u: 0.50 }, { f: 3750, u: 0.565 }, { f: 4200, u: 0.585 },
  { f: 4600, u: 0.615 }, { f: 5000, u: 0.655 }, { f: 5400, u: 0.71 }, { f: 5850, u: 0.80 },
  { f: 6150, u: 0.87 }, { f: 6550, u: 0.995 }, { f: 7200, u: 1.0 },
];
const WIDTH_KEYS = [
  { f: 0, w: 1.0 }, { f: 2350, w: 1.0 }, { f: 2600, w: 0.74 }, { f: 3050, w: 0.62 },
  { f: 3400, w: 0.45 }, { f: 3750, w: 0.30 }, { f: 4200, w: 0.28 }, { f: 4600, w: 0.55 },
  { f: 4950, w: 0.85 }, { f: 5450, w: 1.12 }, { f: 5850, w: 1.18 }, { f: 6550, w: 1.25 },
];
const BLOB_KEYS = [
  { f: 0, s: 1.0 }, { f: 2350, s: 0.94 }, { f: 3400, s: 0.62 }, { f: 3750, s: 0.5 },
  { f: 4200, s: 0.46 }, { f: 4600, s: 0.8 }, { f: 4900, s: 1.02 }, { f: 5850, s: 1.1 },
  { f: 6550, s: 1.22 },
];
const CAM_KEYS = [
  { f: 0, x: -47, y: 6, z: 13.5, tx: -39.5, ty: 0.8, tz: 0 },
  { f: 700, x: -40, y: 5, z: 12.5, tx: -34, ty: 0.5, tz: 0 },
  { f: 1350, x: -33, y: 4.8, z: 12, tx: -28.5, ty: 0.5, tz: 0.5 },
  { f: 1750, x: -28.5, y: 4.2, z: 10.5, tx: -23.8, ty: 0.9, tz: 2.2 },
  { f: 2350, x: -27.5, y: 4, z: 10, tx: -23.8, ty: 0.9, tz: 2.2 },
  { f: 2700, x: -19, y: 4.5, z: 11, tx: -14, ty: 0.5, tz: 0 },
  { f: 3400, x: -6, y: 5.5, z: 13, tx: 0, ty: 0.3, tz: 0 },
  { f: 3900, x: 2, y: 4.2, z: 11.5, tx: 6.5, ty: 0.3, tz: -0.5 },
  { f: 4200, x: 4, y: 4.5, z: 12, tx: 8, ty: 0.5, tz: 0 },
  { f: 4800, x: 9, y: 4.5, z: 12.5, tx: 14, ty: 0.5, tz: 0.5 },
  { f: 5250, x: 12.5, y: 4.2, z: 12, tx: 17.5, ty: 0.8, tz: -3 },
  { f: 5600, x: 19, y: 4.5, z: 12.5, tx: 24.5, ty: 1.2, tz: -2.5 },
  { f: 5850, x: 24, y: 5, z: 13, tx: 29, ty: 0.5, tz: 0 },
  { f: 6300, x: 33, y: 4.5, z: 13.5, tx: 39, ty: 0, tz: 0 },
  { f: 6600, x: 38, y: 5.5, z: 15, tx: 46, ty: -0.2, tz: 0 },
  { f: 6839, x: 38, y: 5.5, z: 15, tx: 46, ty: -0.2, tz: 0 },
  { f: 6840, x: -28.3, y: 2.8, z: 9.2, tx: -24.3, ty: 1.8, tz: 3.6 },
  { f: 6959, x: -28.0, y: 2.9, z: 9.4, tx: -24.3, ty: 1.8, tz: 3.6 },
  { f: 6960, x: 30, y: 10, z: 24, tx: 48, ty: 0.5, tz: -2 },
  { f: 7200, x: 29, y: 10.5, z: 25, tx: 48, ty: 0.5, tz: -2 },
];
const SUN_KEYS = [
  { f: 0, x: 60, y: 34 }, { f: 2700, x: 30, y: 44 }, { f: 4200, x: 20, y: 30 },
  { f: 4900, x: 55, y: 32 }, { f: 5850, x: 88, y: 1 }, { f: 6900, x: 88, y: 13 },
  { f: 7200, x: 88, y: 14 },
];

function flap(b: Bird, f: number, amp = 0.75, speed = 0.55, phase = 0) {
  const w = Math.sin(f * speed + phase) * amp;
  b.wingL.rotation.x = w;
  b.wingR.rotation.x = -w;
}
function flyBird(b: Bird, f: number, t0: number, t1: number,
  from: [number, number, number], to: [number, number, number], arc = 1.5, phase = 0) {
  const k = clamp01((f - t0) / (t1 - t0));
  b.root.visible = f >= t0 && f <= t1;
  if (!b.root.visible) return;
  const x = lerp(from[0], to[0], k), z = lerp(from[2], to[2], k);
  const y = lerp(from[1], to[1], k) + Math.sin(k * Math.PI) * arc + Math.sin(f * 0.3 + phase) * 0.12;
  b.root.position.set(x, y, z);
  b.root.rotation.y = Math.atan2(-(to[2] - from[2]), to[0] - from[0]);
  b.root.rotation.z = 0.08 * Math.sin(f * 0.2 + phase);
  flap(b, f, 0.8, 0.55, phase);
}
function walkLegs(h: Human, f: number, amp = 0.5, speed = 0.24) {
  h.legL.rotation.x = Math.sin(f * speed) * amp;
  h.legR.rotation.x = -Math.sin(f * speed) * amp;
}

export function poseFrame(frame: number, refs: SungaiRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;

  // ---------------------------------------------------------- protagonis
  const headU = keyLerp(HEAD_KEYS, f).u;
  const widthF = keyLerp(WIDTH_KEYS, f).w;
  const blobS = keyLerp(BLOB_KEYS, f).s;
  updateRibbon(ribbonDataOf(refs.ribbon), headU, widthF);
  updateRibbon(ribbonDataOf(refs.ribbonIn), headU, widthF);
  // pita cabang ke anak pohon: mengalir saat memberi minum, lalu menetes kecil
  const branchU = sstep(1800, 2250, f);
  updateRibbon(ribbonDataOf(refs.branchRibbon), branchU, 1 - 0.45 * sstep(2400, 2700, f));
  // pita sisi dari kolam desa sesudah pintu air dibuka
  const sideU = sstep(5250, 5550, f);
  updateRibbon(ribbonDataOf(refs.sideRibbon), sideU, 1);

  const vigor = clamp01(widthF); // 1 = segar, ~0.3 = sekarat
  const hp = pointAt(Math.min(1, headU + 0.004));
  const bobAmp = lerp(0.015, 0.055, vigor) + (f > 5850 ? 0.05 : 0);
  let blobY = hp.p.y + 0.32 + Math.sin(f * 0.11) * bobAmp;
  // lompatan gembira saat hujan menghidupkan kembali
  const hop = sstep(4780, 4860, f) * (1 - sstep(4920, 5000, f));
  blobY += Math.sin(hop * Math.PI) * 0.55;
  refs.blob.position.set(hp.p.x, blobY, hp.p.z);
  // di babak akhir Si Tetes berbalik menghadap kamera
  const faceCam = sstep(6600, 6900, f);
  refs.blob.rotation.y = lerp(hp.ry, -Math.PI / 2, faceCam);
  const sq = 1 + 0.05 * Math.sin(f * 0.22) * vigor;
  refs.blobBodyG.scale.set(blobS / Math.sqrt(sq), blobS * sq, blobS / Math.sqrt(sq));
  // mata: kedip + sayu saat sekarat
  const droop = sstep(3000, 3750, f) * (1 - sstep(4300, 4800, f));
  const eyeS = blinkScale(f, 40, 150) * (1 - 0.55 * droop);
  refs.blobEyeL.scale.y = eyeS;
  refs.blobEyeR.scale.y = eyeS;
  refs.blobBodyG.rotation.z = -0.16 * droop + 0.03 * Math.sin(f * 0.09) * vigor;

  // titik aliran putih bergerak mengikuti kecepatan hidup aliran
  const flowSpeed = 0.0016 * (0.25 + 0.75 * vigor);
  refs.flowDots.forEach((d, i) => {
    const u = ((i / refs.flowDots.length) + f * flowSpeed) % 1 * Math.max(0.001, headU - 0.004);
    const pt = pointAt(u);
    d.visible = headU > 0.012 && u < headU - 0.002;
    d.position.set(pt.p.x, pt.p.y + 0.16, pt.p.z);
    d.rotation.y = pt.ry;
    const s = (0.65 + 0.45 * (baseWidth(u) / 2)) * clamp01(widthF + 0.25);
    d.scale.set(1.9 * s, 0.5 * s, 0.9 * s);
  });

  // ---------------------------------------------------------- langit & cuaca
  const sunK = keyLerp(SUN_KEYS, f);
  refs.sunMesh.position.set(sunK.x, sunK.y, -45);
  refs.sunGlow.position.set(sunK.x, sunK.y, -45);
  refs.sunGlow.scale.setScalar(1 + 0.1 * Math.sin(f * 0.04));
  const sunCol = new THREE.Color("#ffdf6b");
  if (f > 2700 && f < 4900) sunCol.lerp(new THREE.Color("#fff3d0"), sstep(2700, 3000, f) * (1 - sstep(4600, 4900, f)));
  if (f >= 5850) sunCol.lerp(new THREE.Color("#ffb35c"), sstep(5850, 6400, f));
  (refs.sunMesh.material as THREE.MeshBasicMaterial).color.copy(sunCol);
  // awan melayang
  refs.clouds.forEach((c, i) => {
    c.position.x = (c.userData.baseX as number) + Math.sin(f * 0.004 + i * 1.7) * 0.7 + f * 0.0022 * (i + 1);
  });
  // awan hujan berkumpul & menggelap
  const rainGather = sstep(4050, 4350, f) * (1 - sstep(4900, 5400, f));
  [1, 2, 4].forEach((ci, k) => {
    const c = refs.clouds[ci];
    if (rainGather > 0) {
      c.position.x = lerp(c.position.x, -2 + k * 11, rainGather);
      c.position.y = lerp(17, 13.5, rainGather);
    }
  });
  const cloudCol = new THREE.Color("#ffffff").lerp(new THREE.Color("#7e93a3"), rainGather * 0.9);
  refs.cloudMats.forEach(m => m.color.copy(cloudCol));
  // hujan
  const rainK = sstep(4200, 4400, f) * (1 - sstep(4750, 4950, f));
  const rainPosAttr = refs.rainLines.geometry.getAttribute("position") as THREE.BufferAttribute;
  const rainArr = rainPosAttr.array as Float32Array;
  const seeds = refs.rainLines.userData.seed as number[];
  const RN = seeds.length;
  for (let i = 0; i < RN; i++) {
    const s1 = seeds[i], s2 = seeds[(i + 113) % RN], s3 = seeds[(i + 57) % RN];
    const x = -8 + s1 * 40, z = -13 + s2 * 26;
    const y = 15.5 - ((f * 0.55 + s3 * 15.5) % 15.5);
    const j = i * 6;
    rainArr[j] = x; rainArr[j + 1] = y; rainArr[j + 2] = z;
    rainArr[j + 3] = x + 0.55; rainArr[j + 4] = y + 1.15; rainArr[j + 5] = z;
  }
  rainPosAttr.needsUpdate = true;
  (refs.rainLines.material as THREE.LineBasicMaterial).opacity = 0.55 * rainK;
  refs.rainLines.visible = rainK > 0.01;
  refs.rainRings.forEach((ring, i) => {
    const u = 0.42 + (i % 5) * 0.075;
    const pt = pointAt(u).p;
    ring.position.set(pt.x + (i % 3 - 1) * 2.2, 0.09, pt.z + ((i * 7) % 5 - 2) * 1.8);
    const ph = (f * 0.03 + (ring.userData.phase as number)) % 1;
    ring.scale.setScalar(0.3 + ph * 1.6);
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ph) * rainK;
    ring.visible = rainK > 0.01;
  });
  // pepohonan bergoyang (angin menguat saat hujan)
  const windAmp = 0.02 + 0.05 * rainGather;
  refs.treesSway.forEach(tg => {
    tg.rotation.z = Math.sin(f * 0.02 + (tg.userData.phase as number)) * windAmp - 0.04 * rainGather;
  });
  refs.motes.children.forEach((c, i) => {
    c.scale.setScalar(0.8 + 0.4 * Math.sin(f * 0.05 + (c.userData.phase as number) + i));
  });

  // ---------------------------------------------------------- babak 1: hutan
  refs.poolRings.forEach((ring, i) => {
    const ph = (f * 0.008 + i * 0.5) % 1;
    ring.scale.setScalar(0.4 + ph * 1.9);
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ph);
  });
  refs.springFall.scale.y = 1 + 0.08 * Math.sin(f * 0.4);
  flyBird(refs.birds1[0], f, 260, 1250, [-50, 6.5, -8], [5, 10, -16], 1.6, 0);
  flyBird(refs.birds1[1], f, 420, 1300, [-50, 5.5, 4], [0, 8.5, -6], 1.2, 2.1);
  flyBird(refs.birds1[2], f, 600, 1400, [-48, 8, 8], [10, 11, -2], 1.8, 4.2);
  // rusa minum di tepi aliran
  const dip = (0.5 + 0.5 * Math.sin(f * 0.045)) * sstep(450, 600, f) * (1 - sstep(1500, 1700, f));
  refs.deer1.headG.rotation.z = -0.52 * dip;
  refs.deer1.headG.rotation.y = 0.15 * Math.sin(f * 0.013) * (1 - dip);
  refs.deer1.bodyG.rotation.z = 0.02 * Math.sin(f * 0.05);
  // tupai di batang tumbang & di tunggul
  const sq1 = refs.squirrel1;
  sq1.root.position.set(-30 + 1.6 * Math.sin(f * 0.011), 0.62 + Math.abs(Math.sin(f * 0.09)) * 0.13, -5.5 + 0.3 * Math.sin(f * 0.007));
  sq1.root.rotation.y = Math.cos(f * 0.011) > 0 ? 0.2 : Math.PI - 0.2;
  sq1.tailG.rotation.x = 0.25 * Math.sin(f * 0.13);
  const sq2 = refs.squirrel2;
  sq2.bodyG.rotation.z = -0.28 * Math.max(0, Math.sin(f * 0.017));
  sq2.tailG.rotation.x = 0.3 * Math.sin(f * 0.11 + 2);
  sq2.root.rotation.y = 0.7 + 0.3 * Math.sin(f * 0.009);
  // kupu-kupu
  const poseBfly = (b: typeof refs.bflies1[0], ax: number, ay: number, az: number, f: number, ph: number) => {
    b.root.position.set(
      ax + Math.sin(f * 0.021 + ph) * 1.6,
      ay + Math.sin(f * 0.037 + ph * 2) * 0.35,
      az + Math.cos(f * 0.017 + ph) * 1.3);
    b.root.rotation.y = Math.sin(f * 0.013 + ph) * 0.8;
    const fl = 0.5 + 0.5 * Math.sin(f * 0.62 + ph);
    b.wingL.rotation.x = -0.95 * fl;
    b.wingR.rotation.x = 0.95 * fl;
  };
  poseBfly(refs.bflies1[0], -36, 1.7, 3, f, 0);
  poseBfly(refs.bflies1[1], -20, 1.5, -3, f, 2.4);
  poseBfly(refs.bflies2[0], -25.5, 1.5, 5.5, f, 4.1);
  poseBfly(refs.bflies2[1], -16, 1.8, -5, f, 1.2);

  // ---------------------------------------------------------- babak 2: anak pohon
  const thirst = 1 - sstep(1850, 2350, f);
  refs.sapling.leavesG.rotation.z = 0.38 * thirst;
  refs.sapling.leavesG.rotation.x = 0.15 * thirst;
  const leafCol = new THREE.Color("#b9c25e").lerp(new THREE.Color("#43a047"), 1 - thirst);
  refs.sapling.leafMats.forEach(m => m.color.copy(leafCol));
  const sapScale = 1 + 0.18 * sstep(2350, 2700, f) + 0.75 * sstep(5850, 6840, f);
  refs.sapling.root.scale.setScalar(sapScale);
  refs.sapling.berries.visible = sapScale > 1.55;
  refs.sapling.leavesG.position.y = 1.35 + 0.1 * Math.sin(f * 0.03) * (1 - thirst);
  // kelinci minum di tepi, telinga bergerak
  const rDip = (0.5 + 0.5 * Math.sin(f * 0.06 + 1)) * sstep(1400, 1550, f) * (1 - sstep(2500, 2650, f));
  refs.rabbit1.headG.rotation.z = -0.5 * rDip;
  refs.rabbit1.earL.rotation.x = 0.12 * Math.sin(f * 0.21);
  refs.rabbit1.earR.rotation.x = 0.1 * Math.sin(f * 0.19 + 1);
  refs.rabbit1.bodyG.position.y = Math.abs(Math.sin(f * 0.05)) * 0.02;
  // burung bertengger: satu terbang pergi di akhir babak 2
  const pb0 = refs.perchBirds[0];
  flyBird(pb0, f, 2500, 2950, [-27.5, 3.6, -6.5], [15, 9, -12], 2.2, 1);
  if (f < 2500) {
    pb0.root.visible = true;
    pb0.root.position.set(-27.5, 3.6, -6.5);
    pb0.root.rotation.y = 0.6;
    pb0.headG.rotation.y = 0.4 * Math.sin(f * 0.021);
    pb0.wingL.rotation.x = 0.05 * Math.sin(f * 0.3);
    pb0.wingR.rotation.x = -0.05 * Math.sin(f * 0.3);
  }
  const pb1 = refs.perchBirds[1];
  pb1.root.visible = f < 6840;
  pb1.headG.rotation.y = -0.35 * Math.sin(f * 0.017 + 2);
  pb1.bodyG.rotation.x = 0.06 * Math.sin(f * 0.045);
  // burung dewasa di anak pohon saat koda
  const gb = refs.grownBird;
  gb.root.visible = f >= 6840 && f < 6960;
  if (gb.root.visible) {
    gb.root.position.set(refs.sapling.root.position.x + 0.7, 1.35 * sapScale + 1.05, refs.sapling.root.position.z + 0.2);
    gb.root.rotation.y = -0.7;
    gb.headG.rotation.y = 0.3 * Math.sin(f * 0.03);
  }

  // ---------------------------------------------------------- babak 3: ladang kering
  // petani: menyeka dahi, menggeleng pelan; bersorak saat hujan berhasil
  const wipe = Math.pow(Math.max(0, Math.sin(f * 0.0105)), 6) * sstep(2700, 2900, f) * (1 - sstep(4100, 4300, f));
  refs.farmer.armR.rotation.x = -0.15 - 2.1 * wipe;
  refs.farmer.headG.rotation.y = 0.22 * Math.sin(f * 0.011) * sstep(2700, 2900, f) * (1 - sstep(4300, 4500, f));
  refs.farmer.bodyG.rotation.z = 0.05 + 0.02 * Math.sin(f * 0.02);
  const cheer = sstep(5000, 5080, f) * (1 - sstep(5250, 5350, f));
  refs.farmer.armL.rotation.x = -0.12 - 2.6 * cheer;
  refs.farmer.armR.rotation.x += -2.6 * cheer;
  refs.farmer.root.position.y = Math.abs(Math.sin(f * 0.3)) * 0.12 * cheer;
  // burung kecil kepanasan → pulih sesudah hujan → terbang pergi
  const bd = refs.birdDry;
  const recover = sstep(4800, 5100, f);
  flyBird(bd, f, 5300, 5750, [4.1, 0.4, -5.6], [40, 7, -14], 1.6, 0.7);
  if (f < 5300) {
    bd.root.visible = true;
    bd.root.position.set(4.1, 0.12, -5.6);
    bd.bodyG.rotation.z = 0.25 * (1 - recover);
    bd.headG.rotation.z = 0.5 * (1 - recover);
    bd.wingL.rotation.x = 0.7 * (1 - recover);
    bd.wingR.rotation.x = -0.7 * (1 - recover);
  }
  // kelinci kering terengah → duduk lagi sesudah hujan, melompat ke tepi aliran
  const rd = refs.rabbitDry;
  const sitUp = sstep(4900, 5150, f);
  rd.bodyG.position.y = -0.1 * (1 - sitUp);
  rd.earL.rotation.z = 0.95 * (1 - sitUp);
  rd.earR.rotation.z = -0.95 * (1 - sitUp);
  rd.bodyG.scale.setScalar(1 + 0.045 * Math.sin(f * 0.55) * (1 - sitUp));
  if (f > 5150) {
    const hk = clamp01((f - 5150) / 500);
    rd.root.position.x = lerp(-3.4, 7.6, hk * hk * (3 - 2 * hk));
    rd.root.position.z = lerp(6.2, 3.1, hk * hk * (3 - 2 * hk));
    rd.root.position.y = Math.abs(Math.sin(f * 0.22)) * 0.3 * (hk < 1 ? 1 : 0);
    rd.root.rotation.y = lerp(-0.7, 2.2, hk);
  }
  // kadal: ekor berkedut sesekali
  const flick = Math.max(0, Math.sin(f * 0.021) - 0.72) * 3.5;
  refs.lizardTail.rotation.y = flick * 0.45 * Math.sin(f * 0.6);
  // genangan menyusut lalu terisi lagi
  refs.puddles.forEach((p, i) => {
    const sc = (1 - 0.55 * sstep(2700 + i * 120, 3900, f)) + 0.55 * sstep(4300 + i * 100, 4800, f);
    p.scale.setScalar(Math.max(0.2, sc) * (1 + 0.03 * Math.sin(f * 0.07 + i * 2)));
    (p.material as THREE.MeshStandardMaterial).opacity = 0.85 * clamp01(sc);
  });

  // ---------------------------------------------------------- babak 4: desa
  // anak-anak membuka pintu air
  const gateK = sstep(5000, 5300, f);
  refs.gateBoard.position.y = 0.75 + 1.05 * gateK;
  const kid0 = refs.kids[0], kid1 = refs.kids[1];
  kid0.armR.rotation.x = -0.15 - 2.3 * sstep(4950, 5050, f) * (1 - sstep(5350, 5450, f) * 0.7);
  kid0.bodyG.rotation.z = 0.14 * sstep(4950, 5050, f) * (1 - gateK * 0.5);
  kid0.headG.rotation.y = 0.3 * Math.sin(f * 0.02);
  const jumpK = sstep(5100, 5150, f) * (1 - sstep(5400, 5450, f));
  kid1.root.position.y = Math.abs(Math.sin(f * 0.28)) * 0.22 * jumpK;
  kid1.armL.rotation.x = -2.7 * jumpK;
  kid1.armR.rotation.x = -2.7 * jumpK;
  kid1.headG.rotation.z = 0.08 * Math.sin(f * 0.05);
  // warga pembawa ember berjalan bolak-balik ke aliran
  const cyc = (f % 1500) / 1500;
  const goK = cyc < 0.42 ? sstep(0, 0.42, cyc) : cyc < 0.55 ? 1 : 1 - sstep(0.55, 0.97, cyc);
  const bankPt = pointAt(uAtX(21)).p;
  refs.carrier.root.position.set(lerp(20, bankPt.x + 0.4, goK), 0, lerp(3.4, bankPt.z + 2.4, goK));
  refs.carrier.root.rotation.y = cyc < 0.5 ? Math.atan2(-(bankPt.z + 2.4 - 3.4), bankPt.x + 0.4 - 20) : Math.atan2(-(3.4 - (bankPt.z + 2.4)), 20 - (bankPt.x + 0.4));
  const walking = (cyc > 0.02 && cyc < 0.4) || (cyc > 0.57 && cyc < 0.95) ? 1 : 0;
  if (walking) walkLegs(refs.carrier, f, 0.45, 0.26);
  else { refs.carrier.legL.rotation.x = 0; refs.carrier.legR.rotation.x = 0; }
  refs.carrier.armL.rotation.x = -0.35;
  refs.carrier.bodyG.rotation.z = 0.04 * Math.sin(f * 0.13) * walking;
  // tetua melambai saat kincir berputar
  const waveK = sstep(5450, 5600, f);
  refs.elder.armR.rotation.x = -0.12 - 2.5 * waveK + 0.3 * Math.sin(f * 0.06) * waveK;
  refs.elder.headG.rotation.y = 0.25 * Math.sin(f * 0.015);
  // kincir air berputar sesudah dialiri
  const spin = refs.wheel.userData.spin as THREE.Group;
  spin.rotation.z = f <= 5300 ? 0 : -(f - 5300) * 0.032;
  // sawah terisi air berurutan
  refs.riceWater.forEach((w, i) => {
    (w.material as THREE.MeshStandardMaterial).opacity = 0.55 * sstep(5450 + i * 160, 5950 + i * 160, f);
  });
  // bebek berputar kecil di dekat sawah, ayam mematuk
  refs.ducks.forEach((d, i) => {
    const a = f * 0.004 + i * 2.2;
    d.root.position.set(16.8 + Math.cos(a) * 1.3, 0, 8.1 + Math.sin(a) * 0.9);
    d.root.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI / 2;
    d.bodyG.rotation.z = 0.09 * Math.sin(f * 0.3 + i * 2);
    d.headG.rotation.z = -0.3 * Math.max(0, Math.sin(f * 0.05 + i));
  });
  refs.chickens.forEach((c, i) => {
    const peck = Math.pow(Math.max(0, Math.sin(f * 0.13 + i * 2.6)), 3);
    c.headG.rotation.z = -0.55 * peck;
    c.root.position.x += 0; // posisi dasar dari world; goyangan saja
    c.bodyG.rotation.z = 0.05 * Math.sin(f * 0.09 + i * 3);
    c.root.rotation.y = (i === 0 ? 0.8 : -1.9) + 0.2 * Math.sin(f * 0.008 + i);
  });

  // ---------------------------------------------------------- babak 5: laut
  const seaK = sstep(5850, 6100, f);
  refs.waves.forEach((w, i) => {
    w.position.x = 43.5 + i * 3.2 + Math.sin(f * 0.02 + i * 2.1) * 1.15;
    w.scale.y = 0.32 + 0.1 * Math.sin(f * 0.03 + i * 1.7);
    (w.material as THREE.MeshStandardMaterial).opacity = (0.5 + 0.25 * Math.sin(f * 0.025 + i)) * Math.max(0.25, seaK);
  });
  refs.seaSpark.children.forEach((c, i) => {
    const s = (0.5 + 0.7 * Math.abs(Math.sin(f * 0.09 + (c.userData.phase as number)))) * seaK;
    c.scale.set(1.6 * s + 0.2, 0.4 * s + 0.1, s + 0.2);
    c.visible = f > 5850;
  });
  // ikan melompat
  const jumps: [number, number, number, number][] = [
    [6050, 46, -3.5, 0], [6300, 49, 2.5, 1], [6520, 45, 5, 2], [6680, 50, -5, 0],
  ];
  refs.fishes.forEach((fish, fi) => {
    let active = false;
    jumps.forEach(([t0, jx, jz, owner], ji) => {
      if (owner !== fi) return;
      if (f >= t0 && f <= t0 + 95) {
        active = true;
        const k = (f - t0) / 95;
        fish.root.visible = true;
        fish.root.position.set(jx + k * 2.4, -0.45 + Math.sin(k * Math.PI) * 1.9, jz);
        fish.root.rotation.z = lerp(0.85, -0.85, k);
        fish.tailG.rotation.y = Math.sin(f * 0.7) * 0.4;
        // cincin percik di titik masuk/keluar
        [0, 1].forEach(e => {
          const ring = refs.splashRings[ji * 2 + e];
          const rt = e === 0 ? t0 : t0 + 95;
          const ph = clamp01((f - rt) / 40);
          ring.position.set(jx + e * 2.4, -0.4, jz);
          ring.scale.setScalar(0.3 + ph * 1.5);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.65 * (1 - ph) * (ph > 0 && ph < 1 ? 1 : 0);
        });
      }
    });
    if (!active) fish.root.visible = false;
  });
  // camar berputar di atas laut
  refs.gulls.forEach((gl, i) => {
    gl.root.visible = f > 5900;
    if (f <= 5900) return;
    const cx = [48, 55, 44, 52][i], cz = [-6, 4, 3, -11][i];
    const r = [9, 11, 7.5, 10][i], sp = [0.009, 0.0075, 0.011, 0.0085][i];
    const a = f * sp + i * 1.9;
    gl.root.position.set(cx + Math.cos(a) * r, 7.5 + i * 0.8 + Math.sin(f * 0.05 + i) * 0.4, cz + Math.sin(a) * r);
    gl.root.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + (sp > 0 ? Math.PI : 0);
    gl.root.rotation.z = 0.28;
    flap(gl, f, 0.55, 0.4, i * 1.3);
  });
  // perahu bergoyang + nelayan mendayung pelan
  refs.boat.rotation.z = 0.05 * Math.sin(f * 0.05 + 1);
  refs.boat.rotation.x = 0.03 * Math.sin(f * 0.037);
  refs.boat.position.y = -0.35 + 0.08 * Math.sin(f * 0.045);
  // kepiting menyamping di pasir
  const crabDir = Math.cos(f * 0.006);
  refs.crab.root.position.x = 36 + 1.8 * Math.sin(f * 0.006);
  refs.crab.root.position.z = 5.2 + 0.4 * Math.sin(f * 0.0023);
  refs.crab.root.rotation.y = crabDir > 0 ? -0.3 : Math.PI + 0.3;
  refs.crab.eyeL.rotation.x = 0.15 * Math.sin(f * 0.07);
  refs.crab.eyeR.rotation.x = 0.15 * Math.sin(f * 0.07 + 0.6);

  // ---------------------------------------------------------- kamera
  const cam = keyLerp(CAM_KEYS, f);
  camera.position.set(cam.x, cam.y + Math.sin(f * 0.013) * 0.08, cam.z);
  camera.lookAt(cam.tx, cam.ty, cam.tz);
}
