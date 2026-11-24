import * as THREE from "three";
import { KudaLautRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;

// Beats:
//  0  12–292   seahorse left, hesitant; whale right, calm
//  1 304–476   whale shifts to block the current, fin pointing at the seaweed
//  2 488–602   countdown, seahorse bends (anticipation), swims right, bubble trail
//  3 611–786   current strengthens: seahorse tumbles and is dragged left-down
//              facing its direction of travel; whale RISES clear of the drag
//              path (vertical motion, so its leftward facing never conflicts)
//  4 798–945   seahorse droops and turns toward the whale; whale descends to
//              comfort it from above-left (heads close, never merged)
//  5 957–1157  whale turns, then both swim right together — seahorse
//              ALONGSIDE the whale's lower flank (no fin-grip, no riding the back)
//  6 1169–1351 seahorse swims on alone to the seaweed, passing IN FRONT OF
//              the whale's fin (z-shift — it is too tall to pass under or
//              over the fin); whale waits behind; tail curls, sparkles
//  7 1363–1542 side by side: seahorse waves a fin, whale spouts water
//
// Perbaikan visual 24 Nov 2026 (cacat pola dari adegan lain):
//  - ry kuda laut TIDAK PERNAH dipakai sebelum ini (SEA_KEYS.ry data mati —
//    rotation.y tidak pernah disetel), jadi ia selalu menghadap kanan meski
//    diseret ke kiri. Kini disalurkan lewat keyLerp.
//  - Giliran 3: paus tidak lagi berenang kanan sambil menghadap kiri; ia NAIK
//    (gerak vertikal) menjauhi jalur seret, kuda laut berputar menghadap kiri.
//  - Giliran 5 "pegang sirip" DISEDERHANAKAN jadi "berenang berdampingan":
//    posisi sirip yang sebenarnya (di bawah perut paus) membuat pegangan
//    mustahil dibaca tanpa menempelkan kuda laut ke perut paus.
//  - Teleport f1157 dihapus: kuda laut berenang lepas dari sisi paus ke
//    rumput laut selama giliran 6; paus menunggu di belakang (tidak lagi
//    berenang melewati kuda laut — dulu siripnya menyapu ekor kuda laut).

const SEA_KEYS = [
  { f: 0, x: -2.0, y: -0.5, ry: 0 },
  { f: 476, x: -1.9, y: -0.4, ry: 0 },
  { f: 560, x: -1.7, y: -0.3, ry: 0 },
  { f: 602, x: 1.5, y: 0.0, ry: 0 },
  // line 3: the current grabs the seahorse — it tumbles (ry 0→π) and is
  // dragged left-down, ALWAYS facing its direction of travel (ry=π)
  { f: 630, x: 1.15, y: -0.75, ry: Math.PI },
  { f: 680, x: 0.3, y: -1.25, ry: Math.PI },
  { f: 730, x: -0.8, y: -1.32, ry: Math.PI },
  { f: 786, x: -1.6, y: -1.35, ry: Math.PI },
  // line 4: it slowly turns back toward the approaching whale
  { f: 860, x: -1.6, y: -1.35, ry: 0 },
  { f: 945, x: -1.6, y: -1.35, ry: 0 },
  // line 5: alongside the whale (position overridden below, so this key only
  // has to match the station exactly at f1157 for a seamless handover);
  // line 6: it swims on alone to the seaweed on a smooth rising diagonal
  { f: 1157, x: -0.3, y: -1.0, ry: 0 },
  { f: 1330, x: 2.9, y: -0.7, ry: 0 },
  { f: 1617, x: 2.9, y: -0.7, ry: 0 },
];

const WHALE_KEYS = [
  { f: 0, x: 1.9, y: 0.2, ry: Math.PI },
  { f: 476, x: -0.4, y: 0.0, ry: Math.PI },
  { f: 602, x: -0.3, y: 0.0, ry: Math.PI },
  // line 3: the whale RISES clear of the drag path (vertical motion, so its
  // leftward facing never conflicts with its travel) instead of swimming
  // right backwards into the seahorse
  { f: 660, x: -0.3, y: 1.15, ry: Math.PI },
  { f: 786, x: -0.3, y: 1.15, ry: Math.PI },
  // line 4: descend to comfort the seahorse — moving left, facing left
  { f: 945, x: -0.6, y: 0.5, ry: Math.PI },
  { f: 960, x: -0.6, y: 0.5, ry: Math.PI },
  { f: 1000, x: -0.6, y: -0.4, ry: 0 },   // turn in place (down only), then swim right in profile
  // line 5: swim right together; lines 6–7: WAIT behind while the seahorse
  // swims on alone to the seaweed (no more swimming past it, so the fin
  // never sweeps through its tail)
  { f: 1157, x: 0.6, y: -0.1, ry: 0 },
  { f: 1351, x: 0.6, y: -0.1, ry: 0 },
  { f: 1617, x: 0.6, y: -0.1, ry: 0 },
];

export function poseFrame(frame: number, refs: KudaLautRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const seaM = mouthVal(MOUTH, "seahorse", f);
  const whaleM = mouthVal(MOUTH, "whale", f);

  // ---- whale -------------------------------------------------------------
  const wh = keyLerp(WHALE_KEYS, f);
  refs.whale.position.set(wh.x, wh.y, -0.6);
  refs.whale.rotation.y = wh.ry;
  // slow swimming undulation + tail sway
  const swim = 0.06 * Math.sin(f * 0.09);
  refs.whaleBodyG.rotation.z = swim;
  refs.whaleBodyG.position.y = Math.sin(f * 0.07) * 0.06;
  refs.whaleTailG.rotation.y = Math.sin(f * 0.09 - 0.9) * 0.22;
  // stretch while blocking the current (line 1)
  const brace = sstep(304, 360, f) * (1 - sstep(440, 480, f));
  refs.whaleBodyG.scale.set(1 + 0.06 * brace, 1 - 0.03 * brace, 1);
  // fins: point at the seaweed (line 1), brace the seahorse (line 5)
  const point = sstep(320, 360, f) * (1 - sstep(440, 480, f));
  refs.whaleFinL.rotation.x = -0.5 * point + Math.sin(f * 0.08) * 0.08;
  refs.whaleFinR.rotation.x = 0.5 * point - Math.sin(f * 0.08) * 0.08;
  // jaw + head nod while speaking
  refs.whaleJawG.rotation.z = -whaleM * 0.4;
  refs.whaleHeadG.rotation.z = Math.sin(f * 0.45) * 0.03 * whaleM
    - 0.2 * sstep(611, 660, f) * (1 - sstep(760, 800, f)); // worried turn in line 3
  applyBlink(refs.whaleEyeL, refs.whaleEyeR, f, 60, 140);
  // spout in the finale
  refs.spoutG.visible = line === 7;
  if (line === 7) {
    refs.spoutG.children.forEach((c, i) => {
      const ph = ((f - 1363) * 0.06 + i * 0.35) % 1.6;
      c.position.set(Math.sin(i * 2.3) * 0.25 * ph, ph * 1.1, Math.cos(i * 1.7) * 0.2 * ph);
      const s = 0.5 + ph * 0.9;
      c.scale.setScalar(s);
    });
  }

  // ---- seahorse -----------------------------------------------------------
  // ry was NEVER applied before (SEA_KEYS.ry was dead data — rotation.y was
  // never set), so the seahorse always faced right even while being dragged
  // left. It is wired through keyLerp now: the seahorse faces its direction
  // of travel on every segment.
  const s = keyLerp(SEA_KEYS, f);
  let sx: number, sy: number;
  if (f >= 957 && f < 1157) {
    // swimming ALONGSIDE the whale's lower flank. The old "grip the fin"
    // pose put the seahorse on the whale's back, ~1.35 above the fin centre,
    // and its tail through the fin — the real fin sits under the whale's
    // belly, so a grip cannot read without plastering the seahorse to the
    // belly. Station is clear of the fin, the tail fluke and the dorsal
    // line; the tail curls in open water below the belly.
    const t = sstep(957, 1000, f);
    sx = lerp(-1.6, wh.x - 0.9, t);
    sy = lerp(-1.35, wh.y - 0.9, t);
  } else {
    sx = s.x; sy = s.y;
  }
  // Line 6 crosses the whale's near fin in x (fin spans x 0.65–2.15, y band
  // −0.84…−0.56). The seahorse is 1.3 tall, so it can pass neither under the
  // fin (its body always reaches the fin's band) nor over it (its head would
  // cross the whale's dorsal line). Instead it passes IN FRONT of the fin:
  // z 0.6→1.25 while its tail is inside the fin's x-range (ramp in/out
  // safely outside the overlap window), z-gap 0.28 to the fin's front face.
  const finPass = sstep(1160, 1195, f) * (1 - sstep(1305, 1340, f));
  refs.seahorse.position.set(sx, sy, 0.6 + 0.65 * finPass);
  refs.seahorse.rotation.y = s.ry;
  // gentle current sway — never frozen
  const sway = Math.sin(f * 0.08) * 0.05;
  refs.seaBodyG.rotation.z = sway
    - 0.35 * sstep(488, 540, f) * (1 - sstep(580, 610, f))   // anticipation bend
    - 0.3 * sstep(798, 850, f) * (1 - sstep(920, 957, f));   // droop when sad
  refs.seaBodyG.position.y = Math.sin(f * 0.11) * 0.04;
  // tail: curled when gripping, loose when dragged (line 3)
  const loose = sstep(611, 660, f) * (1 - sstep(1150, 1180, f));
  refs.seaTailG.rotation.z = loose * 0.9;
  refs.seaTailG.scale.set(1 + 0.25 * (1 - loose), 1, 1);
  // dorsal fin flutter (follow-through)
  refs.seaFinG.rotation.y = Math.sin(f * 0.16 - 0.8) * 0.35;
  refs.seaFinG.rotation.z = 0.1 + Math.sin(f * 0.11) * 0.08;
  // jaw + head bob while speaking
  refs.seaJawG.rotation.z = -seaM * 0.5;
  refs.seaHeadG.rotation.z = Math.sin(f * 0.5) * 0.05 * seaM
    - 0.25 * sstep(798, 850, f) * (1 - sstep(920, 957, f));
  // wave a fin at the close
  if (line === 7) {
    refs.seaFinG.rotation.y += Math.sin(f * 0.5) * 0.4;
  }
  applyBlink(refs.seaEyeL, refs.seaEyeR, f, 33, 130);

  // ---- seaweed sway (wild in the strong current, line 3) ------------------
  const wild = line === 3 ? 1 : 0.25;
  refs.seaweed.forEach((b, i) => {
    const ph = b.userData.phase as number;
    b.rotation.z = Math.sin(f * 0.05 * (line === 3 ? 2.2 : 1) + ph) * 0.16 * wild;
  });

  // ---- bubbles rising (loop, pure function of frame) ----------------------
  refs.bubblesG.children.forEach((c, i) => {
    const speed = 0.012 + (i % 4) * 0.004;
    const y = -2.0 + (((f * speed + i * 0.53) % 1) * 5.2);
    c.position.set(-3.5 + (i % 6) * 1.3 + Math.sin(f * 0.02 + i) * 0.25, y, -0.5 + (i % 3) * 0.6);
    c.scale.setScalar(0.6 + ((i * 0.37) % 1) * 0.7);
  });

  // ---- current streaks drift right (faster in line 3) ----------------------
  refs.currentG.children.forEach((c, i) => {
    const sp = line === 3 ? 0.09 : 0.035;
    c.position.x = -5 + (((f * sp + i * 2.1) % 10));
    c.position.y = -1 + i * 0.9 + Math.sin(f * 0.01 + i) * 0.15;
  });

  pulseSparkles(refs.sparkles, f, line === 6 || line === 7);

  // ---- camera: frame by true extents (whale head/tail flip with its turn) --
  // tail extent 3.3 includes the fluke lobes; head extent 2.2 includes the jaw
  const headX = wh.x + 2.2 * Math.cos(wh.ry);
  const tailX = wh.x - 3.3 * Math.cos(wh.ry);
  const left = Math.min(sx - 0.4, headX, tailX);
  const right = Math.max(sx + 0.4, headX, tailX);
  const { mid: midX, z } = frameExtent(left, right, 1.2);
  const midY = (sy + 0.5 + wh.y) / 2;
  camera.position.set(midX * 0.8, midY + 0.3 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, midY - 0.2, 0);
}
