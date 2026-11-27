import * as THREE from "three";
import { KelinciRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles,
  driftClouds, swayFlowers,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Scene boundaries (frames, timing ASLI — assemble 27 Nov 2026, 16291 frame):
//  s1_hujan   12–2998   (seg 0–9)   hujan, gudang kosong, jejak, temu Tupai
//  s2_tuduhan 3023–7134 (seg 10–23) konfrontasi di sarang Rubah
//  s3_peta    7160–10623 (seg 24–35) Tupai memanjat, peta, lubang di bawah akar
//  s4_gali    10649–13722 (seg 36–46) gali saluran, air mengalir, makanan diangkat
//  s5_gudang  13747–16230 (seg 47–54) gudang bersama di bukit, cahaya sore hangat
//  tail sampai 16290 (TOTAL_FRAMES)

export const TOTAL_FRAMES = timing.frames;

// ---- keyframes (x, y, z, ry) — ry 0 = menghadap +x (kanan), π = menghadap −x
const RABBIT_KEYS = [
  { f: 0, x: -5.2, y: 0, z: -1.0, ry: 0 },
  { f: 620, x: -4.6, y: 0, z: -0.6, ry: 0 },   // marah melompat di depan gudang
  { f: 1339, x: -3.4, y: 0, z: -1.2, ry: 0 },
  { f: 1912, x: -1.2, y: 0, z: -1.8, ry: 0 },  // mengikuti jejak ke semak
  { f: 2576, x: 2.5, y: 0, z: -1.8, ry: 0 },   // berlari ke pohon ek
  { f: 2998, x: 4.4, y: 0, z: -1.6, ry: 0 },   // bertemu Tupai
  { f: 3777, x: 1.5, y: 0, z: 0.3, ry: 0 },   // di depan sarang Rubah (fix2: renggang dari Tupai/Rubah)
  { f: 4980, x: 1.5, y: 0, z: 0.3, ry: 0 },
  { f: 7134, x: 1.5, y: 0, z: 0.3, ry: 0 },
  { f: 8152, x: 3.0, y: 0, z: -1.0, ry: 0 },   // lari ke akar pohon besar
  { f: 9180, x: 3.0, y: 0, z: -1.0, ry: 0.3 }, // mengintip lubang
  { f: 10623, x: 3.0, y: 0, z: -1.0, ry: 0.3 },
  { f: 10993, x: 4.4, y: 0, z: -1.4, ry: 0 },  // menggali saluran
  { f: 12341, x: 4.3, y: 0, z: -1.3, ry: 0 },
  { f: 13722, x: 4.4, y: 0, z: -1.4, ry: 0 },
  { f: 14411, x: -1.0, y: 0, z: -2.6, ry: Math.PI }, // lari ke bukit
  { f: 15222, x: -7.4, y: 0, z: -3.0, ry: Math.PI },
  { f: 15979, x: -7.6, y: 0, z: -3.0, ry: -Math.PI / 2 }, // penutup: hadap kamera
  { f: 16290, x: -7.6, y: 0, z: -3.0, ry: -Math.PI / 2 },
];

const FOX_KEYS = [
  { f: 0, x: 4.8, y: 0, z: -1.2, ry: Math.PI }, // (tersembunyi s1)
  { f: 3023, x: 6.2, y: 0, z: -1.0, ry: Math.PI }, // duduk tenang di DEPAN sarang (fix2: kanan + lebih ke belakang)
  { f: 4980, x: 6.2, y: 0, z: -1.0, ry: Math.PI },
  { f: 7134, x: 6.2, y: 0, z: -1.0, ry: Math.PI },
  { f: 8152, x: 6.0, y: 0, z: -2.4, ry: Math.PI }, // ke akar pohon
  { f: 9180, x: 6.0, y: 0, z: -2.4, ry: Math.PI }, // mendengarkan ke lubang
  { f: 10623, x: 6.0, y: 0, z: -2.4, ry: Math.PI },
  { f: 10993, x: 4.6, y: 0, z: -1.6, ry: Math.PI },
  { f: 11799, x: 3.2, y: 0, z: -0.6, ry: Math.PI }, // lompat tepat ke titik gali
  { f: 12685, x: 3.4, y: 0, z: -0.7, ry: Math.PI },
  { f: 13722, x: 3.6, y: 0, z: -0.8, ry: Math.PI },
  { f: 15024, x: -4.0, y: 0, z: -3.2, ry: Math.PI }, // ke bukit
  { f: 15696, x: -8.4, y: 0, z: -3.4, ry: -Math.PI / 2 },
  { f: 16290, x: -8.4, y: 0, z: -3.4, ry: -Math.PI / 2 },
];

const SQUIRREL_KEYS = [
  { f: 0, x: 5.6, y: 1.6, z: -3.4, ry: Math.PI }, // memanjat pohon ek
  { f: 1339, x: 5.5, y: 1.1, z: -3.2, ry: Math.PI },
  { f: 2009, x: 5.1, y: 0.2, z: -2.4, ry: Math.PI }, // turun menemui Kelinci
  { f: 2998, x: 4.9, y: 0, z: -1.8, ry: Math.PI },
  { f: 3777, x: 4.0, y: 0, z: 1.3, ry: 0 },   // menengahi di tengah (fix3: PALING DEPAN, jadi tidak tertutup Kelinci/Rubah)
  { f: 4742, x: 4.0, y: 0, z: 1.3, ry: Math.PI },
  { f: 5816, x: 4.0, y: 0, z: 1.3, ry: 0 },
  { f: 7134, x: 4.0, y: 0, z: 1.3, ry: Math.PI },
  { f: 7526, x: 4.6, y: 0, z: -1.8, ry: 0 },   // memanjat lagi (peta)
  { f: 8052, x: 5.6, y: 1.7, z: -3.4, ry: 0 },
  { f: 8685, x: 4.3, y: 0.4, z: -0.8, ry: -Math.PI / 2 }, // kembali membawa peta, HADAP KAMERA (fix2)
  { f: 9367, x: 4.4, y: 0, z: -0.2, ry: -Math.PI / 2 }, // menunjuk tanda peta, hadap kamera
  { f: 10623, x: 4.4, y: 0, z: -0.2, ry: -Math.PI / 2 },
  { f: 10993, x: 3.0, y: 0, z: -0.6, ry: 0 },  // menahan tanah saluran
  { f: 12341, x: 2.6, y: 0, z: 0.0, ry: 0 },
  { f: 13722, x: 2.8, y: 0, z: -0.2, ry: 0 },
  { f: 14411, x: 0.0, y: 0, z: -2.4, ry: Math.PI }, // ke bukit
  { f: 15222, x: -6.6, y: 0, z: -2.6, ry: Math.PI },
  { f: 15979, x: -6.9, y: 0, z: -2.6, ry: -Math.PI / 2 },
  { f: 16290, x: -6.9, y: 0, z: -2.6, ry: -Math.PI / 2 },
];

/** Landscape fit: visible width at distance z (fov 42, 16:9) ≈ z * 1.3647. */
function fitZLand(spread: number, margin = 1.2, zMin = 8.0, zMax = 14): number {
  return Math.max(zMin, Math.min(zMax, (spread + margin) / 1.3647));
}

/** Kecepatan gerak (untuk bob lari): |Δx| per 48 frame. */
function speedAt(keys: { f: number; x: number }[], f: number): number {
  const a = keyLerp(keys, Math.max(0, f - 24));
  const b = keyLerp(keys, f + 24);
  return Math.abs(b.x - a.x) / 48;
}

export function poseFrame(frame: number, refs: KelinciRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const rabM = mouthVal(MOUTH, "rabbit", f);
  const foxM = mouthVal(MOUTH, "fox", f);
  const sqM = mouthVal(MOUTH, "squirrel", f);
  // pemetaan segmen -> speaker (dari segments.json: N/K/R/T)
  const SEG_SP: string[] = ["N","N","K","N","K","N","T","K","T","N","K","R","K","N","R","K","R","T","N","K","R","T","N","T","N","T","K","T","N","R","T","K","T","N","R","N","T","K","R","N","K","T","R","N","K","T","R","N","N","K","R","T","N","N","N"];
  const curSp = line >= 0 ? SEG_SP[line] : "";

  // ---- rabbit ---------------------------------------------------------------
  const ra = keyLerp(RABBIT_KEYS, f);
  const raSpeed = speedAt(RABBIT_KEYS, f);
  const angry = line >= 2 && line <= 4 ? 1 : 0; // Kelinci marah (seg 2–4)
  const hop = angry * Math.abs(Math.sin(f * 0.28)) * 0.32;
  const runBob = Math.min(1, raSpeed * 6) * Math.abs(Math.sin(f * 0.3)) * 0.12;
  refs.rabbit.position.set(ra.x, ra.y + hop + runBob, ra.z);
  refs.rabbit.rotation.y = ra.ry;
  // antisipasi + squash sebelum lompat marah, stretch saat berlari
  const antic = sstep(875, 949, f) * (1 - sstep(949, 997, f));
  refs.rabbitBodyG.scale.set(
    1 + 0.1 * Math.min(1, raSpeed * 6) - 0.12 * antic,
    1 - 0.06 * Math.min(1, raSpeed * 6) + 0.08 * antic + 0.02 * Math.sin(f * 0.08),
    1,
  );
  refs.rabbitBodyG.position.y = 0.62 + Math.sin(f * 0.09) * 0.02 - 0.06 * angry * Math.abs(Math.sin(f * 0.28));
  refs.rabbitBodyG.rotation.z = -0.08 * Math.min(1, raSpeed * 6) + 0.06 * angry * Math.sin(f * 0.5);
  // telinga: follow-through — menyusul gerak badan (fase tertinggal)
  const earLag = Math.sin(f * 0.11 - 1.1) * 0.12 + hop * 0.9 + Math.min(1, raSpeed * 6) * 0.25;
  refs.rabbitEarL.rotation.z = -0.15 - earLag * 0.5;
  refs.rabbitEarR.rotation.z = -0.15 - earLag * 0.5;
  refs.rabbitEarL.rotation.x = 0.06 * Math.sin(f * 0.07);
  refs.rabbitEarR.rotation.x = -0.06 * Math.sin(f * 0.07 + 0.8);
  // kaki: tendangan menggali s4 + langkah saat lari
  const dig = sstep(10846, 10944, f) * (1 - sstep(12617, 12854, f));
  refs.rabbitLegBL.rotation.x = Math.sin(f * 0.5) * 0.55 * dig + Math.sin(f * 0.3) * 0.2 * Math.min(1, raSpeed * 6);
  refs.rabbitLegBR.rotation.x = -Math.sin(f * 0.5 + 0.7) * 0.55 * dig - Math.sin(f * 0.3 + 0.7) * 0.2 * Math.min(1, raSpeed * 6);
  refs.rabbitLegFL.rotation.x = Math.sin(f * 0.3 + 1.2) * 0.15 * Math.min(1, raSpeed * 6);
  refs.rabbitLegFR.rotation.x = -Math.sin(f * 0.3 + 1.9) * 0.15 * Math.min(1, raSpeed * 6);
  refs.rabbitBodyG.rotation.z += 0.12 * Math.sin(f * 0.5) * dig; // badan menunduk menggali
  // rahang + angguk saat bicara; mengangguk kecil saat mendengarkan
  refs.rabbitJawG.rotation.z = -rabM * 0.5;
  refs.rabbitHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * rabM
    + (curSp !== "" && curSp !== "K" ? Math.sin(f * 0.06) * 0.04 : 0)
    + 0.1 * angry * Math.sin(f * 0.45);
  refs.rabbitHeadG.rotation.y = Math.sin(f * 0.06) * 0.04;
  applyBlink(refs.rabbitEyeL, refs.rabbitEyeR, f, 33, 130);

  // ---- fox ------------------------------------------------------------------
  const fo = keyLerp(FOX_KEYS, f);
  refs.fox.visible = f >= 3023; // Rubah baru muncul di s2
  const foSpeed = speedAt(FOX_KEYS, f);
  // lompatan tepat ke titik gali (line 40: 11461–11695)
  const leap = sstep(11684, 11757, f) * (1 - sstep(11799, 11877, f));
  refs.fox.position.set(fo.x, fo.y + leap * 0.85 + Math.min(1, foSpeed * 6) * Math.abs(Math.sin(f * 0.3)) * 0.1, fo.z);
  refs.fox.rotation.y = fo.ry;
  // duduk tenang di s2: badan tegak, kaki depan terlipat, ekor melingkar
  const sit = sstep(3023, 3134, f) * (1 - sstep(7134, 7273, f));
  refs.foxBodyG.rotation.z = 0.3 * sit + 0.02 * Math.sin(f * 0.08);
  refs.foxBodyG.position.y = 1.05 - 0.18 * sit + Math.sin(f * 0.09 + 1.0) * 0.02;
  refs.foxBodyG.scale.set(1 + 0.1 * leap, 1 - 0.05 * leap, 1);
  refs.foxLegFL.rotation.z = -0.6 * sit;
  refs.foxLegFR.rotation.z = -0.6 * sit;
  refs.foxLegFL.rotation.x = Math.sin(f * 0.3) * 0.15 * Math.min(1, foSpeed * 6);
  refs.foxLegFR.rotation.x = -Math.sin(f * 0.3 + 0.7) * 0.15 * Math.min(1, foSpeed * 6);
  refs.foxLegBL.rotation.x = -Math.sin(f * 0.3 + 1.1) * 0.15 * Math.min(1, foSpeed * 6);
  refs.foxLegBR.rotation.x = Math.sin(f * 0.3 + 1.7) * 0.15 * Math.min(1, foSpeed * 6);
  // ekor lebat: follow-through menyusul gerak badan
  refs.foxTailG.rotation.z = 0.05 * sit + Math.sin(f * 0.09 - 1.0) * 0.14;
  refs.foxTailG.rotation.y = Math.sin(f * 0.07 - 0.6) * 0.1;
  // telinga tegak mendengarkan; saat mendengarkan lubang (line 34) kepala menunduk
  const listen = sstep(10112, 10216, f) * (1 - sstep(10321, 10400, f));
  refs.foxEarL.rotation.x = 0.1 * listen + Math.sin(f * 0.05) * 0.03;
  refs.foxEarR.rotation.x = -0.1 * listen - Math.sin(f * 0.05 + 0.5) * 0.03;
  refs.foxEarL.rotation.z = Math.sin(f * 0.11) * 0.04;
  refs.foxEarR.rotation.z = -Math.sin(f * 0.11 + 0.9) * 0.04;
  refs.foxJawG.rotation.z = -foxM * 0.5;
  refs.foxHeadG.rotation.z = -0.3 * listen - 0.25 * sit + Math.sin(f * 0.5) * 0.05 * foxM
    + (curSp !== "" && curSp !== "R" ? Math.sin(f * 0.06 + 2) * 0.04 : 0);
  refs.foxHeadG.rotation.y = Math.sin(f * 0.06 + 1) * 0.04;
  applyBlink(refs.foxEyeL, refs.foxEyeR, f, 60, 140);

  // ---- squirrel ---------------------------------------------------------------
  const sq = keyLerp(SQUIRREL_KEYS, f);
  const sqSpeed = speedAt(SQUIRREL_KEYS, f);
  const climbing = sq.y > 0.5 ? 1 : 0;
  refs.squirrel.position.set(sq.x, sq.y + Math.min(1, sqSpeed * 6) * Math.abs(Math.sin(f * 0.32)) * 0.1, sq.z);
  refs.squirrel.rotation.y = sq.ry;
  refs.squirrelBodyG.rotation.z = 0.3 * climbing + 0.02 * Math.sin(f * 0.1);
  refs.squirrelBodyG.position.y = 0.55 + Math.sin(f * 0.11 + 2.0) * 0.02;
  refs.squirrelBodyG.scale.set(1, 1 + 0.02 * Math.sin(f * 0.1 + 0.5), 1);
  // ekor besar: follow-through (fase tertinggal dari badan)
  refs.squirrelTailG.rotation.z = Math.sin(f * 0.09 - 1.2) * 0.16 + 0.1 * climbing;
  refs.squirrelTailG.rotation.y = Math.sin(f * 0.07 - 0.4) * 0.08;
  refs.squirrelEarL.rotation.z = Math.sin(f * 0.12) * 0.05;
  refs.squirrelEarR.rotation.z = -Math.sin(f * 0.12 + 0.7) * 0.05;
  // peta: dibawa sejak kembali dari pohon (f8100) sampai akhir s3; digambar baru di s5
  const mapOn = (f >= 8251 && f <= 10623) || f >= 14864;
  refs.squirrelMapG.visible = mapOn;
  // menunjuk tanda peta (line 29–32: 8483–9568): peta diangkat, kepala mengangguk
  const pointMap = sstep(8668, 8786, f) * (1 - sstep(9562, 9726, f));
  refs.squirrelMapG.position.y = -0.05 + 0.18 * pointMap;
  refs.squirrelMapG.rotation.z = 0.1 - 0.35 * pointMap;
  // ranting/daun s4 (menahan tanah saluran)
  refs.squirrelTwigG.visible = f >= 10846 && f <= 13722;
  refs.squirrelTwigG.rotation.z = 0.5 + Math.sin(f * 0.08) * 0.12;
  refs.squirrelJawG.rotation.z = -sqM * 0.5;
  refs.squirrelHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * sqM
    + (curSp !== "" && curSp !== "T" ? Math.sin(f * 0.06 + 4) * 0.04 : 0)
    + 0.12 * pointMap;
  refs.squirrelHeadG.rotation.y = Math.sin(f * 0.06 + 2) * 0.04;
  applyBlink(refs.squirrelEyeL, refs.squirrelEyeR, f, 77, 135);

  // ---- environment ------------------------------------------------------------
  // hujan s1 saja: streaks jatuh berulang
  refs.rainG.visible = f < 3023;
  if (refs.rainG.visible) {
    refs.rainG.children.forEach((c, i) => {
      const y = 6.5 - (((f * 0.22 + i * 0.53) % 1) * 6.5);
      c.position.set(-8 + ((i * 0.41) % 1) * 16, y, -3 + (i % 5) * 1.2);
    });
  }
  refs.printsG.visible = f < 7160; // jejak lumpur s1–s2
  // rumput + bunga bergoyang, awan hanyut
  refs.grass.forEach((tuft) => {
    const ph = tuft.userData.phase as number;
    tuft.rotation.z = Math.sin(f * 0.03 + ph) * 0.08;
  });
  swayFlowers(refs.flowers, f, 0.06);
  driftClouds(refs.clouds, f, 0.0022);

  // saluran galian s4: tanah terlihat sejak awal s4, air mengalir sesudah digali
  refs.channelG.visible = f >= 10649;
  refs.waterG.visible = f >= 11716;
  refs.flowG.visible = f >= 12436;
  if (refs.flowG.visible) {
    refs.flowG.children.forEach((c, i) => {
      c.position.set(5.0 - (((f * 0.05 + i * 1.3) % 2.8)), 0.14, -2.5 + ((5.0 - c.position.x) * 0.55));
      c.rotation.y = 0.5;
    });
  }
  // gumpalan tanah saat menggali (line 37–43)
  const digging = f >= 10846 && f <= 12854;
  refs.dirtG.visible = digging;
  if (digging) {
    refs.dirtG.children.forEach((c, i) => {
      const t = (((f - 10651) * 0.02 + i * 0.13) % 1);
      c.position.set(4.3 - t * 0.9, 0.15 + Math.sin(t * Math.PI) * 0.55, -1.2 + Math.sin(i * 2.1) * 0.3 * t);
      c.scale.setScalar(0.6 + t * 0.6);
    });
  }
  // makanan diangkat dari lubang (line 44 ke atas)
  refs.foodG.visible = f >= 12880;
  if (refs.foodG.visible) {
    refs.foodG.position.y = 0.25 + sstep(12880, 13240, f) * 0.25;
  }
  // gudang bersama: muncul di s5, dinding naik dulu lalu atap
  refs.storeNewG.visible = f >= 13747;
  if (refs.storeNewG.visible) {
    const b = sstep(13798, 14411, f);
    refs.storeNewG.scale.set(1, 0.15 + 0.85 * b, 1);
    refs.storeNewRoofG.scale.setScalar(0.2 + 0.8 * sstep(14135, 14603, f));
  }
  refs.foodNewG.visible = f >= 14652;
  pulseSparkles(refs.sparkles, f, f >= 15931);

  // matahari sore: menghangat + membesar di s5
  const warm = sstep(13747, 16156, f);
  (refs.sunMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffd94d).lerp(new THREE.Color("#ff9a3c"), warm);
  refs.sunMesh.scale.setScalar(1 + 0.15 * warm);

  // ---- camera: frame by true extents (landscape) ---------------------------
  let left = Infinity, right = -Infinity;
  const include = (x: number, half: number, on: boolean) => {
    if (!on) return;
    left = Math.min(left, x - half);
    right = Math.max(right, x + half);
  };
  include(ra.x, 0.95, true);
  include(fo.x, 1.3, refs.fox.visible);
  // Tupai di pohon ek (s1 awal) TIDAK masuk hitungan kamera — kamera mengikuti
  // Kelinci saja sampai ia berlari ke pohon (f1840); kalau tidak, bingkai
  // terlalu lebar dan tokoh mengecil (temuan putaran 1)
  include(sq.x, 1.0, f >= 1762);
  // s5 akhir: gudang baru ikut dibingkai
  if (f >= 15370) { left = Math.min(left, -9.2); right = Math.max(right, -6.0); }
  if (!isFinite(left)) { left = -1; right = 1; }
  const midX = (left + right) / 2;
  // s2/s3: tiga tokoh bersama — margin lebih lega supaya tidak bertumpuk di layar (fix2)
  const z = fitZLand(right - left, (f >= 3023 && f < 10623) ? 2.6 : 1.2);
  camera.position.set(midX * 0.85, 1.35 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, 0.55, 0);
}
