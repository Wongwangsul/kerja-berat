import * as THREE from "three";
import { CamarRefs } from "./world";
import {
  sstep, lerp, clamp01, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const L = (i: number) => LINES[i];
const END = timing.frames;

// Beats (giliran bicara, dari timing.json):
//  0  establishing: pantai sore jingga, perahu layar melaju di kejauhan;
//     camar putih-abu di kiri mengepak lelah; angsa putih anggun di kanan
//  1  angsa terbang tenang beriringan; camar berusaha mengikuti arusnya
//  2  camar oleng — angin berubah — sayapnya goyah; perahu makin jauh
//  3  camar diam melayang lesu; angsa mendekat, mengepak pelan memberi isyarat
//  4  camar menengadah ke arah angsa; perahu hampir sampai di pantai
//  5  keduanya terbang berdampingan, sayap seirama — sampai di atas perahu;
//     kilau penutup, keduanya berdampingan di tiang perahu

// ATURAN KERAS (pelajaran 25–26 Nov): arah hadap SELALU searah gerak —
// setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target interaksi
// dijangkau KEPALA, bukan badan yang menembus; tokoh yang berbicara menghadap
// kamera/penonton (ry -π/4 = 3/4 ke kamera), tidak pernah membelakangi kamera;
// putaran 180° lewat sisi kamera (ry lewat -π/2). Camar & angsa menghadap +x
// pada ry=0; ry=-π = menghadap -x (ke arah perahu/pantai).

// Camar: kiri → mendekat ke perahu di akhir; putar di tempat
// (f L(5).f0+60 – L(5).f0+140) sebelum terbang ke kiri menuju perahu,
// lalu mendarat di kiri tiang.
const CAMAR_KEYS = [
  { f: 0, x: -1.9, y: 3.5, z: 0.2, ry: -Math.PI / 4 },
  { f: L(1).f0, x: -1.9, y: 3.5, z: 0.2, ry: -Math.PI / 4 },
  { f: L(2).f0, x: -1.7, y: 3.5, z: 0.2, ry: -Math.PI / 4 },
  { f: L(2).f1, x: -2.0, y: 3.15, z: 0.2, ry: -Math.PI / 4 },
  { f: L(4).f0, x: -1.9, y: 3.3, z: 0.2, ry: -Math.PI / 4 },
  { f: L(5).f0, x: -1.9, y: 3.3, z: 0.2, ry: -Math.PI / 4 },
  { f: L(5).f0 + 60, x: -1.9, y: 3.3, z: 0.2, ry: -Math.PI }, // putar di tempat
  { f: L(5).f0 + 140, x: -1.9, y: 3.4, z: -1.2, ry: -Math.PI * 1.25 },
  { f: L(5).f1 - 40, x: -2.4, y: 3.9, z: -2.4, ry: -Math.PI * 0.75 },
  { f: END, x: -2.7, y: 4.05, z: -2.4, ry: -Math.PI * 0.75 }, // hinggap di kiri tiang, hadap kamera
];
// Angsa: kanan → mendekat ke camar (line 3) → terbang seirama ke perahu,
// hinggap di kanan tiang.
const SWAN_KEYS = [
  { f: 0, x: 1.8, y: 3.6, z: -0.2, ry: -Math.PI / 4 },
  { f: L(1).f0, x: 1.8, y: 3.6, z: -0.2, ry: -Math.PI / 4 },
  { f: L(1).f1, x: 0.9, y: 3.55, z: -0.2, ry: -Math.PI / 4 },
  { f: L(2).f1, x: 0.7, y: 3.5, z: -0.2, ry: -Math.PI / 4 },
  { f: L(3).f1, x: 0.1, y: 3.4, z: -0.1, ry: -Math.PI / 4 },
  { f: L(5).f0, x: 0.0, y: 3.4, z: -0.1, ry: -Math.PI / 4 },
  { f: L(5).f0 + 60, x: 0.0, y: 3.4, z: -0.1, ry: -Math.PI }, // putar di tempat
  { f: L(5).f0 + 140, x: -0.2, y: 3.4, z: -1.2, ry: -Math.PI * 1.25 },
  { f: L(5).f1 - 40, x: -0.6, y: 3.9, z: -3.0, ry: -Math.PI * 0.75 },
  { f: END, x: -0.3, y: 4.15, z: -3.1, ry: -Math.PI * 0.75 }, // hinggap di kanan tiang, hadap kamera
];
// Perahu: melaju dari kanan jauh menuju pantai kiri; tiba di akhir line 5.
const BOAT_KEYS = [
  { f: 0, x: 6.5, z: -5.0 },
  { f: L(1).f1, x: 4.8, z: -4.6 },
  { f: L(2).f1, x: 3.2, z: -4.2 },
  { f: L(3).f1, x: 1.6, z: -3.8 },
  { f: L(4).f1, x: 0.2, z: -3.4 },
  { f: L(5).f1, x: -1.5, z: -3.0 },
  { f: END, x: -1.5, z: -3.0 },
];

export function poseFrame(frame: number, refs: CamarRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const gulM = mouthVal(MOUTH, "seagull", f);
  const swaM = mouthVal(MOUTH, "swan", f);

  // ---- fase gerak ----------------------------------------------------------
  const tired = sstep(L(0).f0, L(0).f0 + 50, f) * (1 - sstep(L(0).f1 - 60, L(0).f1, f));
  const wob = sstep(L(2).f0 + 10, L(2).f0 + 40, f) * (1 - sstep(L(2).f1 - 40, L(2).f1, f));
  const droop = sstep(L(3).f0 + 10, L(3).f0 + 50, f) * (1 - sstep(L(3).f1 - 40, L(3).f1, f));
  const lookUp = sstep(L(4).f0 + 10, L(4).f0 + 45, f) * (1 - sstep(L(5).f0, L(5).f0 + 20, f));
  const reassure = sstep(L(3).f0 + 10, L(3).f0 + 45, f) * (1 - sstep(L(3).f1 - 30, L(3).f1, f));
  const sync = sstep(L(5).f0, L(5).f0 + 40, f);
  const perched = sstep(L(5).f1 - 70, L(5).f1 - 30, f);
  const flying = 1 - perched;

  // ---- camar ---------------------------------------------------------------
  const cam = keyLerp(CAMAR_KEYS, f);
  refs.seagull.position.set(cam.x, cam.y + Math.sin(f * 0.18) * 0.05 * flying, cam.z);
  refs.seagull.rotation.y = cam.ry;
  // badan: miring goyah saat oleng, menunduk lesu (line 3), napas halus
  const breathe = Math.sin(f * 0.07) * 0.02;
  refs.seagullBodyG.rotation.z = -0.06 * tired - 0.25 * wob - 0.18 * droop + 0.05 * sync;
  refs.seagullBodyG.rotation.x = Math.sin(f * 0.5) * 0.3 * wob;
  refs.seagullBodyG.rotation.y = Math.sin(f * 0.35) * 0.25 * wob;
  refs.seagullBodyG.position.y = breathe * flying - 0.1 * droop;
  refs.seagullBodyG.scale.set(1, 1 - 0.06 * droop, 1);
  // sayap: kepak cepat saat lelah, goyah saat oleng, pelan-lesu (line 3),
  // seirama dengan angsa (line 5), terlipat saat hinggap
  const flapOwn = 0.45 + 0.45 * Math.sin(f * 0.55);
  const flapWob = (0.4 + 0.4 * Math.sin(f * 0.55)) * (1 - 0.5 * wob)
    + 0.35 * Math.sin(f * 0.9) * wob;
  const flapDroop = 0.2 + 0.2 * Math.sin(f * 0.2);
  const flapSync = 0.5 + 0.5 * Math.sin(f * 0.4);
  let flapC = lerp(lerp(flapOwn, flapWob, clamp01(wob)), flapDroop, clamp01(droop));
  flapC = lerp(flapC, flapSync, sync);
  flapC *= flying;
  flapC += 0.05 * perched;
  const wingAsym = 0.25 * wob * Math.sin(f * 0.7);
  refs.seagullWingL.rotation.x = 0.08 + flapC + wingAsym + 0.1 * droop;
  refs.seagullWingR.rotation.x = -0.08 - flapC + wingAsym - 0.1 * droop;
  refs.seagullWingL.rotation.z = -0.12 * wob;
  refs.seagullWingR.rotation.z = 0.12 * wob;
  // ekor: follow-through — menyusul gerak badan, berkibar saat oleng
  refs.seagullTailG.rotation.z = 0.3 * wob + Math.sin(f * 0.12) * 0.08;
  refs.seagullTailG.rotation.y = Math.sin(f * 0.1) * 0.15;
  // kaki: terlipat ke depan saat terbang, menapak saat hinggap di tiang
  refs.seagullLegL.rotation.z = 1.2 * flying + 0.1 * perched;
  refs.seagullLegR.rotation.z = 1.2 * flying + 0.1 * perched;
  // kepala: menunduk lelah/lesu, menengadah ke angsa (line 4), angguk bicara
  refs.seagullHeadG.rotation.z = -0.15 * tired - 0.3 * droop + 0.25 * lookUp
    + 0.1 * sync + Math.sin(f * 0.45) * 0.035 * gulM + Math.sin(f * 0.05) * 0.02;
  refs.seagullHeadG.rotation.y = -0.3 * lookUp + Math.sin(f * 0.04) * 0.08 * (1 - wob);
  refs.seagullBeakLowG.rotation.z = -gulM * 0.4;
  applyBlink(refs.seagullEyeL, refs.seagullEyeR, f, 60, 120);

  // ---- angsa ---------------------------------------------------------------
  const swa = keyLerp(SWAN_KEYS, f);
  refs.swan.position.set(swa.x, swa.y + Math.sin(f * 0.16 + 1.1) * 0.05 * flying, swa.z);
  refs.swan.rotation.y = swa.ry;
  // badan: anggun, tenang, napas halus; sedikit condong saat mendekat
  refs.swanBodyG.rotation.z = 0.04 * sync - 0.03 * reassure;
  refs.swanBodyG.rotation.y = Math.sin(f * 0.03) * 0.03;
  refs.swanBodyG.position.y = Math.sin(f * 0.06 + 0.5) * 0.02 * flying;
  // sayap: kepak pelan tenang, isyarat lembut (line 3), seirama (line 5)
  const flapSwanOwn = 0.35 + 0.35 * Math.sin(f * 0.28);
  let flapS = lerp(flapSwanOwn, flapSync, sync);
  flapS = flapS * flying + 0.05 * perched;
  refs.swanWingL.rotation.x = 0.06 + flapS + 0.25 * reassure;
  refs.swanWingR.rotation.x = -0.06 - flapS - 0.25 * reassure;
  refs.swanWingL.rotation.z = -0.06 * flying;
  refs.swanWingR.rotation.z = 0.06 * flying;
  // ekor: follow-through halus
  refs.swanTailG.rotation.z = Math.sin(f * 0.11) * 0.08;
  refs.swanTailG.rotation.y = Math.sin(f * 0.09) * 0.12;
  // kaki: terlipat saat terbang, menapak saat hinggap
  refs.swanLegL.rotation.z = 1.2 * flying + 0.1 * perched;
  refs.swanLegR.rotation.z = 1.2 * flying + 0.1 * perched;
  // leher panjang: condong anggun ke depan saat terbang, tegak saat hinggap,
  // menunduk lembut memberi isyarat tenang (line 3)
  refs.swanNeckG.rotation.z = -0.18 * flying - 0.05 * perched - 0.12 * reassure
    + Math.sin(f * 0.04) * 0.02;
  refs.swanHeadG.rotation.z = -0.08 + 0.15 * reassure + 0.08 * sync
    + Math.sin(f * 0.45) * 0.035 * swaM + Math.sin(f * 0.05) * 0.02;
  refs.swanHeadG.rotation.y = Math.sin(f * 0.04 + 2.0) * 0.08;
  refs.swanBeakLowG.rotation.z = -swaM * 0.4;
  applyBlink(refs.swanEyeL, refs.swanEyeR, f, 95, 130);

  // ---- perahu --------------------------------------------------------------
  const boat = keyLerp(BOAT_KEYS, f);
  refs.boat.position.set(boat.x, Math.sin(f * 0.09) * 0.06, boat.z);
  refs.boat.rotation.z = Math.sin(f * 0.07) * 0.03;
  refs.boat.rotation.x = Math.sin(f * 0.05 + 1) * 0.02;
  // layar berkibar pelan, bendera berkibar
  refs.sailG.rotation.y = Math.sin(f * 0.12) * 0.08;
  refs.flagG.rotation.y = Math.sin(f * 0.3) * 0.3;
  // jejak buih mengikuti buritan perahu
  refs.rippleBoat.position.set(boat.x + 1.4, 0.03, boat.z + 0.3);
  refs.rippleBoat.scale.setScalar(1 + 0.25 * Math.sin(f * 0.1));

  // ---- lingkungan ----------------------------------------------------------
  driftClouds(refs.clouds, f, 0.0008); // hanyut pelan — awan tidak boleh masuk bingkai
  refs.ripples.forEach((r, i) => {
    r.scale.setScalar(1 + 0.25 * Math.sin(f * 0.08 + i * 1.7));
  });
  refs.distantBirds.forEach((bg) => {
    const ph = bg.userData.phase as number;
    const bx = bg.userData.bx as number;
    bg.position.x = bx + Math.sin(f * 0.01 + ph) * 1.5 + f * 0.002;
    bg.position.y += Math.sin(f * 0.05 + ph) * 0.002;
  });
  pulseSparkles(refs.sparkles, f, line === 5 && f >= L(5).f1 - 80);

  // ---- kamera: bingkai dari rentang sebenarnya ------------------------------
  const toBoat = sstep(L(5).f0 + 40, L(5).f0 + 140, f);
  const birdL = Math.min(cam.x - 1.2, swa.x - 1.4);
  const birdR = Math.max(cam.x + 1.2, swa.x + 1.4);
  const left = lerp(birdL, Math.min(birdL, boat.x - 1.8), toBoat);
  const right = lerp(birdR, Math.max(birdR, boat.x + 1.8), toBoat);
  const { mid: midX, z } = frameExtent(left, right, 2.0, 11, 22);
  // puncak bingkai: kepala angsa (leher panjang) di atas, camar di bawahnya —
  // beri ruang kepala ekstra (+3.2) supaya paruh tidak menyentuh tepi atas
  const topY = Math.max(swa.y + 3.2, cam.y + 1.1);
  const midY = (topY - 0.2) / 2;
  camera.position.set(midX * 0.95, midY + 0.35 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.3, 0);
}
