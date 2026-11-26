import * as THREE from "three";
import { FlamingoRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
// ESTIMASI (dari NASKAH, ±karakter/16.7 dtk) — diganti timing ASLI saat agen
// audio selesai; semua jendela di bawah berjangkar LINES agar penyesuaian
// tinggal mengubah FRAMES + kunci posisi bila batas giliran bergeser.

// Beats (giliran bicara, estimasi):
//  0  12–242   establishing: flamingo berdiri satu kaki di tengah danau,
//              paruh tercelup menyaring; pipit hinggap di ranting kiri atas
//  1 248–437   pipit terbang rendah mengitari danau mengintai, lalu hinggap
//              lagi; flamingo mengangkat kepala mendengarkan
//  2 443–611   flamingo menyaring cepat ke kanan dengan semangat, lalu
//              berhenti — paruh terangkat, kepala menoleh bingung; air kosong
//  3 617–776   pipit menunduk lesu di ranting; flamingo berdiri diam, sayap
//              terkulai sedikit
//  4 782–887   flamingo mengangguk mantap ke arah pipit, berdiri tegak
//              menunggu; pipit mengepakkan sayap bersiap mengintai lagi
//  5 893–1084  pipit berkicau dua kali sambil menunjuk ke kiri dengan sayap;
//              flamingo menyaring ke kiri — makanan berkilau tertangkap di
//              paruhnya; keduanya gembira, kilau penutup

// ATURAN KERAS (pelajaran 25 Nov + Kucing/Bangau 26 Nov): arah hadap SELALU
// searah gerak — setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak;
// target interaksi dijangkau KEPALA/paruh, bukan badan yang menembus; tokoh
// yang berbicara menghadap kamera/penonton (ry 3/4), tidak pernah
// membelakangi kamera; putaran lewat sisi kamera (ry lewat -π/2).
// Flamingo menghadap +x pada ry=0 (paruh di +x); ry=-π/4 = 3/4 ke kamera.

const L0 = LINES[0], L1 = LINES[1], L2 = LINES[2];
const L3 = LINES[3], L4 = LINES[4], L5 = LINES[5];
const END = timing.frames;

const FLAM_X = 0.2;
const FLAM_Z = 0.4;

const FLAM_KEYS = [
  { f: 0, ry: -Math.PI / 4 },          // 3/4 ke kamera, bicara
  { f: L1.f1, ry: -Math.PI / 4 },
  { f: L2.f0 + 35, ry: 0 },            // putar di tempat → hadap kanan (saring)
  { f: L2.f1, ry: 0 },
  { f: L2.f1 + 45, ry: -Math.PI / 4 }, // putar di tempat → 3/4, bingung/lesu
  { f: L4.f1 - 30, ry: -Math.PI / 4 },
  { f: L5.f0 + 5, ry: -Math.PI },      // putar di tempat lewat sisi kamera → hadap kiri
  { f: L5.f1, ry: -Math.PI },
  { f: END, ry: -Math.PI / 4 },        // putar kembali → bangga ke kamera
];

const PERCH: [number, number] = [-3.2, 3.5];
const PIPIT_KEYS = [
  { f: 0, x: PERCH[0], y: PERCH[1], z: -0.5, ry: -0.4 },   // hinggap, menghadap flamingo
  { f: L1.f0, x: PERCH[0], y: PERCH[1], z: -0.5, ry: -0.4 },
  { f: L1.f0 + 45, x: -1.8, y: 2.4, z: 1.0, ry: 0 },      // terbang rendah ke kanan, DI DEPAN flamingo
  { f: L1.f0 + 105, x: 2.2, y: 2.8, z: 1.0, ry: 0 },       // melengkung ke KANAN flamingo (bebas dari leher)
  { f: L1.f0 + 140, x: 2.2, y: 2.8, z: 1.0, ry: Math.PI }, // putar di tempat → hadap kiri
  { f: L1.f1 - 10, x: PERCH[0], y: PERCH[1], z: -0.5, ry: Math.PI }, // terbang pulang
  { f: L1.f1 + 30, x: PERCH[0], y: PERCH[1], z: -0.5, ry: -0.4 },    // putar di tempat → hinggap
  { f: END, x: PERCH[0], y: PERCH[1], z: -0.5, ry: -0.4 },
];

const CATCH_F = L5.f0 + 155; // ~1050: makanan tertangkap di paruh

const _tip = new THREE.Vector3();

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: FlamingoRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const flamM = mouthVal(MOUTH, "flamingo", f);
  const sparM = mouthVal(MOUTH, "sparrow", f);

  // ---- flamingo neck phases -------------------------------------------
  // filter0 = menyaring pelan giliran 0 (paruh tercelup); listen = kepala
  // terangkat mendengarkan (1); filterR = menyaring cepat ke kanan (2);
  // stop = berhenti bingung (ujung 2); droop = lesu (3); nod = mengangguk
  // mantap (4); coil = antisipasi tarik leher (awal 5); filterL = menyaring
  // ke kiri (5); lift = mengangkat makanan tertangkap (ujung 5).
  const wFilter0 = sstep(L0.f0, L0.f0 + 30, f) * (1 - sstep(L0.f1 - 20, L0.f1, f));
  const wListen = sstep(L1.f0, L1.f0 + 30, f) * (1 - sstep(L1.f1 - 20, L1.f1, f));
  const wFilterR = sstep(L2.f0, L2.f0 + 30, f) * (1 - sstep(L2.f1 - 40, L2.f1, f));
  const wStop = sstep(L2.f1 - 40, L2.f1 - 10, f) * (1 - sstep(L3.f0, L3.f0 + 30, f));
  const wDroop = sstep(L3.f0, L3.f0 + 40, f) * (1 - sstep(L3.f1 - 30, L3.f1, f));
  const wNod = sstep(L4.f0, L4.f0 + 30, f) * (1 - sstep(L4.f1 - 30, L4.f1, f));
  const wCoil = sstep(L5.f0, L5.f0 + 30, f) * (1 - sstep(L5.f0 + 60, L5.f0 + 90, f));
  const wFilterL = sstep(L5.f0 + 90, L5.f0 + 120, f) * (1 - sstep(CATCH_F + 5, CATCH_F + 35, f));
  const wLift = sstep(CATCH_F + 25, CATCH_F + 55, f);
  const filterAmt = Math.max(wFilter0, wFilterR, wFilterL);

  // ---- flamingo ---------------------------------------------------------
  const flam = keyLerp(FLAM_KEYS, f);
  refs.flamingo.position.set(FLAM_X, 0, FLAM_Z);
  refs.flamingo.rotation.y = flam.ry;
  // squash before the left filter, stretch through it, breathing otherwise;
  // CROUCH while filtering: the body dips so the (short) beak actually
  // reaches the water — the standing leg sinks into the murky water, as a
  // wading bird's does. PERBAIKAN v2: v1 bowed the neck but the head still
  // hovered ~1.5 above the water (body 2.05 + neck 1.75 too short).
  const breathe = Math.sin(f * 0.07) * 0.02;
  refs.flamBodyG.scale.set(1 + 0.05 * wCoil, 1 - 0.08 * wCoil + 0.04 * wFilterL, 1);
  refs.flamBodyG.position.y = 2.05 + breathe + 0.04 * wFilterL - 0.03 * wDroop
    - 0.45 * filterAmt;
  refs.flamBodyG.rotation.z = -0.06 * wFilterL - 0.04 * wDroop;
  // neck: upright -0.12; filter0 -1.9; listen -0.12; filterR -2.0;
  // stop -0.5; droop -0.95; nod -0.12; coil +0.18; filterL -2.05; lift -0.45
  const bow = -0.12
    - 1.78 * wFilter0 - 1.88 * wFilterR - 0.38 * wStop - 0.83 * wDroop
    + 0.3 * wCoil - 1.93 * wFilterL - 0.33 * wLift;
  // gentle dip oscillation while filtering in line 0 (beak dips in/out)
  const dipOsc = Math.sin(f * 0.11) * 0.14 * wFilter0;
  refs.flamNeckG.rotation.z = bow + dipOsc + Math.sin(f * 0.05) * 0.02;
  // lateral sweep while filtering fast to the right / left
  const sweep = Math.sin(f * 0.35) * 0.28 * wFilterR
    + Math.sin(f * 0.3) * 0.2 * wFilterL;
  refs.flamNeckG.rotation.x = sweep;
  // head: nod while speaking; cocked sideways when confused; bowed when sad;
  // firm double nod when agreeing (line 4); proud lift at the close
  const nod4 = Math.sin((f - L4.f0) * 0.22) * 0.12
    * sstep(L4.f0 + 10, L4.f0 + 40, f) * (1 - sstep(L4.f1 - 40, L4.f1, f));
  refs.flamHeadG.rotation.z = 0.08
    - 0.3 * wDroop + 0.15 * wLift + nod4
    + Math.sin(f * 0.45) * 0.035 * flamM   // nod while speaking
    + Math.sin(f * 0.05) * 0.02;            // idle sway
  refs.flamHeadG.rotation.x = 0.3 * wStop + Math.sin(f * 0.06) * 0.02;
  // beak: speaking; held open a touch while the food is caught (line 5–end)
  const heldOpen = sstep(CATCH_F + 25, CATCH_F + 55, f);
  refs.flamBeakLowG.rotation.z = -flamM * 0.32 - 0.12 * heldOpen;
  // wings: folded, lift a little in the eager filter, proud lift at close,
  // sag when drooping
  const wingLift = 0.2 * wFilterR + 0.15 * wLift;
  refs.flamWingL.rotation.x = 0.05 + Math.sin(f * 0.06) * 0.02 + wingLift + 0.3 * wDroop;
  refs.flamWingR.rotation.x = -0.05 - Math.sin(f * 0.06) * 0.02 - wingLift - 0.3 * wDroop;
  // one-leg stand (classic flamingo): folded right leg from frame 0, lines
  // 0–2 and 5; both legs down while drooping (3) and standing firm (4).
  // PERBAIKAN (pola Bangau v2): kaki terangkat dilipat ke belakang-atas
  // (-2.9) SAMBIL dipendekkan (scale 0.4) sehingga tersembunyi di bulu perut.
  const oneLeg = (1 - sstep(L2.f1, L3.f0 + 10, f))
    + sstep(L5.f0, L5.f0 + 30, f);
  const oneLegC = Math.min(1, oneLeg);
  refs.flamLegR.rotation.z = -2.9 * oneLegC;
  refs.flamLegR.scale.y = 1 - 0.6 * oneLegC;
  refs.flamLegL.rotation.z = Math.sin(f * 0.09) * 0.02;
  applyBlink(refs.flamEyeL, refs.flamEyeR, f, 40);

  // ---- sparrow ------------------------------------------------------------
  const spar = keyLerp(PIPIT_KEYS, f);
  const airborne = f >= L1.f0 && f <= L1.f1 + 30;
  const hoverBob = airborne ? Math.sin(f * 0.25) * 0.06 : 0;
  // two chirp hops in line 5 ("kicau dua kali")
  const chirpHop = jumpY(f, L5.f0 + 12, L5.f0 + 32, 0.15)
    + jumpY(f, L5.f0 + 42, L5.f0 + 62, 0.15);
  refs.sparrow.position.set(spar.x, spar.y + hoverBob + chirpHop, spar.z);
  refs.sparrow.rotation.y = spar.ry;
  // (readyFlap / pointWing dideklarasi di sini — dipakai juga oleh rotasi
  // badan di bawah; JANGAN pindah ke bawah: TDZ bila airborne=false.)
  const readyFlap = (sstep(L4.f0 + 18, L4.f0 + 33, f) * (1 - sstep(L4.f0 + 33, L4.f0 + 48, f))
    + sstep(L4.f0 + 63, L4.f0 + 78, f) * (1 - sstep(L4.f0 + 78, L4.f0 + 93, f))) * 0.9;
  const pointWing = sstep(L5.f0 + 7, L5.f0 + 27, f) * (1 - sstep(L5.f0 + 107, L5.f0 + 137, f));
  // slight banking in flight, slump when drooping (line 3), lean toward the
  // food while pointing (line 5)
  refs.sparBodyG.rotation.z = airborne ? Math.sin(f * 0.18) * 0.05 : -0.1 * wDroop - 0.15 * pointWing;
  refs.sparBodyG.position.y = airborne ? Math.sin(f * 0.15) * 0.03 : -0.05 * wDroop;
  // wings: flap while airborne; folded when perched; two ready-flaps (line 4);
  // LEFT wing raised to point at the food (line 5); joyful flap at the close
  const joyFlap = line === 5 && f >= CATCH_F
    ? Math.sin((f - CATCH_F) * 0.3) * 0.5 * sstep(CATCH_F, CATCH_F + 30, f)
    : 0;
  const flap = airborne ? 0.3 + Math.sin(f * 0.5) * 0.55 : 0.1 + Math.sin(f * 0.06) * 0.03;
  refs.sparWingL.rotation.x = flap + 0.9 * readyFlap + 1.0 * pointWing + joyFlap;
  refs.sparWingR.rotation.x = -flap - 0.9 * readyFlap - joyFlap;
  // pointing wing visibly TILTS UP (rotation.z swings the wing tip up);
  // rotation.x alone only spins the flat wing in place (v1: tidak terbaca).
  refs.sparWingL.rotation.z = -1.2 * pointWing;
  // head: peer down at the water while scouting (1), droop sad (3),
  // two chirp bobs (5), nod while speaking
  const chirpBob = sstep(L5.f0 + 12, L5.f0 + 22, f) * (1 - sstep(L5.f0 + 22, L5.f0 + 37, f))
    + sstep(L5.f0 + 42, L5.f0 + 52, f) * (1 - sstep(L5.f0 + 52, L5.f0 + 67, f));
  const peer = sstep(L1.f0 + 20, L1.f0 + 60, f) * (1 - sstep(L1.f1 - 60, L1.f1, f));
  refs.sparHeadG.rotation.z = -0.35 * peer - 0.35 * wDroop - 0.3 * chirpBob
    - 0.25 * pointWing + 0.12 * wLift
    + Math.sin(f * 0.45) * 0.035 * sparM
    + Math.sin(f * 0.05) * 0.02;
  // while pointing, the head also turns toward the food (camera-left)
  refs.sparHeadG.rotation.y = -0.4 * pointWing;
  refs.sparBeakLowG.rotation.z = -sparM * 0.32;
  applyBlink(refs.sparEyeL, refs.sparEyeR, f, 90);

  // ---- food -----------------------------------------------------------------
  const caught = f >= CATCH_F;
  refs.foodG.visible = f >= L5.f0;
  refs.rippleFood.visible = f >= L5.f0;
  refs.rippleRight.visible = f >= L2.f0 && f <= L2.f1 + 20;
  if (caught) {
    // morsel hangs from the flamingo's beak tip (true world position)
    refs.flamingo.updateMatrixWorld(true);
    refs.flamBeakTip.getWorldPosition(_tip);
    refs.foodCaught.visible = true;
    refs.foodCaught.position.set(_tip.x, _tip.y - 0.02, _tip.z);
  } else {
    refs.foodCaught.visible = false;
  }

  // ---- splashes ------------------------------------------------------------
  // windows: fast filter to the right (line 2), the catch (line 5)
  type SplashWin = { f0: number; f1: number; c: [number, number, number] };
  const wins: SplashWin[] = [
    { f0: L2.f0 + 37, f1: L2.f1 - 10, c: [1.6, 0.1, 0.5] },
    { f0: CATCH_F - 10, f1: CATCH_F + 70, c: [-1.9, 0.1, 0.6] },
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
  refs.rippleFlam.scale.setScalar(1 + 0.25 * Math.sin(f * 0.08));
  refs.rippleFood.scale.setScalar(1 + 0.2 * Math.sin(f * 0.06 + 1.5));
  refs.rippleRight.scale.setScalar(1 + 0.2 * Math.sin(f * 0.09 + 0.7));

  // ---- environment ------------------------------------------------------
  driftClouds(refs.clouds, f);
  refs.reeds.forEach((rg) => {
    rg.rotation.z = Math.sin(f * 0.04 + (rg.userData.phase as number)) * 0.08;
  });
  refs.bushes.forEach((b, i) => {
    b.rotation.z = Math.sin(f * 0.03 + i * 1.3) * 0.02;
  });
  pulseSparkles(refs.sparkles, f, caught || line === 5 && f >= CATCH_F);

  // ---- camera: frame by true extents -------------------------------------
  // flamingo head reach: upright ~0.7, filtering up to ~2.6 from flamingo x
  const headReach = 0.7 + 1.9 * filterAmt + 0.5 * wDroop;
  const flamHeadX = FLAM_X + Math.cos(flam.ry) * headReach;
  const flamTailX = FLAM_X - Math.cos(flam.ry) * 1.35;
  const sparHeadX = spar.x + 0.7;
  const sparTailX = spar.x - 0.7;
  const left = Math.min(flamHeadX, flamTailX, sparHeadX, sparTailX, -2.4);
  const right = Math.max(flamHeadX, flamTailX, sparHeadX, sparTailX, 2.1);
  const { mid: midX, z } = frameExtent(left, right, 1.3);
  // top of frame: flamingo head upright ~4.4, filtering low (~1.5 with the
  // deep bow + crouch); sparrow top
  const flamTop = 4.4 - 2.9 * filterAmt - 0.8 * wDroop;
  const sparTop = spar.y + hoverBob + chirpHop + 0.5;
  const topY = Math.max(flamTop, sparTop);
  const midY = (topY - 0.2) / 2;
  camera.position.set(midX * 0.95, midY + 0.35 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.97, midY - 0.3, 0);
}
