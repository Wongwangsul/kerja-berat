import * as THREE from "three";
import { JerapahRefs } from "./world";
import {
  sstep, lerp, clamp01, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, swayFlowers, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const L = (i: number) => LINES[i];
const END = timing.frames;

// Beats (giliran bicara, dari timing.json):
//  0  establishing: sabana pagi, akasia tinggi; jerapah bangga mengangkat
//     leher di kiri, kanguru di kanan bawah menengadah
//  1  kanguru melompat-lompat mengintai daun tertinggi; jerapah bersiap
//     meregangkan leher (antisipasi: jongkok dulu)
//  2  jerapah meregang ke atas — ranting patah — daun berserakan;
//     jerapah menunduk lesu
//  3  jerapah diam menunduk di bawah pohon; kanguru mendekat, mengangkat
//     kaki depan memberi isyarat tenang
//  4  jerapah menengadah ke arah kanguru; teman-teman menunggu di bawah
//  5  kanguru melompat tinggi, jerapah menangkap daun di udara — daun
//     terbagi ke teman-teman; kilau penutup, keduanya berdampingan

// ATURAN KERAS (pelajaran 25–26 Nov): arah hadap SELALU searah gerak —
// setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target interaksi
// dijangkau KEPALA, bukan badan yang menembus; tokoh yang berbicara menghadap
// kamera/penonton (ry -π/4 = 3/4 ke kamera untuk hewan menghadap +x),
// tidak pernah membelakangi kamera.
// Jerapah menghadap +x pada ry=0; kanguru menghadap +x pada ry=0
// (jadi menghadap jerapah = ry π, 3/4 ke kamera = ry 5π/4).

const GIR_HOME: [number, number] = [-2.4, 0.4];
const ROO_HOME: [number, number] = [1.7, 1.3];
const BREAK_F = L(2).f0 + 90; // ranting patah, tengah giliran 2
const CATCH_F = L(5).f0 + 120; // jerapah menangkap daun di udara

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

function tri(f: number, c: number, w: number): number {
  if (f < c - w || f > c + w) return 0;
  return 1 - Math.abs(f - c) / w;
}

export function poseFrame(frame: number, refs: JerapahRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const girM = mouthVal(MOUTH, "giraffe", f);
  const rooM = mouthVal(MOUTH, "kangaroo", f);

  // ---- jerapah -------------------------------------------------------------
  const GIR_KEYS = [
    { f: 0, x: GIR_HOME[0], z: GIR_HOME[1], ry: -Math.PI / 4 },
    { f: L(1).f0, x: GIR_HOME[0], z: GIR_HOME[1], ry: -Math.PI / 4 },
    { f: L(1).f1, x: GIR_HOME[0], z: GIR_HOME[1], ry: 0 }, // putar → hadap pohon
    { f: L(2).f1, x: GIR_HOME[0], z: GIR_HOME[1], ry: 0 },
    { f: L(3).f0 + 30, x: GIR_HOME[0], z: GIR_HOME[1], ry: -Math.PI / 4 }, // putar → kamera
    { f: L(5).f0, x: GIR_HOME[0], z: GIR_HOME[1], ry: -Math.PI / 4 },
    { f: END, x: GIR_HOME[0], z: GIR_HOME[1], ry: -Math.PI / 4 },
  ];
  const gir = keyLerp(GIR_KEYS, f);

  // meregang (line 2): antisipasi jongkok dulu, lalu leher memanjang ke atas
  const crouch = sstep(L(2).f0 - 25, L(2).f0, f) * (1 - sstep(L(2).f0, L(2).f0 + 20, f));
  const stretch = sstep(L(2).f0 + 15, L(2).f0 + 70, f)
    * (1 - sstep(BREAK_F, BREAK_F + 25, f));
  // lesu sesudah ranting patah (sisa line 2 + line 3), pulih di line 4
  const droop = sstep(BREAK_F + 10, BREAK_F + 50, f) * (1 - sstep(L(4).f0, L(4).f0 + 40, f));
  // bangga (line 0) / menengadah ke kanguru (line 4) / gembira (penutup)
  const proud = sstep(10, 50, f) * (1 - sstep(L(1).f0, L(1).f0 + 30, f));
  const lookUp = sstep(L(4).f0 + 10, L(4).f0 + 40, f) * (1 - sstep(L(5).f0, L(5).f0 + 15, f));
  const happy = sstep(CATCH_F + 10, CATCH_F + 50, f);
  const breathe = Math.sin(f * 0.07) * 0.02;

  refs.giraffe.position.set(gir.x, 0, gir.z);
  refs.giraffe.rotation.y = gir.ry;
  // badan: jongkok sebelum meregang, naik saat meregang, merosot saat lesu
  refs.girBodyG.position.y = 2.0 - 0.12 * crouch + 0.14 * stretch - 0.1 * droop + breathe;
  refs.girBodyG.scale.set(1 + 0.06 * crouch, 1 - 0.1 * crouch + 0.04 * stretch, 1);
  refs.girBodyG.rotation.z = -0.05 * droop + 0.03 * happy;
  refs.girBodyG.rotation.y = Math.sin(f * 0.03) * 0.03 * (1 - stretch);
  // kaki: melangkah kecil saat bersiap, menapak kokoh saat meregang
  const stepPh = f * 0.3;
  const stepping = sstep(L(1).f0 + 10, L(1).f0 + 40, f) * (1 - sstep(L(2).f0, L(2).f0 + 15, f));
  refs.girLegFL.rotation.z = Math.sin(stepPh) * 0.25 * stepping;
  refs.girLegBR.rotation.z = Math.sin(stepPh) * 0.25 * stepping;
  refs.girLegFR.rotation.z = Math.sin(stepPh + Math.PI) * 0.25 * stepping;
  refs.girLegBL.rotation.z = Math.sin(stepPh + Math.PI) * 0.25 * stepping;
  // ekor: follow-through — menyusul gerak badan, berkibas pelan
  refs.girTailG.rotation.y = Math.sin(f * 0.1) * 0.3;
  refs.girTailG.rotation.z = 0.2 * stretch + Math.sin(f * 0.12) * 0.06;
  // leher: bangga ke atas (0), memanjang meregang (2), menunduk lesu (3),
  // menengadah ke kanguru (4); skala Y memanjang saat meregang
  const nod = Math.sin((f - (L(0).f0 + 15)) * 0.22) * 0.06
    * sstep(L(0).f0 + 15, L(0).f0 + 45, f) * (1 - sstep(L(0).f1 - 20, L(0).f1, f));
  const happyNod = happy > 0.01 ? Math.sin((f - CATCH_F) * 0.18) * 0.1 * happy : 0;
  refs.girNeckG.scale.y = 1 + 0.14 * stretch;
  refs.girNeckG.rotation.z = 0.08 * proud - 0.18 * stretch - 0.38 * droop
    + 0.12 * lookUp + nod + happyNod + Math.sin(f * 0.05) * 0.02;
  refs.girHeadG.rotation.z = nod + 0.1 * proud - 0.12 * stretch - 0.3 * droop
    + 0.12 * lookUp + 0.12 * happy + Math.sin(f * 0.5) * 0.05 * girM;
  refs.girHeadG.rotation.y = -0.2 * lookUp;
  refs.girJawG.rotation.z = -girM * 0.4;
  // telinga: berkedip halus, tegak saat gembira
  refs.girEarL.rotation.x = -0.1 - 0.1 * happy + Math.sin(f * 0.06) * 0.04;
  refs.girEarR.rotation.x = 0.1 + 0.1 * happy - Math.sin(f * 0.06) * 0.04;
  applyBlink(refs.girEyeL, refs.girEyeR, f, 60, 130);
  // daun yang ditangkap muncul di mulut sesudah momen tangkap
  refs.caughtLeafG.visible = f >= CATCH_F;

  // ---- kanguru ---------------------------------------------------------------
  const ROO_KEYS = [
    { f: 0, x: ROO_HOME[0], z: ROO_HOME[1], ry: (5 * Math.PI) / 4 },
    { f: L(1).f0, x: ROO_HOME[0], z: ROO_HOME[1], ry: (5 * Math.PI) / 4 },
    { f: L(1).f0 + 40, x: 1.3, z: 0.9, ry: 3.3 }, // putar → hadap pohon, melompat
    { f: L(1).f1, x: 1.0, z: 0.6, ry: 3.3 },
    { f: L(2).f0 + 20, x: 1.0, z: 0.6, ry: (5 * Math.PI) / 4 }, // putar → kamera
    { f: L(3).f0, x: 1.0, z: 0.6, ry: (5 * Math.PI) / 4 },
    { f: L(3).f0 + 50, x: -0.2, z: 0.9, ry: 3.7 }, // mendekat menenangkan
    { f: L(5).f0, x: -0.2, z: 0.9, ry: 3.7 },
    { f: L(5).f0 + 60, x: 0.3, z: 0.2, ry: 3.3 }, // ancang lompat besar
    { f: END, x: -0.9, z: 1.0, ry: (5 * Math.PI) / 4 }, // mendarat di sisi jerapah
  ];
  const roo = keyLerp(ROO_KEYS, f);
  // lompatan kecil mengintai (line 1): tiga lompatan pendek ke arah pohon
  const hop1 = jumpY(f, L(1).f0 + 30, L(1).f0 + 70, 0.5)
    + jumpY(f, L(1).f0 + 85, L(1).f0 + 125, 0.5)
    + jumpY(f, L(1).f0 + 140, L(1).f0 + 175, 0.5);
  // lompatan besar (line 5): melompat tinggi ke arah ranting
  const bigJump = jumpY(f, CATCH_F - 55, CATCH_F + 5, 2.1);
  // antisipasi: jongkok (squash) sesaat sebelum lompatan besar
  const rooCrouch = sstep(CATCH_F - 85, CATCH_F - 55, f) * (1 - sstep(CATCH_F - 55, CATCH_F - 35, f));
  // isyarat tenang (line 3): kaki depan terangkat
  const reassure = sstep(L(3).f0 + 15, L(3).f0 + 45, f) * (1 - sstep(L(3).f1 - 20, L(3).f1, f));
  // menengadah ke daun tertinggi (line 0–1) / ke jerapah (line 4)
  const rooLookUp = sstep(20, 60, f) * (1 - sstep(L(2).f0, L(2).f0 + 30, f))
    + sstep(L(4).f0 + 10, L(4).f0 + 40, f) * (1 - sstep(L(5).f0, L(5).f0 + 15, f));
  const rooHappy = sstep(CATCH_F + 10, CATCH_F + 50, f);

  const rooY = hop1 + bigJump;
  refs.kangaroo.position.set(roo.x, rooY, roo.z);
  refs.kangaroo.rotation.y = roo.ry;
  // badan: jongkok sebelum lompat, meregang di udara, napas saat diam
  refs.rooBodyG.position.y = 0.95 - 0.12 * rooCrouch + Math.sin(f * 0.09) * 0.015 * (1 - rooCrouch);
  refs.rooBodyG.scale.set(
    1 + 0.08 * rooCrouch,
    1 - 0.14 * rooCrouch + 0.1 * clamp01(bigJump / 2.1),
    1,
  );
  refs.rooBodyG.rotation.z = 0.08 * rooLookUp + 0.05 * rooHappy;
  // kaki belakang: terlipat saat melompat, menapak saat mendarat
  const air = clamp01(bigJump / 2.1) + clamp01(hop1 / 0.5) * 0.5;
  refs.rooLegL.rotation.z = 0.7 * Math.min(1, air) + 0.3 * rooHappy * Math.sin(f * 0.4);
  refs.rooLegR.rotation.z = 0.7 * Math.min(1, air) - 0.3 * rooHappy * Math.sin(f * 0.4);
  // lengan: terangkat memberi isyarat tenang (3), terentang saat melompat
  const armUp = reassure + clamp01(bigJump / 2.1) * 0.8;
  refs.rooArmL.rotation.z = -0.5 * armUp - 0.2 * rooHappy;
  refs.rooArmR.rotation.z = 0.5 * armUp + 0.2 * rooHappy;
  refs.rooArmL.rotation.x = -0.4 * reassure;
  refs.rooArmR.rotation.x = 0.4 * reassure;
  // ekor: follow-through — menyusul gerak badan, terangkat saat melompat
  refs.rooTailG.rotation.y = Math.sin(f * 0.1) * 0.25;
  refs.rooTailG.rotation.z = -0.35 * clamp01(bigJump / 2.1) + Math.sin(f * 0.12) * 0.05;
  // kepala: menengadah ke daun/jerapah — rotasi z POSITIF = moncong ke atas
  // (ronde 2: tanda negatif sempat membuat kanguru menunduk ke tanah)
  refs.rooHeadG.rotation.z = 0.25 * rooLookUp + 0.1 * rooHappy
    + Math.sin(f * 0.5) * 0.05 * rooM;
  refs.rooHeadG.rotation.y = Math.sin(f * 0.04 + 1.2) * 0.15 * (1 - clamp01(bigJump / 2.1));
  refs.rooJawG.rotation.z = -rooM * 0.4;
  // telinga: tegak saat melompat, berkedip halus saat diam
  refs.rooEarL.rotation.x = -0.15 * clamp01(bigJump / 2.1) + Math.sin(f * 0.07) * 0.05;
  refs.rooEarR.rotation.x = 0.15 * clamp01(bigJump / 2.1) - Math.sin(f * 0.07) * 0.05;
  applyBlink(refs.rooEyeL, refs.rooEyeR, f, 95, 120);

  // ---- ranting patah + daun berserakan ---------------------------------------
  // Ranting patah: ujung ranting ada di KIRI-ATAS poros (lokal -x,+y), jadi
  // rotasi z POSITIF yang mengayunkan ujungnya TURUN (ronde 3: tanda negatif
  // sempat mengangkat ujung ranting ke atas tajuk, bukan menjatuhkannya).
  const drop = sstep(BREAK_F, BREAK_F + 20, f);
  const wobble = Math.sin((f - BREAK_F) * 0.3) * 0.06
    * sstep(BREAK_F + 20, BREAK_F + 30, f) * (1 - sstep(BREAK_F + 60, BREAK_F + 110, f));
  refs.branchG.rotation.z = 0.5 * drop + wobble;
  refs.branchG.rotation.x = 0.12 * drop;
  // daun jatuh: mulai di ujung ranting, melayang berputar ke tanah
  const fallP = sstep(BREAK_F + 5, BREAK_F + 65, f);
  refs.leafGs.forEach((lg, i) => {
    const bx = lg.userData.bx as number;
    const by = lg.userData.by as number;
    const bz = lg.userData.bz as number;
    const ex = lg.userData.ex as number;
    const ez = lg.userData.ez as number;
    const ph = lg.userData.phase as number;
    const spin = lg.userData.spin as number;
    // daun ke-7 dipakai ulang di line 5: jatuh dari ranting ke mulut jerapah
    if (i === 7 && f >= L(5).f0) {
      const p2 = sstep(CATCH_F - 45, CATCH_F, f);
      lg.visible = p2 < 1;
      lg.position.set(
        lerp(-1.0, -0.9, p2) + Math.sin(f * 0.2 + ph) * 0.1 * (1 - p2),
        lerp(5.2, 4.4, p2),
        lerp(-3.1, 0.4, p2),
      );
      lg.rotation.y = f * 0.05 * spin * 0.2;
      return;
    }
    lg.visible = f >= BREAK_F + 5;
    if (!lg.visible) return;
    const sway = Math.sin(f * 0.15 + ph) * 0.35 * (1 - fallP);
    lg.position.set(
      lerp(bx, ex, fallP) + sway,
      lerp(by, 0.15, fallP * fallP),
      lerp(bz, ez, fallP) + Math.cos(f * 0.12 + ph) * 0.2 * (1 - fallP),
    );
    lg.rotation.y = (f * 0.02 + ph) * spin * 0.3;
    lg.rotation.z = Math.sin(f * 0.1 + ph) * 0.4 * (1 - fallP);
  });
  // daun terbagi untuk teman-teman muncul sesudah tangkapan berhasil
  const shared = sstep(CATCH_F + 30, CATCH_F + 70, f);
  refs.sharedLeafGs.forEach((sg) => { sg.visible = shared > 0.5; });

  // ---- teman-teman: menengadah ke pohon, mengangguk gembira di penutup -----
  const friendsLook = sstep(L(4).f0, L(4).f0 + 40, f);
  refs.friendHeadGs.forEach((hg, i) => {
    hg.rotation.z = -0.3 * friendsLook + 0.1 * happy
      + Math.sin(f * 0.05 + i * 1.3) * 0.03;
  });
  refs.friends.forEach((fr, i) => {
    fr.position.y = happy > 0.01 ? Math.abs(Math.sin(f * 0.2 + i)) * 0.08 * happy : 0;
  });

  // ---- lingkungan ------------------------------------------------------------
  driftClouds(refs.clouds, f);
  swayFlowers(refs.flowers, f);
  refs.grassSway.forEach((gg) => {
    const ph = gg.userData.phase as number;
    gg.rotation.z = Math.sin(f * 0.03 + ph) * 0.07;
    gg.rotation.x = Math.cos(f * 0.025 + ph) * 0.04;
  });
  pulseSparkles(refs.sparkles, f, line === 5 && f >= CATCH_F);

  // ---- kamera: bingkai dari rentang sebenarnya -------------------------------
  // kepala jerapah ≈ 1.6 satuan di depan akar (ry=0), ekor ≈ 1.5 di belakang
  const girHeadX = gir.x + Math.cos(gir.ry) * 1.6;
  const girTailX = gir.x - Math.cos(gir.ry) * 1.5;
  const bodyHalf = Math.abs(Math.cos(gir.ry)) * 1.36 + Math.abs(Math.sin(gir.ry)) * 0.68;
  // kepala kanguru ≈ 0.8 di depan akar, ekor ≈ 1.4 di belakang
  const rooHeadX = roo.x + Math.cos(roo.ry) * 0.8;
  const rooTailX = roo.x - Math.cos(roo.ry) * 1.4;
  const toFriends = sstep(L(4).f0, L(4).f0 + 40, f);
  const left = Math.min(girTailX, gir.x - bodyHalf, rooTailX, -3.2);
  const right = lerp(
    Math.max(girHeadX, gir.x + bodyHalf, rooHeadX, 2.6),
    Math.max(girHeadX, gir.x + bodyHalf, rooHeadX, 3.0),
    toFriends,
  );
  const { mid: midX, z } = frameExtent(left, right, 1.3);
  const headY = 4.5 + 0.35 * stretch - 0.9 * droop + 0.3 * lookUp;
  const midY = (0.3 + headY) / 2;
  camera.position.set(midX * 0.95, midY + 0.25 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.35, 0);
}
