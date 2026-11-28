import * as THREE from "three";
import { HiuRefs } from "./world";
import {
  sstep, clamp01, keyLerp, lineAt, mouthVal, applyBlink,
  pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const FRAMES = timing.frames;
const st = (i: number) => LINES[i].f0;
const en = (i: number) => LINES[i].f1;

// Beats (6 giliran, dari NASKAH.md):
//  0  establishing — hiu abu-abu berenang di kiri, bintang laut jingga
//     menempel di karang kanan, jaring hanyut bergelombang di kejauhan
//  1  bintang laut menempel erat di karang menunjuk arah; hiu bersiap
//     berputar menghindar (antisipasi)
//  2  hiu berputar cepat — arus membelokkannya ke arah jaring;
//     gelembung berhamburan
//  3  hiu diam melayang gelisah di tengah; bintang laut mengangkat satu
//     lengan memberi isyarat tenang
//  4  hiu menengadah ke arah bintang laut; jaring hanyut makin mendekat
//     menutup jalan
//  5  bintang laut menempel tegak di karang sebagai penanda; hiu berputar
//     mengikuti lengannya, menjauh dari jaring — lolos; kilau penutup,
//     keduanya berdampingan di karang

// ATURAN KERAS (pelajaran 25-26 Nov): arah hadap SELALU searah gerak —
// setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; tokoh yang
// berbicara menghadap kamera/penonton (ry -pi/4 = 3/4 ke kamera), tidak
// pernah membelakangi kamera. Hiu menghadap +x pada ry=0.

const STAR_POS: [number, number, number] = [2.6, -0.85, 0.55]; // bintang laut di karang
const NET_HOME = 4.6;

// Loop vertikal line 5 (loop-the-loop, bukan putaran yaw): hiu berputar
// mengikuti lengan bintang laut dalam bidang layar (pitch), jadi ia TIDAK
// pernah menghadap kamera head-on. Pusat (-0.5, 0.8), r 0.7 — loop kecil
// di kiri supaya moncong tidak pernah menyapu bintang laut di karang kanan
// (v1: pusat (0, 0.7) r 0.85 — moncong menyentuh lengan bintang laut di
// f=860 dan ekor menyapu karang di f=890). Saat vertikal, moncong/ekor
// (±2.6) tetap di atas pasir (-2.2).
const LOOP_CX = -0.5, LOOP_CY = 0.8, LOOP_R = 0.7;
const W0 = st(5) + 40, W1 = en(5) - 80;

function sharkKeys() {
  return [
    { f: 0, x: -1.7, y: 0.3, ry: -0.35 },
    { f: en(0), x: -1.7, y: 0.3, ry: -0.35 },
    { f: st(1), x: -1.6, y: 0.25, ry: -0.3 },   // bersiap berputar
    { f: en(1), x: -1.5, y: 0.25, ry: -0.2 },
    { f: st(2), x: -1.4, y: 0.3, ry: -0.1 },    // mulai berputar
    { f: st(2) + 70, x: 0.6, y: 0.9, ry: -0.5 },// menyapu ke atas-kanan
    { f: en(2) - 40, x: 1.7, y: 0.9, ry: -0.2 },// arus membelokkan ke jaring (di ATAS bintang laut)
    { f: en(2), x: 1.4, y: 0.6, ry: -0.5 },     // tertahan, menarik diri
    { f: st(3), x: -0.3, y: 0.0, ry: -0.6 },    // melayang gelisah di tengah (jauh dari karang)
    { f: en(3), x: -0.4, y: -0.1, ry: -0.6 },
    { f: st(4), x: 0.3, y: -0.1, ry: -0.7 },    // menengadah ke bintang laut
    { f: en(4), x: 0.3, y: 0.0, ry: -0.8 },
    { f: st(5), x: 0.4, y: 0.0, ry: -0.7 },
    { f: W0, x: LOOP_CX - LOOP_R, y: LOOP_CY, ry: -0.5 }, // masuk loop
    { f: W1, x: LOOP_CX - LOOP_R, y: LOOP_CY, ry: -0.5 }, // keluar loop (masih tinggi)
    { f: en(5) - 50, x: -0.6, y: 0.5, ry: -0.5 }, // merata dulu, baru turun
    { f: FRAMES, x: -0.3, y: -0.6, ry: -Math.PI / 4 }, // penutup: hadap kamera
  ];
}

function netKeys() {
  return [
    { f: 0, x: NET_HOME, y: 0.7 },
    { f: en(1), x: NET_HOME, y: 0.7 },
    { f: st(2), x: 4.2, y: 0.6 },
    { f: en(2), x: 3.9, y: 0.5 },
    { f: en(3), x: 3.6, y: 0.5 },   // jaring makin mendekat
    { f: en(4), x: 3.3, y: 0.4 },   // menutup jalan
    { f: st(5) + 100, x: 3.8, y: 0.5 },
    { f: FRAMES, x: 4.8, y: 0.7 },  // menjauh lagi sesudah hiu lolos
  ];
}

export function poseFrame(frame: number, refs: HiuRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const sharkM = mouthVal(MOUTH, "shark", f);
  const starM = mouthVal(MOUTH, "starfish", f);

  // ---- hiu ----------------------------------------------------------------
  const sh0 = keyLerp(sharkKeys(), f);
  const turning2 = sstep(st(2), st(2) + 60, f) * (1 - sstep(en(2) - 30, en(2), f));
  // loop vertikal line 5: posisi di lingkaran + pitch mengikuti tangen
  const loopU = sstep(W0, W1, f);
  const loopBlend = sstep(W0, W0 + 8, f) * (1 - sstep(W1 - 8, W1, f));
  const loopActive = sstep(W0, W0 + 20, f) * (1 - sstep(W1 - 20, W1, f));
  const th = Math.PI - 2 * Math.PI * loopU;
  const circleX = LOOP_CX + LOOP_R * Math.cos(th);
  const circleY = LOOP_CY + LOOP_R * Math.sin(th);
  const sh = {
    x: sh0.x + (circleX - sh0.x) * loopBlend,
    y: sh0.y + (circleY - sh0.y) * loopBlend,
    ry: sh0.ry,
  };
  // pitch loop: menanjak masuk (st(5)->W0), satu putaran penuh (W0->W1),
  // merata keluar CEPAT selagi masih tinggi (W1->en(5)-50) supaya ekor
  // tidak pernah menyentuh pasir, baru meluncur turun ke penutup.
  let loopPitch = 0;
  if (f < W0) loopPitch = sstep(st(5), W0, f) * (Math.PI / 2);
  else if (f <= W1) loopPitch = Math.PI / 2 - 2 * Math.PI * loopU;
  else loopPitch = -3 * Math.PI / 2 + (-2 * Math.PI + 3 * Math.PI / 2) * sstep(W1, en(5) - 50, f);
  const turnBoost = Math.max(turning2, loopActive);
  // antisipasi: memendek (squash) sesaat sebelum tiap putaran cepat
  const antic1 = sstep(en(1) - 45, en(1) - 5, f) * (1 - sstep(st(2), st(2) + 25, f));
  const antic2 = sstep(en(4) - 30, en(4), f) * (1 - sstep(st(5), st(5) + 25, f));
  const antic = Math.max(antic1, antic2);
  const stretch = 0.07 * turnBoost;
  // gelisah (line 3) / menengadah (line 4)
  const anxious = sstep(st(3), st(3) + 40, f) * (1 - sstep(en(3) - 30, en(3), f));
  const lookUp = sstep(st(4), st(4) + 40, f) * (1 - sstep(st(5), st(5) + 30, f));
  const swim = Math.sin(f * 0.09);

  refs.shark.position.set(sh.x, sh.y + Math.sin(f * 0.07) * 0.05, -0.3);
  refs.shark.rotation.y = sh.ry;
  // badan: undulasi renang + banking saat berputar + pitch loop vertikal
  // line 5 + squash antisipasi
  refs.sharkBodyG.rotation.z = swim * 0.05 - 0.1 * anxious + 0.12 * lookUp + loopPitch;
  refs.sharkBodyG.rotation.x = 0.35 * turning2;
  refs.sharkBodyG.position.y = Math.sin(f * 0.07) * 0.04;
  refs.sharkBodyG.scale.set(
    1 + 0.05 * antic + stretch,
    1 - 0.04 * antic - 0.03 * turnBoost,
    1,
  );
  // ekor bulan sabit: follow-through — menyusul gerak badan, mengibas cepat
  // saat berputar, pelan saat melayang gelisah
  const tailAmp = 0.22 + 0.25 * turnBoost - 0.08 * anxious;
  refs.sharkTailG.rotation.y = Math.sin(f * 0.09 - 0.9) * tailAmp;
  refs.sharkTailG.rotation.z = Math.sin(f * 0.07) * 0.05;
  // sirip: mendayung pelan; terkulai saat gelisah
  const finDroop = 0.35 * anxious;
  refs.sharkFinL.rotation.x = -finDroop + Math.sin(f * 0.08) * 0.08;
  refs.sharkFinR.rotation.x = finDroop - Math.sin(f * 0.08) * 0.08;
  refs.sharkFinL.rotation.z = 0.1 * turnBoost;
  refs.sharkFinR.rotation.z = -0.1 * turnBoost;
  // sirip punggung: miring mengikuti banking
  refs.sharkDorsalG.rotation.z = -0.2 * turning2;
  // rahang + kepala: mengangguk saat bicara; menengadah di line 4
  refs.sharkJawG.rotation.z = -sharkM * 0.4;
  refs.sharkHeadG.rotation.z = Math.sin(f * 0.45) * 0.03 * sharkM
    + 0.3 * lookUp - 0.08 * anxious;
  applyBlink(refs.sharkEyeL, refs.sharkEyeR, f, 60, 140);

  // ---- bintang laut ---------------------------------------------------------
  // menempel di karang; tidak pernah membeku: goyangan halus + lengan hidup
  const point1 = sstep(st(1), st(1) + 30, f) * (1 - sstep(en(1) - 20, en(1), f));
  const calm = sstep(st(3), st(3) + 30, f) * (1 - sstep(en(3) - 20, en(3), f));
  const marker = sstep(st(5), st(5) + 40, f); // tegak sebagai penanda
  const lean = 0.12 * point1 + 0.06 * calm;
  refs.starfish.position.set(STAR_POS[0], STAR_POS[1] + 0.08 * marker + Math.sin(f * 0.06) * 0.02, STAR_POS[2]);
  refs.starfish.rotation.y = -0.15 * point1; // sedikit menghadap hiu
  refs.starBodyG.rotation.z = lean - 0.1 * marker + Math.sin(f * 0.05) * 0.03;
  refs.starBodyG.position.y = Math.sin(f * 0.06 + 1) * 0.02;
  // lengan 1 (atas-kiri, mengarah ke hiu) menunjuk di line 1, melambai
  // tenang di line 3, terentang tegak sebagai penanda di line 5
  refs.starArms.forEach((arm, i) => {
    const base = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    let rot = base + Math.sin(f * 0.06 + i * 1.3) * 0.04;
    if (i === 1) {
      rot += -0.25 * point1 + 0.12 * calm * Math.sin(f * 0.12) + 0.1 * marker;
    }
    if (i === 0) {
      rot += 0.12 * marker; // lengan atas terentang ke atas sebagai penanda
    }
    arm.rotation.z = rot;
    const ext = i === 1 ? 1 + 0.12 * point1 + 0.08 * marker : i === 0 ? 1 + 0.1 * marker : 1;
    arm.scale.setScalar(ext);
  });
  // mulut kecil membuka saat bicara + anggukan kecil
  refs.starMouth.scale.set(1 + 0.4 * starM, 0.7 + 0.6 * starM, 0.4);
  refs.starBodyG.rotation.x = Math.sin(f * 0.5) * 0.03 * starM;
  applyBlink(refs.starEyeL, refs.starEyeR, f, 33, 130);

  // ---- jaring hanyut ---------------------------------------------------------
  const net = keyLerp(netKeys(), f);
  refs.netG.position.set(net.x, net.y + Math.sin(f * 0.04) * 0.12, -2.2);
  refs.netG.rotation.y = -0.25 + Math.sin(f * 0.03) * 0.06;
  refs.netG.rotation.z = Math.sin(f * 0.05) * 0.06;

  // ---- gelembung pecah (putaran cepat line 2) --------------------------------
  const burst = sstep(st(2) + 40, st(2) + 70, f) * (1 - sstep(en(2) - 60, en(2) - 20, f));
  refs.burstG.visible = burst > 0.01;
  if (refs.burstG.visible) {
    const bx = sh.x - 1.6 * Math.cos(sh.ry);
    const by = sh.y + 0.2;
    refs.burstG.children.forEach((c, i) => {
      const t = clamp01(burst + (i % 5) * 0.12 - 0.1);
      const a = i * 1.9;
      c.position.set(
        bx + Math.cos(a) * (0.3 + t * 1.1),
        by + Math.sin(a) * (0.2 + t * 0.8) + t * 0.9,
        -0.3 + Math.sin(i * 2.3) * 0.3,
      );
      c.scale.setScalar(Math.max(0.01, 0.5 + t * 0.9));
    });
  }

  // ---- gelembung ambien naik (loop, murni fungsi frame) ----------------------
  refs.bubblesG.children.forEach((c, i) => {
    const speed = 0.012 + (i % 4) * 0.004;
    const y = -2.0 + (((f * speed + i * 0.53) % 1) * 5.2);
    c.position.set(-3.5 + (i % 6) * 1.3 + Math.sin(f * 0.02 + i) * 0.25, y, -0.5 + (i % 3) * 0.6);
    c.scale.setScalar(0.6 + ((i * 0.37) % 1) * 0.7);
  });

  // ---- rumput laut bergoyang --------------------------------------------------
  refs.seaweed.forEach((b) => {
    const ph = b.userData.phase as number;
    b.rotation.z = Math.sin(f * 0.05 + ph) * 0.14;
  });

  // ---- cahaya menembus air: meredup saat jaring menutup (line 4), pulih line 5
  const dim = 1 - 0.4 * sstep(st(4), st(4) + 40, f) * (1 - sstep(st(5), st(5) + 60, f));
  const bright = 0.02 * sstep(st(5), st(5) + 60, f);
  refs.rays.forEach((r) => {
    ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.07 * dim + bright;
    r.rotation.z = 0.25 + Math.sin(f * 0.02) * 0.02;
  });

  pulseSparkles(refs.sparkles, f, line === 5 && f >= st(5) + 30);

  // ---- kamera: bingkai dari rentang sebenarnya --------------------------------
  // hiu skala 1.0: moncong +2.7, ekor -2.8 relatif akar (sepanjang arah hadap)
  const headX = sh.x + 2.7 * Math.cos(sh.ry);
  const tailX = sh.x - 2.8 * Math.cos(sh.ry);
  const starR = STAR_POS[0] + 1.0;
  const netNear = net.x < 4.2 ? net.x - 1.4 : Infinity;
  let left = Math.min(headX, tailX, STAR_POS[0] - 1.0);
  let right = Math.max(headX, tailX, starR, netNear === Infinity ? -Infinity : netNear + 0.4);
  // loop vertikal: rentang horizontal hiu membesar (±2.6 dari pusat loop)
  left = left + (Math.min(left, -3.0) - left) * loopBlend;
  right = right + (Math.max(right, 2.7) - right) * loopBlend;
  const { mid: midX, z } = frameExtent(left, right, 1.2);
  const midY = (sh.y + STAR_POS[1]) / 2 + 0.35;
  camera.position.set(midX * 0.85, midY + 0.3 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, midY - 0.2, 0);
}
