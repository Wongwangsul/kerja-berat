import * as THREE from "three";
import { LumbaRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles, blinkScale,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Scene boundaries (frames, dari timeline.json):
//  s1_arus      12–1967   (seg 0–4)   rombongan berenang, arus datang, Tara terseret
//  s2_lumo      1977–5673 (seg 5–16)  Lumo melesat masuk, dua kali salah arah
//  s3_paus      5683–9213 (seg 17–28) Boma muncul dari kedalaman, nyanyian, spout
//  s4_arah      9224–14381(seg 29–45) Lumo pengintai bolak-balik, Tara merasakan arah
//  s5_matahari  14392–17496(seg 46–55) rombongan terlihat, matahari terbit, ke pantai

const WHALE_LINES = new Set([17, 20, 23, 25, 30, 43, 49]);

// ---- keyframes (x, y, ry) -----------------------------------------------
const TARA_KEYS = [
  { f: 0, x: -2.2, y: 0.2, ry: 0 },
  { f: 1150, x: -2.0, y: 0.25, ry: 0 },
  { f: 1468, x: 0.8, y: -0.2, ry: 0 },   // terseret arus
  { f: 1705, x: 1.8, y: -0.4, ry: 0 },   // panik, berputar (line 3)
  { f: 1967, x: 2.0, y: -0.35, ry: 0 },  // sendirian, tersesat
  { f: 3094, x: 1.9, y: -0.3, ry: 0 },
  { f: 4027, x: 1.2, y: -0.25, ry: 0 },  // berusaha mengikuti Lumo
  { f: 4904, x: 2.2, y: -0.1, ry: 0 },   // sampai di tempat yang salah
  { f: 5673, x: 1.4, y: -0.2, ry: 0 },   // mengapung bingung
  { f: 9213, x: 1.9, y: -0.2, ry: 0 },   // mendengarkan Boma
  { f: 10352, x: 1.9, y: -0.2, ry: 0 },
  { f: 12730, x: 1.9, y: -0.2, ry: 0 },  // menutup mata, merasakan arah
  { f: 14381, x: 1.9, y: -0.1, ry: 0 },  // menunjuk mantap, mulai bergerak
  { f: 16000, x: 3.4, y: -0.1, ry: 0 },
  { f: 17557, x: 4.3, y: 0.0, ry: 0 },
];

const LUMO_KEYS = [
  { f: 0, x: -8.0, y: 0.5, ry: 0 },      // di luar bingkai kiri
  { f: 1977, x: -6.5, y: 0.4, ry: 0 },
  { f: 2176, x: 0.6, y: 0.45, ry: 0 },   // melesat masuk (line 5)
  { f: 3094, x: 0.9, y: 0.5, ry: 0 },
  { f: 3657, x: 1.0, y: 0.5, ry: 0 },
  { f: 4027, x: 4.6, y: 0.6, ry: 0 },    // melesat seperti anak panah (line 10)
  { f: 4120, x: 4.2, y: 0.55, ry: Math.PI }, // putar balik cepat
  { f: 4267, x: 1.4, y: 0.35, ry: Math.PI },  // kembali ke Tara (line 11)
  { f: 4360, x: 1.5, y: 0.4, ry: 0 },
  { f: 4904, x: 3.4, y: 0.55, ry: 0 },   // berenang bersama ke arah salah
  { f: 5030, x: 3.2, y: 0.55, ry: Math.PI },  // salah arah ke-2: putar balik (line 14)
  { f: 5373, x: 1.6, y: 0.35, ry: Math.PI },
  { f: 5470, x: 1.4, y: 0.4, ry: 0 },
  { f: 5673, x: 1.3, y: 0.4, ry: 0 },    // mengapung bingung
  { f: 9213, x: 0.3, y: 0.45, ry: 0 },   // mendengarkan Boma
  { f: 9519, x: 3.8, y: 0.6, ry: 0 },    // pengintai melesat (line 29)
  { f: 9905, x: 4.4, y: 0.6, ry: 0 },    // karang bulan sabit (line 31)
  { f: 10050, x: 4.0, y: 0.55, ry: Math.PI }, // putar balik
  { f: 10352, x: 1.4, y: 0.35, ry: Math.PI },  // "lagi-lagi aku salah" (line 33)
  { f: 10480, x: 1.2, y: 0.4, ry: 0 },
  { f: 11267, x: 0.5, y: 0.4, ry: 0 },   // berhenti, mengapung diam di samping Tara
  { f: 12730, x: 0.5, y: 0.4, ry: 0 },
  { f: 14381, x: 2.0, y: 0.45, ry: 0 },  // setuju, di depan Tara
  { f: 16000, x: 5.0, y: 0.7, ry: 0 },
  { f: 17557, x: 6.2, y: 0.75, ry: 0 },
];

const WHALE_KEYS = [
  { f: 0, x: 4.6, y: -5.5, ry: Math.PI },  // jauh di kedalaman, tersembunyi
  { f: 5683, x: 4.6, y: -4.5, ry: Math.PI },
  { f: 6134, x: 5.8, y: -0.9, ry: Math.PI }, // muncul, besar dan lambat, di kanan bawah
  { f: 9213, x: 5.8, y: -0.9, ry: Math.PI }, // (x digeser 01.35 WIB: 4,0 -> 5,8
  { f: 10352, x: 3.0, y: -1.0, ry: Math.PI }, //  supaya kepala lepas dari Tara di s3/s4;
  { f: 12730, x: 1.2, y: -1.0, ry: Math.PI }, //  s4/s5: Boma geser ke kiri-bawah (01.50 WIB)
  { f: 14381, x: 1.2, y: -1.0, ry: Math.PI }, //  jadi raksasa latar: kepala kiri, ekor kanan,
  { f: 16000, x: 1.8, y: -1.0, ry: Math.PI }, //  badan di bawah kelompok, kepala terbaca)
  { f: 17557, x: 2.4, y: -1.0, ry: Math.PI },
];

// Rombongan: 3 penyu kecil. s1 bersama Tara, tersebar saat arus, keluar
// bingkai; kembali masuk dari kiri di s5 dan berenang bersama ke pantai.
const FLOCK_KEYS: { f: number; x: number; y: number }[][] = [
  [
    { f: 0, x: -3.7, y: 0.7 }, { f: 1150, x: -3.5, y: 0.7 },
    { f: 1468, x: -4.6, y: 0.0 }, { f: 1850, x: -7.5, y: -0.6 },
    { f: 14392, x: -6.0, y: 0.3 }, { f: 15132, x: 1.2, y: 0.8 },
    { f: 17557, x: 2.8, y: 0.8 },
  ],
  [
    { f: 0, x: -4.1, y: -0.2 }, { f: 1150, x: -3.9, y: -0.2 },
    { f: 1468, x: -5.0, y: -0.7 }, { f: 1850, x: -8.0, y: -1.0 },
    { f: 14392, x: -6.6, y: -0.2 }, { f: 15132, x: 0.9, y: -0.3 },
    { f: 17557, x: 2.4, y: 0.1 },
  ],
  [
    { f: 0, x: -3.3, y: -0.7 }, { f: 1150, x: -3.1, y: -0.7 },
    { f: 1468, x: -4.2, y: -1.0 }, { f: 1850, x: -7.0, y: -1.2 },
    { f: 14392, x: -5.6, y: -0.6 }, { f: 15132, x: 1.6, y: -0.6 },
    { f: 17557, x: 3.0, y: -0.3 },
  ],
];

/** Landscape fit: visible width at distance z (fov 42, 16:9) ≈ z * 1.3647. */
function fitZLand(spread: number, margin = 1.2, zMin = 7.5, zMax = 14): number {
  return Math.max(zMin, Math.min(zMax, (spread + margin) / 1.3647));
}

export function poseFrame(frame: number, refs: LumbaRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const dolM = mouthVal(MOUTH, "dolphin", f);
  const turM = mouthVal(MOUTH, "turtle", f);
  const whaM = mouthVal(MOUTH, "whale", f);
  const whaleSinging = line >= 0 && WHALE_LINES.has(line);

  // ---- whale (Boma) -------------------------------------------------------
  const wh = keyLerp(WHALE_KEYS, f);
  refs.whale.visible = f >= 5600;
  refs.whale.position.set(wh.x, wh.y, -5.0);
  refs.whale.rotation.y = wh.ry;
  const rise = sstep(5683, 6134, f);
  refs.whale.scale.setScalar(1.35 * (0.85 + 0.15 * rise));
  const swim = 0.06 * Math.sin(f * 0.09);
  refs.whaleBodyG.rotation.z = swim;
  refs.whaleBodyG.position.y = Math.sin(f * 0.07) * 0.06;
  refs.whaleTailG.rotation.y = Math.sin(f * 0.09 - 0.9) * 0.22;
  // fin points toward the shallows while Boma speaks (line 23), then rests
  const pointFin = sstep(7209, 7300, f) * (1 - sstep(7500, 7577, f));
  refs.whaleFinL.rotation.x = -0.55 * pointFin + Math.sin(f * 0.08) * 0.08;
  refs.whaleFinR.rotation.x = 0.55 * pointFin - Math.sin(f * 0.08) * 0.08;
  refs.whaleJawG.rotation.z = -whaM * 0.4;
  refs.whaleHeadG.rotation.z = Math.sin(f * 0.45) * 0.03 * whaM;
  applyBlink(refs.whaleEyeL, refs.whaleEyeR, f, 60, 140);
  // spout on first appearance + sunrise finale
  refs.spoutG.visible = line === 17 || f >= 16500;
  if (refs.spoutG.visible) {
    const t0 = line === 17 ? 5683 : 16500;
    refs.spoutG.children.forEach((c, i) => {
      const ph = (((f - t0) * 0.06 + i * 0.35) % 1.6);
      c.position.set(Math.sin(i * 2.3) * 0.25 * ph, ph * 1.1, Math.cos(i * 1.7) * 0.2 * ph);
      c.scale.setScalar(0.5 + ph * 0.9);
    });
  }
  // song rings expand from the whale while it sings
  refs.songG.visible = whaleSinging;
  if (whaleSinging) {
    refs.songRings.forEach((ring, i) => {
      const p = ((f * 0.012 + i * 0.34) % 1);
      ring.scale.setScalar(0.8 + p * 2.2);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - p);
    });
  }

  // ---- dolphin (Lumo) ------------------------------------------------------
  const lu = keyLerp(LUMO_KEYS, f);
  refs.lumo.visible = f >= 1900; // jangan mengintip di tepi bingkai s1
  refs.lumo.position.set(lu.x, lu.y, 1.2); // depan Tara (z 0.5) agar tidak tertutup
  refs.lumo.rotation.y = lu.ry;
  // dash stretch: during the fast dashes (in, line 10, scout)
  const dash =
    sstep(1977, 2030, f) * (1 - sstep(2100, 2176, f))
    + sstep(3657, 3720, f) * (1 - sstep(3950, 4027, f))
    + sstep(9224, 9280, f) * (1 - sstep(9450, 9519, f));
  const dashE = Math.min(1, dash);
  // anticipation squash just before the first dash (line 5)
  const antic = sstep(1930, 1977, f) * (1 - sstep(1977, 2030, f));
  refs.lumoBodyG.scale.set(1 + 0.12 * dashE - 0.1 * antic, 1 - 0.08 * dashE + 0.06 * antic, 1);
  // swim undulation + tail follow-through (never frozen)
  refs.lumoBodyG.rotation.z = 0.05 * Math.sin(f * 0.1) - 0.12 * dashE;
  refs.lumoBodyG.position.y = Math.sin(f * 0.11) * 0.05;
  refs.lumoTailG.rotation.y = Math.sin(f * 0.16 - 0.8) * 0.3;
  refs.lumoDorsalG.rotation.x = Math.sin(f * 0.13) * 0.08;
  refs.lumoFinL.rotation.x = 0.15 + Math.sin(f * 0.14) * 0.25;
  refs.lumoFinR.rotation.x = -0.15 - Math.sin(f * 0.14 + 0.5) * 0.25;
  // droop when Lumo realises he was wrong again (line 33)
  const droop = sstep(10185, 10260, f) * (1 - sstep(11200, 11267, f));
  refs.lumoBodyG.rotation.z -= 0.18 * droop;
  // jaw + head nod while speaking; head shake (geleng) on line 14 (wrong turn)
  refs.lumoJawG.rotation.z = -dolM * 0.45;
  const shake = sstep(4915, 4970, f) * (1 - sstep(5080, 5132, f));
  refs.lumoHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * dolM + Math.sin(f * 0.55) * 0.16 * shake;
  refs.lumoHeadG.rotation.y = Math.sin(f * 0.06) * 0.04;
  applyBlink(refs.lumoEyeL, refs.lumoEyeR, f, 33, 130);

  // ---- turtle (Tara) -------------------------------------------------------
  const ta = keyLerp(TARA_KEYS, f);
  refs.tara.position.set(ta.x, ta.y, 0.5);
  refs.tara.rotation.y = ta.ry;
  // panic spin while swept by the current (line 3)
  const panic = sstep(1478, 1520, f) * (1 - sstep(1650, 1705, f));
  refs.tara.rotation.y += Math.sin(f * 0.3) * 0.7 * panic;
  refs.taraBodyG.rotation.z = 0.04 * Math.sin(f * 0.09) + 0.25 * panic * Math.sin(f * 0.4);
  refs.taraBodyG.position.y = Math.sin(f * 0.1 + 1.2) * 0.05;
  // flippers row continuously; flail fast while panicking
  const flapSpeed = panic > 0 ? 0.5 : 0.12;
  const flapAmp = panic > 0 ? 0.7 : 0.3;
  refs.taraFinFL.rotation.x = Math.sin(f * flapSpeed) * flapAmp;
  refs.taraFinFR.rotation.x = -Math.sin(f * flapSpeed + 0.6) * flapAmp;
  refs.taraFinBL.rotation.x = -Math.sin(f * flapSpeed + 1.1) * flapAmp * 0.8;
  refs.taraFinBR.rotation.x = Math.sin(f * flapSpeed + 1.7) * flapAmp * 0.8;
  // pointing: front-right flipper raised toward the beach (line 40 onward)
  const pointTara = sstep(12740, 12820, f);
  refs.taraFinFR.rotation.z = -0.55 * pointTara;
  refs.taraHeadG.rotation.z = -0.12 * pointTara;
  // jaw + head nod while speaking
  refs.taraJawG.rotation.z = -turM * 0.45;
  refs.taraHeadG.rotation.z += Math.sin(f * 0.5) * 0.05 * turM;
  // eyes closed while sensing the direction (lines 36–39), then open
  const eyesClosed = sstep(11278, 11350, f) * (1 - sstep(12700, 12780, f));
  applyBlink(refs.taraEyeL, refs.taraEyeR, f, 77, 135);
  if (eyesClosed > 0) {
    const bs = blinkScale(f, 77, 135);
    const s = lerp(bs, 0.12, eyesClosed);
    refs.taraEyeL.scale.y = s;
    refs.taraEyeR.scale.y = s;
  }

  // ---- flock ---------------------------------------------------------------
  const flockVisible = f < 1850 || f >= 14392; // keluar sebelum Lumo masuk (f1900)
  refs.flock.forEach((fl, i) => {
    const k = keyLerp(FLOCK_KEYS[i], f);
    fl.root.visible = flockVisible;
    fl.root.position.set(k.x, k.y, 0.2 - i * 0.35);
    fl.root.rotation.y = 0;
    fl.root.rotation.z = 0.03 * Math.sin(f * 0.09 + i * 1.4);
    fl.finFL.rotation.x = Math.sin(f * 0.12 + i) * 0.3;
    fl.finFR.rotation.x = -Math.sin(f * 0.12 + i + 0.6) * 0.3;
    fl.finBL.rotation.x = -Math.sin(f * 0.12 + i + 1.1) * 0.24;
    fl.finBR.rotation.x = Math.sin(f * 0.12 + i + 1.7) * 0.24;
    fl.headG.rotation.z = Math.sin(f * 0.08 + i * 2.0) * 0.05;
  });

  // ---- environment ---------------------------------------------------------
  // seaweed sway — wild in the strong current (line 2)
  const wild = line === 2 ? 1 : 0.25;
  refs.seaweed.forEach((b, i) => {
    const ph = b.userData.phase as number;
    b.rotation.z = Math.sin(f * 0.05 * (line === 2 ? 2.2 : 1) + ph) * 0.16 * wild;
  });

  // bubbles rising (loop, pure function of frame)
  refs.bubblesG.children.forEach((c, i) => {
    const speed = 0.012 + (i % 4) * 0.004;
    const y = -2.4 + (((f * speed + i * 0.53) % 1) * 5.6);
    c.position.set(-5.5 + (i % 7) * 1.7 + Math.sin(f * 0.02 + i) * 0.25, y, -0.5 + (i % 3) * 0.6);
    c.scale.setScalar(0.6 + ((i * 0.37) % 1) * 0.7);
  });

  // current streaks: strong + fast in line 2, calm in s5
  const strong = line === 2 ? 1 : 0;
  const calm = f >= 14392 ? 1 : 0;
  const curSpeed = lerp(0.035, 0.12, strong) * (1 - 0.7 * calm);
  const curOp = lerp(0.2, 0.45, strong) * (1 - 0.6 * calm);
  refs.currentG.children.forEach((c, i) => {
    c.position.x = -6 + (((f * curSpeed + i * 2.1) % 12));
    c.position.y = -1.4 + i * 0.85 + Math.sin(f * 0.01 + i) * 0.15;
    ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = curOp;
  });

  // ---- sunrise (s5) --------------------------------------------------------
  const sunUp = sstep(14392, 17200, f);
  refs.sunG.visible = f >= 14392;
  if (refs.sunG.visible) {
    refs.sunG.position.y = lerp(-1.2, 2.4, sunUp);
    (refs.sunMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffcf4d).lerp(new THREE.Color("#ff9a3c"), sunUp * 0.5);
    refs.sunGlow.scale.setScalar(1 + 0.15 * Math.sin(f * 0.05));
  }
  refs.raysGoldG.children.forEach((c) => {
    ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.09 * sstep(14392, 15000, f);
  });
  pulseSparkles(refs.sparkles, f, f >= 15000);

  // ---- camera: frame by true extents (landscape) ---------------------------
  const lumoIn = lu.x > -3.5;
  let left = ta.x - 1.0;
  let right = ta.x + 1.0;
  // Lumo: ekor sampai lokal −2,01, moncong sampai +1,95 → extent ±2,1
  if (lumoIn) { left = Math.min(left, lu.x - 2.1); right = Math.max(right, lu.x + 2.1); }
  if (flockVisible) {
    refs.flock.forEach((fl) => {
      const p = fl.root.position.x;
      left = Math.min(left, p - 0.6); right = Math.max(right, p + 0.6);
    });
  }
  if (refs.whale.visible && f >= 5683 && f <= 9213) {
    // s3 saja: paus masuk hitungan kamera; di s4/s5 ia latar jauh di kanan bawah
    const headX = wh.x - 2.9; // whale faces left (ry=π): head toward -x (extent asli 2,87 × skala)
    left = Math.min(left, headX - 0.6);
    right = Math.max(right, wh.x + 4.5); // ekor + cuping (lokal −2,55 × 1,35 + jari-jari cuping)
  }
  const midX = (left + right) / 2;
  const z = fitZLand(right - left, 1.2);
  const midY = (lu.y + ta.y) / 2;
  camera.position.set(midX * 0.85, midY + 0.25 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, midY - 0.15, 0);
}
