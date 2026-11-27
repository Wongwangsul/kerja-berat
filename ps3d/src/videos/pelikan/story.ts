import * as THREE from "three";
import { PelikanRefs } from "./world";
import {
  sstep, lerp, clamp01, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const L = (i: number) => LINES[i];
const END = timing.frames;

// Beats (giliran bicara, dari timing.json — semua batas keyframe diturunkan
// dari LINES supaya tabel ikut bergeser bila timing.json asli menggantikannya):
//  0  establishing: pelikan putih besar di tepi kiri mengangkat paruh bangga;
//     gagak hitam di dahan kanan atas menoleh ke arah pelikan
//  1  gagak terbang mengitari danau mengintai dari atas; pelikan bersiap
//     di tepi, paruh terbuka (antisipasi: jongkok dulu)
//  2  pelikan menyelam dengan paruh terbuka — cipratan air — lalu muncul
//     dengan paruh kosong; ikan-ikan kecil berhamburan ke segala arah
//  3  pelikan diam menunduk lesu di tepi; gagak hinggap di dahan, mengangkat
//     sayap memberi isyarat tenang
//  4  pelikan menengadah ke arah gagak; di bawah permukaan, gerombolan ikan
//     berkumpul lagi berkilau
//  5  gagak berkaok dua kali dari atas menunjuk arah; pelikan menyelam
//     diam-diam — paruh muncul penuh ikan; kilau penutup, keduanya
//     berdampingan di tepi

// ATURAN KERAS (pelajaran 25–26 Nov): arah hadap SELALU searah gerak —
// setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target interaksi
// dijangkau KEPALA, bukan badan yang menembus; tokoh yang berbicara menghadap
// kamera/penonton (ry -π/4 = 3/4 ke kamera), tidak pernah membelakangi kamera.
// Pelikan menghadap +x pada ry=0; gagak menghadap +x pada ry=0.

const PERCH: [number, number, number] = [3.9, 3.3, -0.5]; // gagak di dahan
const PERCH_RY = -Math.PI + 0.38;                          // menghadap pelikan/kamera
const PEL_HOME: [number, number] = [-2.0, 0.6];            // pelikan di tepi
const DIVE_PT: [number, number] = [-1.3, 1.2];             // titik menyelam
const SCHOOL: [number, number] = [0.9, 2.0];               // gerombolan ikan
const CLOSE_SPOT: [number, number] = [-0.2, 1.6];          // gagak mendarat di tepi, di kanan pelikan

function tri(f: number, c: number, w: number): number {
  if (f < c - w || f > c + w) return 0;
  return 1 - Math.abs(f - c) / w;
}

/** Kunci terbang sepanjang elips (x,z) di ketinggian cy; ry = arah gerak,
 *  di-unwrap supaya tidak berputar penuh saat menyilang ±π. */
function flyKeys(f0: number, f1: number, n: number,
  cx: number, cy: number, cz: number, rx: number, rz: number,
  a0: number, a1: number) {
  const keys: { f: number; x: number; y: number; z: number; ry: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = lerp(a0, a1, u);
    const vx = -rx * Math.sin(a);
    const vz = rz * Math.cos(a);
    keys.push({
      f: Math.round(lerp(f0, f1, u)),
      x: cx + rx * Math.cos(a),
      y: cy + Math.sin(a * 2) * 0.25,
      z: cz + rz * Math.sin(a),
      ry: Math.atan2(-vz, vx),
    });
  }
  for (let i = 1; i < keys.length; i++) {
    while (keys[i].ry - keys[i - 1].ry > Math.PI) keys[i].ry -= 2 * Math.PI;
    while (keys[i].ry - keys[i - 1].ry < -Math.PI) keys[i].ry += 2 * Math.PI;
  }
  return keys;
}

export function poseFrame(frame: number, refs: PelikanRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const pelM = mouthVal(MOUTH, "pelican", f);
  const croM = mouthVal(MOUTH, "crow", f);

  // ---- jendela aksi (diturunkan dari LINES) -------------------------------
  const D1a = L(2).f0 + 20, D1b = L(2).f0 + 55, D1c = L(2).f0 + 95, D1d = L(2).f0 + 140;
  const D2a = L(5).f0 + 90, D2b = L(5).f0 + 120, D2c = L(5).f0 + 150, D2d = L(5).f0 + 195;
  const CAW1 = L(5).f0 + 30, CAW2 = L(5).f0 + 65;

  // ---- pelikan -------------------------------------------------------------
  const PEL_KEYS = [
    { f: 0, x: PEL_HOME[0], z: PEL_HOME[1], ry: -Math.PI / 4 },
    { f: L(1).f0, x: PEL_HOME[0], z: PEL_HOME[1], ry: -Math.PI / 4 },
    { f: L(1).f1, x: PEL_HOME[0], z: PEL_HOME[1], ry: 0 },   // putar → hadap air
    { f: L(3).f0, x: PEL_HOME[0], z: PEL_HOME[1], ry: 0 },
    { f: L(3).f0 + 30, x: PEL_HOME[0], z: PEL_HOME[1], ry: -Math.PI / 4 }, // putar → kamera
    { f: L(5).f0, x: PEL_HOME[0], z: PEL_HOME[1], ry: -Math.PI / 4 },
    { f: L(5).f0 + 20, x: PEL_HOME[0], z: PEL_HOME[1], ry: 0 }, // putar → hadap air
    { f: L(5).f1, x: PEL_HOME[0], z: PEL_HOME[1], ry: 0 },
    { f: END, x: PEL_HOME[0], z: PEL_HOME[1], ry: -Math.PI / 4 },
  ];
  const pel = keyLerp(PEL_KEYS, f);

  // selaman 1 (gagal, ikan kabur) dan selaman 2 (diam-diam, berhasil)
  const dive1Fwd = sstep(D1a, D1a + 25, f) * (1 - sstep(D1c, D1d, f));
  const dive1Down = sstep(D1a + 10, D1b, f) * (1 - sstep(D1b + 5, D1c, f));
  const dive2Fwd = sstep(D2a, D2a + 25, f) * (1 - sstep(D2c, D2d, f));
  const dive2Down = sstep(D2a + 10, D2b, f) * (1 - sstep(D2b + 5, D2c, f));
  const diveFwd = Math.max(dive1Fwd, dive2Fwd);
  const diveDown = Math.max(dive1Down, dive2Down);
  // antisipasi: jongkok (squash) sesaat sebelum tiap selaman
  const crouch1 = sstep(D1a - 20, D1a, f) * (1 - sstep(D1a, D1a + 15, f));
  const crouch2 = sstep(D2a - 20, D2a, f) * (1 - sstep(D2a, D2a + 15, f));
  const crouch = Math.max(crouch1, crouch2);
  // bangga (line 0) / lesu (line 3) / menengadah (line 4) / gembira (line 5)
  const proud = sstep(10, 50, f) * (1 - sstep(L(1).f0, L(1).f0 + 30, f));
  const droop = sstep(L(3).f0 + 10, L(3).f0 + 45, f) * (1 - sstep(L(3).f1 - 25, L(3).f1, f));
  const lookUp = sstep(L(4).f0 + 10, L(4).f0 + 40, f) * (1 - sstep(L(5).f0, L(5).f0 + 15, f));
  // menunduk mengawasi air sambil menunggu aba-aba (line 5 sebelum menyelam)
  const watch = sstep(L(5).f0 + 10, L(5).f0 + 40, f) * (1 - sstep(D2a, D2a + 20, f));
  const happy = sstep(D2c, D2c + 30, f);
  // muncul paruh kosong: geleng kecil + kantong terbuka lebar
  const emptyShake = sstep(D1c, D1c + 15, f) * (1 - sstep(D1c + 45, D1c + 70, f));
  const breathe = Math.sin(f * 0.07) * 0.02;

  const pelX = lerp(pel.x, DIVE_PT[0], diveFwd);
  const pelZ = lerp(pel.z, DIVE_PT[1], diveFwd);
  refs.pelican.position.set(pelX, -0.35 * diveDown, pelZ);
  refs.pelican.rotation.y = pel.ry;
  // badan: menukik ke depan saat menyelam, jongkok sebelum menyelam
  refs.pelicanBodyG.rotation.z = -0.5 * diveDown - 0.06 * droop + 0.04 * happy;
  refs.pelicanBodyG.rotation.y = Math.sin(f * 0.03) * 0.03 * (1 - diveDown);
  refs.pelicanBodyG.position.y = 1.02 - 0.12 * crouch + breathe * (1 - diveDown);
  refs.pelicanBodyG.scale.set(
    1 + 0.06 * crouch,
    1 - 0.12 * crouch + 0.05 * diveDown,
    1,
  );
  // sayap: terkembang saat menyelam, terkulai lesu di line 3, follow-through
  const wingOut = 0.5 * diveFwd + 0.12 * happy;
  const wingLag = Math.sin(f * 0.3) * 0.08 * diveFwd;
  refs.pelicanWingL.rotation.x = 0.1 + wingOut + wingLag + 0.25 * droop;
  refs.pelicanWingR.rotation.x = -0.1 - wingOut - wingLag - 0.25 * droop;
  refs.pelicanWingL.rotation.z = -0.1 * diveDown;
  refs.pelicanWingR.rotation.z = 0.1 * diveDown;
  // kaki: menendang pelan saat menyelam, melangkah kecil saat kembali
  const kick = diveFwd > 0.02 ? Math.sin(f * 0.6) * 0.3 * diveFwd : 0;
  refs.pelicanFootL.rotation.z = kick + 0.3 * happy * Math.sin(f * 0.4);
  refs.pelicanFootR.rotation.z = -kick - 0.3 * happy * Math.sin(f * 0.4);
  // ekor: follow-through — menyusul gerak badan, berkibar saat menyelam
  refs.pelicanTailG.rotation.z = 0.4 * diveFwd + Math.sin(f * 0.12) * 0.08;
  refs.pelicanTailG.rotation.y = Math.sin(f * 0.1) * 0.15;
  // leher + kepala: bangga ke atas (line 0), menukik (menyelam),
  // menunduk lesu (line 3), menengadah ke gagak (line 4)
  const nod = Math.sin((f - (L(0).f0 + 15)) * 0.22) * 0.06
    * sstep(L(0).f0 + 15, L(0).f0 + 45, f) * (1 - sstep(L(0).f1 - 20, L(0).f1, f));
  const shakeY = Math.sin(f * 0.7) * 0.12 * emptyShake;
  refs.pelicanNeckG.rotation.z = 0.1 * proud - 0.2 * droop - 0.4 * diveDown + 0.09 * lookUp - 0.2 * watch;
  refs.pelicanHeadG.rotation.z = nod + 0.12 * proud - 0.9 * diveDown - 0.35 * droop
    + 0.09 * lookUp - 0.45 * watch + 0.12 * happy + Math.sin(f * 0.5) * 0.05 * pelM;
  refs.pelicanHeadG.rotation.y = shakeY - 0.25 * lookUp;
  refs.pelicanHeadG.rotation.x = 0.12 * droop;
  // ikan hasil tangkapan muncul di kantong sesudah selaman 2 berhasil
  const caught = sstep(D2c, D2c + 10, f);
  refs.pelicanPouchG.rotation.z = -pelM * 0.45 - 0.5 * emptyShake
    + 0.35 * diveDown - 0.3 * caught;
  applyBlink(refs.pelicanEyeL, refs.pelicanEyeR, f, 60, 120);
  refs.catchFish.visible = caught > 0.5;

  // ---- gagak ---------------------------------------------------------------
  // putaran penuh mengitari danau (line 1): lepas landas dari dahan,
  // mengintai di atas air, kembali hinggap — jendela 25 frame di tiap ujung
  // supaya putaran lepas/ hinggap tidak menyentak. Elips rendah di atas
  // gerombolan ikan (pusat x 2.9, tinggi 2.0): puncak kepala gagak (2.0+1.8)
  // tetap di bawah garis paruh pelikan (y≈4.0), dan tidak pernah melintas
  // di depan/di atas pelikan.
  const fly1 = flyKeys(L(1).f0 + 25, L(1).f1 - 25, 12,
    2.9, 2.0, 1.2, 1.4, 1.5, -0.5, 2 * Math.PI - 0.5);
  // hover di atas gerombolan ikan (line 5), lalu turun ke tepi:
  // hover tinggi di kiri-atas gerombolan, menghadap kamera, jauh dari ujung
  // dahan maupun ujung paruh pelikan di ruang layar
  const HOVER: [number, number, number] = [SCHOOL[0] + 0.6, 4.0, SCHOOL[1] + 0.2];
  const CROW_KEYS = [
    { f: 0, x: PERCH[0], y: PERCH[1], z: PERCH[2], ry: PERCH_RY },
    { f: L(1).f0, x: PERCH[0], y: PERCH[1], z: PERCH[2], ry: PERCH_RY },
    ...fly1,
    { f: L(1).f1, x: PERCH[0], y: PERCH[1], z: PERCH[2], ry: PERCH_RY },
    { f: L(5).f0, x: PERCH[0], y: PERCH[1], z: PERCH[2], ry: PERCH_RY },
    { f: L(5).f0 + 15, x: 2.6, y: 3.6, z: 1.0, ry: -Math.PI / 2 }, // lepas landas
    { f: CAW1 - 5, x: HOVER[0], y: HOVER[1], z: HOVER[2], ry: -Math.PI / 4 }, // hover, hadap kamera
    { f: CAW2 + 20, x: HOVER[0], y: HOVER[1], z: HOVER[2], ry: -Math.PI / 4 },
    { f: D2d - 10, x: CLOSE_SPOT[0], y: 0, z: CLOSE_SPOT[1], ry: -Math.PI * 0.75 }, // mendarat menghadap pelikan
    { f: END, x: CLOSE_SPOT[0], y: 0, z: CLOSE_SPOT[1], ry: -Math.PI * 0.75 },
  ];
  const cro = keyLerp(CROW_KEYS, f);
  const flying = sstep(L(1).f0 + 5, L(1).f0 + 30, f) * (1 - sstep(L(1).f1 - 30, L(1).f1 - 5, f))
    + sstep(L(5).f0 + 5, L(5).f0 + 25, f) * (1 - sstep(D2d - 30, D2d - 10, f));
  const fly = clamp01(flying);
  // kaok dua kali: denyut kepala + paruh terbuka
  const caw = Math.max(tri(f, CAW1, 12), tri(f, CAW2, 12));
  const hovering = sstep(CAW1 - 10, CAW1, f) * (1 - sstep(CAW2 + 25, CAW2 + 45, f));
  // isyarat tenang di dahan (line 3): sayap terangkat
  const reassure = sstep(L(3).f0 + 10, L(3).f0 + 40, f) * (1 - sstep(L(3).f1 - 20, L(3).f1, f));
  // menoleh ke pelikan saat bicara; mengangguk kecil saat memberi aba-aba
  const headTurn = Math.sin(f * 0.04 + 1.2) * 0.3 * (1 - fly);
  const bob = Math.sin(f * 0.35) * 0.08 * hovering;

  refs.crow.position.set(cro.x, cro.y + Math.sin(f * 0.18) * 0.05 * fly, cro.z);
  refs.crow.rotation.y = cro.ry;
  // badan: menukik pelan saat terbang, tegak saat hinggap
  refs.crowBodyG.rotation.z = -0.25 * fly + 0.05 * hovering;
  refs.crowBodyG.position.y = 0.55 + Math.sin(f * 0.09) * 0.02 * (1 - fly);
  // sayap: kepak saat terbang, terangkat saat memberi isyarat, terlipat saat hinggap
  const flap = fly > 0.02 ? (0.45 + 0.45 * Math.sin(f * 0.55)) * fly : 0;
  const point = hovering; // sayap menunjuk arah ikan saat hover
  refs.crowWingL.rotation.x = 0.08 + flap + 0.9 * reassure + 0.7 * point;
  refs.crowWingR.rotation.x = -0.08 - flap - 0.9 * reassure - 0.2 * point;
  refs.crowWingL.rotation.z = -0.15 * fly;
  refs.crowWingR.rotation.z = 0.15 * fly;
  // ekor: follow-through — menyusul gerak badan, mengembang saat terbang
  refs.crowTailG.rotation.z = 0.3 * fly + Math.sin(f * 0.12) * 0.08;
  refs.crowTailG.rotation.y = Math.sin(f * 0.1) * 0.15;
  // kaki: terlipat saat terbang, menapak saat hinggap/mendarat
  refs.crowFootL.rotation.z = 0.6 * fly;
  refs.crowFootR.rotation.z = 0.6 * fly;
  // kepala: menoleh, mengangguk saat kaok, menunduk menunjuk ikan saat hover
  refs.crowHeadG.rotation.z = 0.25 * caw - 0.4 * point + bob
    + Math.sin(f * 0.5) * 0.05 * croM;
  refs.crowHeadG.rotation.y = headTurn - 0.2 * hovering;
  refs.crowHeadG.rotation.x = 0.15 * point;
  refs.crowBeakLowG.rotation.z = -croM * 0.5 - 0.5 * caw;
  applyBlink(refs.crowEyeL, refs.crowEyeR, f, 95, 130);

  // ---- ikan -----------------------------------------------------------------
  // berhamburan saat selaman 1, berkumpul lagi + berkilau di line 4
  const scatter = sstep(D1b, D1b + 15, f) * (1 - sstep(L(4).f0, L(4).f0 + 40, f));
  const regroup = sstep(L(4).f0 + 10, L(4).f0 + 45, f);
  refs.fish.forEach((fg, i) => {
    const ph = fg.userData.phase as number;
    const bx = fg.userData.bx as number;
    const bz = fg.userData.bz as number;
    const by = fg.userData.by as number;
    const dx = bx - SCHOOL[0];
    const dz = bz - SCHOOL[1];
    const spread = 1 + 2.0 * scatter - 0.45 * regroup;
    const wigX = Math.sin(f * 0.05 + ph) * 0.15;
    const wigZ = Math.cos(f * 0.04 + ph) * 0.12;
    const caughtFish = i === 0 && caught > 0.5;
    fg.visible = !caughtFish;
    fg.position.set(
      SCHOOL[0] + dx * spread + wigX,
      by + Math.sin(f * 0.08 + ph) * 0.03 - 0.05 * scatter,
      SCHOOL[1] + dz * spread + wigZ,
    );
    fg.rotation.y = (fg.userData.ry as number) + Math.sin(f * 0.03 + ph) * 0.2;
    const shimmer = 1 + 0.15 * Math.sin(f * 0.3 + ph) * regroup;
    fg.scale.setScalar(Math.max(0.01, shimmer));
    refs.fishTailGs[i].rotation.y = Math.sin(f * 0.4 + ph) * (0.35 + 0.3 * scatter);
  });

  // ---- cipratan ---------------------------------------------------------------
  const splash1 = sstep(D1b - 8, D1b + 2, f) * (1 - sstep(D1b + 25, D1b + 55, f));
  const splash2 = sstep(D2b - 8, D2b + 2, f) * (1 - sstep(D2b + 20, D2b + 45, f));
  const splash = Math.max(splash1, splash2 * 0.6); // selaman 2 lebih tenang
  refs.splashG.visible = splash > 0.01;
  if (refs.splashG.visible) {
    const u = clamp01(splash);
    refs.splashRing.scale.setScalar(0.6 + 1.4 * u);
    (refs.splashRing.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - u * 0.7);
    refs.splashDrops.forEach((d) => {
      const h = d.userData.h as number;
      const a = d.userData.a as number;
      d.position.set(Math.cos(a) * (0.45 + u * 0.5), h * 4 * u * (1 - u) + 0.1, Math.sin(a) * (0.45 + u * 0.5));
      d.scale.setScalar(Math.max(0.01, 1 - u * 0.5));
    });
  }

  // ---- lingkungan ---------------------------------------------------------
  driftClouds(refs.clouds, f);
  pulseSparkles(refs.sparkles, f, line === 5 && f >= D2c);

  // ---- kamera: bingkai dari rentang sebenarnya, bergeser mengikuti cerita --
  // ujung paruh pelikan ≈ 3.8 satuan di depan akar (skala 1.6), ekor ≈ 1.6
  // di belakang; arah hadap (ry) ikut dihitung supaya paruh tidak terpotong
  const fwdX = Math.cos(pel.ry);
  const pelHeadX = pelX + 3.8 * fwdX;
  const pelTailX = pelX - 1.6 * fwdX;
  const croX = cro.x;
  // awal: pelikan + dahan/gagak; line 4–5: pelikan + gerombolan ikan + gagak hover;
  // penutup: pasangan di tepi
  const toSchool = sstep(L(4).f0, L(5).f0 + 40, f);
  const toClose = sstep(L(5).f1 - 60, L(5).f1, f);
  const left = lerp(
    lerp(Math.min(pelTailX, croX - 0.7, -3.4), Math.min(pelTailX, SCHOOL[0] - 1.4), toSchool),
    Math.min(pelTailX, CLOSE_SPOT[0] - 0.7),
    toClose,
  );
  const right = lerp(
    lerp(Math.max(pelHeadX, croX + 0.7, PERCH[0] + 0.6), Math.max(pelHeadX, SCHOOL[0] + 1.4, croX + 0.7), toSchool),
    Math.max(pelHeadX, CLOSE_SPOT[0] + 0.7),
    toClose,
  );
  const { mid: midX, z } = frameExtent(left, right, 1.0);
  const midY = 1.9;
  camera.position.set(midX * 0.97, midY + 0.5 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.98, midY - 0.5, 0);
}
