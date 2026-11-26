import * as THREE from "three";
import { PenguinRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink,
  driftClouds, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const L = (i: number) => LINES[i];
const END = timing.frames;

// Beats (giliran bicara, dari timing.json — semua batas keyframe diturunkan
// dari LINES supaya tabel ikut bergeser bila timing.json asli menggantikannya):
//  0  kait + fakta: penguin di kiri es menoleh cemas ke retakan di tengah;
//     udang kecil di air tepi es kanan bawah; koloni di kejauhan kanan
//  1  udang menyelam memeriksa retak dari bawah air, muncul memberi aba-aba;
//     penguin mengangguk, bersiap meluncur (antisipasi: jongkok dulu)
//  2  penguin meluncur pelan dengan perutnya ke kanan, berhenti mendadak
//     saat es berderit — tubuh menegang, kepala menoleh ke retakan
//  3  penguin diam menunduk lesu di tengah es; udang mengangkat capit
//     memberi isyarat tenang dari air
//  4  penguin menengadah ke arah koloni, gelisah; udang mulai meniup
//     gelembung yang naik membentuk jalur aman
//  5  penguin meluncur gembira mengikuti jejak gelembung ke kanan sampai ke
//     tepi koloni; udang melompat kecil dari air; kilau penutup, keduanya
//     berdampingan

// ATURAN KERAS (pelajaran 25–26 Nov): arah hadap SELALU searah gerak —
// setiap perubahan arah PUTAR DI TEMPAT dulu, baru bergerak; target interaksi
// dijangkau KEPALA, bukan badan yang menembus; tokoh yang berbicara menghadap
// kamera/penonton (ry -π/4 = 3/4 ke kamera), tidak pernah membelakangi kamera.
// Penguin menghadap +x pada ry=0 (paruh di +x); udang menghadap +x pada ry=0.

function jumpY(f: number, w0: number, w1: number, h: number): number {
  if (f < w0 || f > w1) return 0;
  const u = (f - w0) / (w1 - w0);
  return h * 4 * u * (1 - u);
}

export function poseFrame(frame: number, refs: PenguinRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const penM = mouthVal(MOUTH, "penguin", f);
  const shrM = mouthVal(MOUTH, "shrimp", f);

  // ---- key tables (diturunkan dari LINES) --------------------------------
  const turnR0 = L(1).f1 - 30;                    // putar di tempat → hadap kanan
  const slide1a = L(2).f0 + 25, slide1b = L(2).f1 - 45; // luncur 1 (pelan, berhenti)
  const turnC0 = L(2).f1 - 10;                    // putar di tempat → 3/4 kamera
  const turnR1 = L(3).f1 - 25;                    // putar di tempat → hadap koloni
  const slide2a = L(5).f0 + 15, slide2b = L(5).f1 - 70; // luncur 2 (mengikuti gelembung)
  const turnC1 = L(5).f1 - 40;                    // putar di tempat → 3/4 kamera, penutup

  const PEN_KEYS = [
    { f: 0, x: -2.6, ry: -Math.PI / 4 },
    { f: turnR0, x: -2.55, ry: -Math.PI / 4 },
    { f: L(2).f0, x: -2.55, ry: 0 },
    { f: slide1b, x: -0.7, ry: 0 },
    { f: turnC0, x: -0.7, ry: 0 },
    { f: L(3).f0, x: -0.7, ry: -Math.PI / 4 },
    { f: turnR1, x: -0.7, ry: -Math.PI / 4 },
    { f: L(4).f0, x: -0.7, ry: 0 },
    { f: slide2b, x: 3.6, ry: 0 },
    { f: turnC1, x: 3.6, ry: 0 },
    { f: L(5).f1, x: 3.6, ry: -Math.PI / 4 },
    { f: END, x: 3.6, ry: -Math.PI / 4 },
  ];
  const SHR_KEYS = [
    { f: 0, x: 1.3, y: -0.28, z: 3.3, ry: Math.PI * 1.25 },
    { f: L(1).f0 + 30, x: 1.3, y: -0.28, z: 3.3, ry: Math.PI * 1.25 },
    { f: L(1).f0 + 70, x: 1.15, y: -0.5, z: 3.1, ry: Math.PI },   // menyelam
    { f: L(1).f1 - 50, x: 1.3, y: -0.28, z: 3.3, ry: Math.PI * 1.25 }, // muncul, aba-aba
    { f: L(4).f0, x: 1.3, y: -0.28, z: 3.3, ry: Math.PI * 1.25 },
    { f: L(5).f0, x: 1.5, y: -0.28, z: 3.25, ry: Math.PI * 1.5 },   // putar → kamera
    { f: L(5).f1 - 70, x: 3.0, y: -0.28, z: 3.2, ry: Math.PI * 1.5 },
    { f: END, x: 3.0, y: -0.28, z: 3.2, ry: Math.PI * 1.5 },
  ];

  // ---- penguin ------------------------------------------------------------
  const pen = keyLerp(PEN_KEYS, f);
  // slide windows: 1 = pelan lalu berhenti mendadak; 2 = gembira mengikuti gelembung
  const slide1 = sstep(slide1a, slide1a + 25, f) * (1 - sstep(slide1b - 15, slide1b, f));
  const slide2 = sstep(slide2a, slide2a + 25, f) * (1 - sstep(slide2b - 15, slide2b, f));
  const slide = Math.max(slide1, slide2);
  // anticipation: crouch (squash) just before each slide
  const crouch1 = sstep(L(2).f0, L(2).f0 + 20, f) * (1 - sstep(slide1a, slide1a + 15, f));
  const crouch2 = sstep(L(5).f0, L(5).f0 + 12, f) * (1 - sstep(slide2a, slide2a + 15, f));
  const crouch = Math.max(crouch1, crouch2);
  // sudden brake at the end of slide 1: squash + tense
  const brake = sstep(slide1b, slide1b + 8, f) * (1 - sstep(slide1b + 8, slide1b + 35, f));
  // droop (line 3) / look up to the colony (line 4) / happy close (line 5)
  const droop = sstep(L(3).f0 + 10, L(3).f0 + 45, f) * (1 - sstep(L(3).f1 - 25, L(3).f1, f));
  const lookUp = sstep(L(4).f0 + 10, L(4).f0 + 40, f) * (1 - sstep(L(5).f0, L(5).f0 + 15, f));
  const happy = sstep(slide2b, slide2b + 30, f);
  const breathe = Math.sin(f * 0.07) * 0.02;

  refs.penguin.position.set(pen.x, slide > 0.02 ? 0.12 : 0, 0.3);
  refs.penguin.rotation.y = pen.ry;
  // toboggan: body pitches forward onto the belly; head counter-rotates up
  refs.penguinBodyG.rotation.z = -1.12 * slide - 0.06 * droop;
  refs.penguinBodyG.position.y = 0.88 - 0.42 * slide + breathe * (1 - slide)
    + 0.05 * (slide1 > 0.5 ? Math.sin(f * 0.5) * 0.02 : 0);
  refs.penguinBodyG.scale.set(
    1 + 0.08 * crouch + 0.1 * brake - 0.04 * slide,
    1 - 0.15 * crouch - 0.12 * brake + 0.08 * slide,
    1,
  );
  // flippers: tucked while standing, spread wide while sliding (steering),
  // follow-through lag behind the body pitch
  const flipOut = 0.55 * slide + 0.12 * happy;
  const flipLag = Math.sin(f * 0.3) * 0.08 * slide;
  refs.penguinFlipL.rotation.x = 0.1 + flipOut + flipLag;
  refs.penguinFlipR.rotation.x = -0.1 - flipOut - flipLag;
  refs.penguinFlipL.rotation.z = -0.15 * slide;
  refs.penguinFlipR.rotation.z = 0.15 * slide;
  // feet: kick while sliding, tucked on the brake, paddle at the close
  const kick = slide > 0.02 ? Math.sin(f * 0.6) * 0.35 * slide : 0;
  refs.penguinFootL.rotation.z = kick + 0.5 * brake + 0.3 * happy * Math.sin(f * 0.4);
  refs.penguinFootR.rotation.z = -kick + 0.5 * brake - 0.3 * happy * Math.sin(f * 0.4);
  // tail: follow-through — lags the body pitch, flicks on the brake
  refs.penguinTailG.rotation.z = 0.4 * slide + 0.5 * brake + Math.sin(f * 0.12) * 0.08;
  refs.penguinTailG.rotation.y = Math.sin(f * 0.1) * 0.15;
  // head: nod agreeing (line 1), glance at the crack on the brake (line 2),
  // down sad (line 3), up to the colony (line 4), counter-pitch while sliding
  const nod = Math.sin((f - (L(1).f0 + 15)) * 0.22) * 0.12
    * sstep(L(1).f0 + 15, L(1).f0 + 45, f) * (1 - sstep(L(1).f1 - 20, L(1).f1, f));
  const glanceCrack = sstep(slide1b, slide1b + 12, f) * (1 - sstep(L(3).f0 + 10, L(3).f0 + 40, f));
  refs.penguinHeadG.rotation.z = nod + 1.05 * slide - 0.32 * droop + 0.28 * lookUp
    + 0.12 * happy + Math.sin(f * 0.5) * 0.05 * penM + Math.sin(f * 0.05) * 0.02;
  refs.penguinHeadG.rotation.y = -0.35 * glanceCrack - 0.25 * lookUp;
  refs.penguinHeadG.rotation.x = 0.15 * droop;
  refs.penguinBeakLowG.rotation.z = -penM * 0.4;
  applyBlink(refs.penguinEyeL, refs.penguinEyeR, f, 60, 120);

  // ---- shrimp ---------------------------------------------------------------
  const shr = keyLerp(SHR_KEYS, f);
  const hop = jumpY(f, L(5).f1 - 70, L(5).f1 - 45, 0.55)   // lompat kecil penutup
    + jumpY(f, L(1).f1 - 50, L(1).f1 - 30, 0.25);            // muncul dari air (aba-aba)
  const bob = Math.sin(f * 0.18) * 0.04;
  refs.shrimp.position.set(shr.x, shr.y + bob + hop, shr.z);
  refs.shrimp.rotation.y = shr.ry;
  // body: gentle curl pulse + tail wiggle; arches when diving
  const dive = sstep(L(1).f0 + 30, L(1).f0 + 70, f) * (1 - sstep(L(1).f1 - 60, L(1).f1 - 40, f));
  refs.shrimpBodyG.rotation.z = 0.12 * dive + Math.sin(f * 0.15) * 0.03 + 0.1 * hop;
  refs.shrimpBodyG.position.y = Math.sin(f * 0.12) * 0.02;
  refs.shrimpTailG.rotation.y = Math.sin(f * 0.4) * 0.3;
  refs.shrimpTailG.rotation.z = -0.2 * dive;
  // claws: raised reassuring (line 3), waving the signal (line 1 end),
  // blowing bubbles (line 4–5)
  const signal = sstep(L(1).f1 - 50, L(1).f1 - 30, f) * (1 - sstep(L(2).f0, L(2).f0 + 20, f));
  const reassure = sstep(L(3).f0 + 10, L(3).f0 + 40, f) * (1 - sstep(L(3).f1 - 20, L(3).f1, f));
  const blowing = sstep(L(4).f0 + 15, L(4).f0 + 45, f) * (1 - sstep(L(5).f1 - 60, L(5).f1 - 30, f));
  const wave = Math.sin(f * 0.35) * 0.25 * (signal + reassure);
  refs.shrimpClawL.rotation.z = -0.9 * (signal + reassure) - 0.5 * blowing + wave;
  refs.shrimpClawR.rotation.z = -0.9 * (signal + reassure) - 0.5 * blowing - wave;
  // antennae: sweep gently, flick when signalling
  refs.shrimpAntL.rotation.z = Math.sin(f * 0.1) * 0.06 + 0.1 * signal;
  refs.shrimpAntR.rotation.z = -Math.sin(f * 0.1) * 0.06 - 0.1 * signal;
  // head: peer at the crack while diving, nod while speaking
  refs.shrimpHeadG.rotation.z = -0.3 * dive + Math.sin(f * 0.5) * 0.05 * shrM
    + Math.sin(f * 0.05) * 0.02;
  refs.shrimpJawG.rotation.z = -shrM * 0.5;
  applyBlink(refs.shrimpEyeL, refs.shrimpEyeR, f, 95, 130);

  // ---- bubbles --------------------------------------------------------------
  // appear line 4 (blowing the safe path), grow along the trail in line 5,
  // fade out after the penguin arrives at the colony
  const bubOn = sstep(L(4).f0 + 15, L(4).f0 + 45, f);
  const bubFade = 1 - sstep(slide2b, slide2b + 40, f);
  refs.bubbles.visible = bubOn > 0.01 && bubFade > 0.01;
  if (refs.bubbles.visible) {
    const reveal = sstep(L(4).f0, L(5).f0 + 40, f); // trail extends toward colony
    refs.bubbleMeshes.forEach((b, i) => {
      const t = i / (refs.bubbleMeshes.length - 1);
      // a bubble stays only while it is still AHEAD of the penguin —
      // the penguin "collects" each bubble as he slides past it, so no
      // bubble ever sits on top of his body in screen space
      const shown = t <= reveal && (b.userData.tx as number) > pen.x + 0.3 ? 1 : 0;
      const rise = Math.sin(f * 0.09 + (b.userData.phase as number)) * 0.12;
      const wob = Math.sin(f * 0.14 + (b.userData.phase as number)) * 0.06;
      b.position.set(
        (b.userData.tx as number) + wob,
        (b.userData.baseY as number) + rise + bubOn * 0.1,
        b.userData.tz as number,
      );
      const s = (0.7 + 0.5 * Math.abs(Math.sin(f * 0.12 + (b.userData.phase as number)))) * shown * bubFade;
      b.scale.setScalar(Math.max(0.001, s));
    });
  }

  // ---- environment ------------------------------------------------------
  driftClouds(refs.clouds, f);
  // ice chunks bob gently on the water
  refs.iceChunks.forEach((cg) => {
    const ph = cg.userData.phase as number;
    cg.position.y = -0.28 + Math.sin(f * 0.03 + ph) * 0.05;
    cg.rotation.z = Math.sin(f * 0.025 + ph) * 0.05;
  });
  // colony: tiny bob + occasional head turn (alive, never frozen)
  refs.colony.forEach((pg, i) => {
    const ph = pg.userData.phase as number;
    pg.position.y = Math.abs(Math.sin(f * 0.05 + ph)) * 0.03;
    refs.colonyHeadGs[i].rotation.y = Math.sin(f * 0.04 + ph) * 0.3;
  });
  // crack: subtle pulse while the penguin fears it (lines 0–2)
  const crackPulse = sstep(0, 30, f) * (1 - sstep(L(2).f1, L(2).f1 + 40, f));
  refs.crackG.scale.setScalar(1 + 0.06 * Math.sin(f * 0.15) * crackPulse);
  pulseSparkles(refs.sparkles, f, line === 5 && f >= slide2b);

  // ---- camera: frame by true extents, panning right as the story moves ----
  const penHeadX = pen.x + (slide > 0.02 ? 1.75 : 1.35);
  const penTailX = pen.x - (slide > 0.02 ? 1.75 : 1.1);
  const shrX = shr.x;
  const colonyL = 4.6 - 0.35, colonyR = 5.9 + 0.35;
  // early: penguin + shrimp + crack; late (line 5): penguin + colony
  const toColony = sstep(L(5).f0, L(5).f0 + 60, f);
  const left = lerp(
    Math.min(penTailX, shrX - 0.6, -0.2),
    Math.min(penTailX, colonyL),
    toColony,
  );
  const right = lerp(
    Math.max(penHeadX, shrX + 0.6, 0.9),
    Math.max(penHeadX, colonyR),
    toColony,
  );
  const { mid: midX, z } = frameExtent(left, right, 1.3);
  const midY = 1.35;
  camera.position.set(midX * 0.97, midY + 0.3 + Math.sin(f * 0.016) * 0.05, z);
  camera.lookAt(midX * 0.98, midY - 0.35, 0);
}
