import * as THREE from "three";
import { PausRefs } from "./world";
import {
  sstep, lerp, keyLerp, lineAt, mouthVal, applyBlink, pulseSparkles, frameExtent,
} from "../../shared/kit";
import timing from "./timing.json";

const LINES = timing.lines;
const FRAMES = timing.frames;
const MOUTH = timing.mouth as unknown as Record<string, number[]>;
const st = (i: number) => LINES[i].f0;
const en = (i: number) => LINES[i].f1;

// Beats (6 giliran):
//  0  establishing — paus kiri, kepiting di karang kanan; paus bernyanyi
//  1  paus bersiap (antisipasi), kepiting mengangkat capit menghitung
//  2  paus menyembur kuat — semburan membelok kena arus, menghantam karang;
//     kepiting menunduk menghindar
//  3  paus lesu menunduk; kepiting mengangkat capit menenangkan
//  4  paus menengadah ke cahaya permukaan yang meredup; kepiting meraih rumput laut
//  5  kepiting menjepit rumput laut penanda; paus menyembur tepat di atasnya —
//     gelembung naik lurus sampai permukaan; penutup berdampingan di karang

function whaleKeys() {
  return [
    { f: 0, x: -1.8, y: 0.3, ry: 0 },
    { f: en(0), x: -1.8, y: 0.3, ry: 0 },
    { f: st(1), x: -1.7, y: 0.15, ry: 0 },
    { f: en(1), x: -1.6, y: 0.1, ry: 0 },
    { f: st(2), x: -1.5, y: 0.2, ry: 0 },
    { f: en(2), x: -1.5, y: 0.2, ry: 0 },
    { f: st(3), x: -2.0, y: -0.7, ry: 0 },
    { f: en(3), x: -2.0, y: -0.7, ry: 0 },
    { f: st(4), x: -1.9, y: -0.4, ry: 0 },
    { f: en(4), x: -1.6, y: -0.1, ry: 0 },
    { f: st(5) + 40, x: 0.85, y: 0.35, ry: 0 }, // di atas penanda rumput laut
    { f: en(5) - 60, x: 0.85, y: 0.35, ry: 0 },
    { f: FRAMES, x: 0.2, y: -0.35, ry: 0 },     // penutup berdampingan
  ];
}

function crabKeys() {
  return [
    { f: 0, x: 2.5, y: -1.5, ry: Math.PI },
    { f: en(3), x: 2.5, y: -1.5, ry: Math.PI },
    { f: st(4), x: 2.3, y: -1.5, ry: Math.PI },  // merapat ke penanda
    { f: en(4), x: 2.25, y: -1.5, ry: Math.PI },
    { f: st(5), x: 2.2, y: -1.5, ry: Math.PI },  // menjepit penanda
    { f: FRAMES, x: 2.2, y: -1.5, ry: Math.PI },
  ];
}

export function poseFrame(frame: number, refs: PausRefs, camera: THREE.PerspectiveCamera) {
  const f = frame;
  const line = lineAt(LINES, f);
  const whaleM = mouthVal(MOUTH, "whale", f);
  const crabM = mouthVal(MOUTH, "crab", f);

  // ---- whale -------------------------------------------------------------
  const wh = keyLerp(whaleKeys(), f);
  refs.whale.position.set(wh.x, wh.y, -0.6);
  refs.whale.rotation.y = wh.ry;
  // slow swimming undulation + tail sway (never frozen)
  const swim = 0.06 * Math.sin(f * 0.09);
  refs.whaleBodyG.rotation.z = swim
    - 0.14 * sstep(st(3), st(3) + 40, f) * (1 - sstep(en(3) - 30, en(3), f)); // droop lesu line 3
  refs.whaleBodyG.position.y = Math.sin(f * 0.07) * 0.06;
  const spoutBoost = (line === 2 || line === 5) ? 1.4 : 1;
  refs.whaleTailG.rotation.y = Math.sin(f * 0.09 - 0.9) * 0.22 * spoutBoost;
  // squash & stretch: antisipasi sebelum semburan (akhir line 1), regang saat menyembur (line 2)
  const antic = sstep(en(1) - 50, en(1) - 10, f) * (1 - sstep(st(2), st(2) + 25, f));
  const stretch = sstep(st(2), st(2) + 25, f) * (1 - sstep(en(2) - 20, en(2), f));
  refs.whaleBodyG.scale.set(
    1 + 0.06 * antic + 0.07 * stretch,
    1 - 0.05 * antic - 0.04 * stretch,
    1,
  );
  // fins: gentle rowing; droop down when sad (line 3)
  const finDroop = sstep(st(3), st(3) + 40, f) * (1 - sstep(en(3) - 30, en(3), f));
  refs.whaleFinL.rotation.x = -0.4 * finDroop + Math.sin(f * 0.08) * 0.08;
  refs.whaleFinR.rotation.x = 0.4 * finDroop - Math.sin(f * 0.08) * 0.08;
  // jaw + head: nod while speaking; droop in line 3; look UP in line 4
  const lookUp = sstep(st(4), st(4) + 40, f) * (1 - sstep(st(5), st(5) + 30, f));
  refs.whaleJawG.rotation.z = -whaleM * 0.4;
  refs.whaleHeadG.rotation.z = Math.sin(f * 0.45) * 0.03 * whaleM
    - 0.2 * sstep(st(3), st(3) + 40, f) * (1 - sstep(en(3) - 30, en(3), f))
    + 0.35 * lookUp;
  applyBlink(refs.whaleEyeL, refs.whaleEyeR, f, 60, 140);

  // ---- spout (blowhole bubbles) ------------------------------------------
  // mode 3: tiny song puffs (line 0) · mode 1: bent burst, hits coral (line 2)
  // mode 2: straight column above the marker (line 5)
  let mode = 0;
  if (line === 0) mode = 3;
  else if (line === 2) mode = 1;
  else if (line === 5) mode = 2;
  refs.spoutG.visible = mode !== 0;
  if (mode !== 0) {
    const t0 = mode === 1 ? st(2) : mode === 2 ? st(5) : st(0);
    refs.spoutG.children.forEach((c, i) => {
      if (mode === 1) {
        // quadratic Bezier: blowhole -> (0.4, 3.2) -> (3.0, -2.6): rises,
        // bends right with the current, dives onto the coral
        const t = (((f - t0) * 0.02 + i * 0.11) % 1);
        const u = 1 - t;
        const x = 2 * u * t * 0.4 + t * t * 3.0;
        const y = 2 * u * t * 3.2 + t * t * -2.6;
        c.position.set(x, y, Math.sin(i * 2.3) * 0.15);
        c.scale.setScalar(0.7 + 0.7 * t);
      } else if (mode === 2) {
        const ph = (((f - t0) * 0.06 + i * 0.35) % 1.6);
        c.position.set(Math.sin(i * 2.3) * 0.15 * ph, ph * 3.4, Math.cos(i * 1.7) * 0.12 * ph);
        c.scale.setScalar(0.5 + ph * 0.9);
      } else {
        const ph = (((f - t0) * 0.03 + i * 0.2) % 1.2);
        c.position.set(Math.sin(i * 2.3) * 0.2 * ph, ph * 0.9, Math.cos(i * 1.7) * 0.15 * ph);
        c.scale.setScalar(0.4 + ph * 0.4);
      }
    });
  }

  // ---- crab ---------------------------------------------------------------
  const cr = keyLerp(crabKeys(), f);
  // duck to dodge the bent burst (line 2)
  const duck = sstep(st(2) + 20, st(2) + 55, f) * (1 - sstep(en(2) - 20, en(2), f));
  refs.crab.position.set(cr.x, cr.y - 0.22 * duck, 0.6);
  refs.crab.rotation.y = cr.ry;
  // never frozen: gentle bob + leg shuffle
  refs.crabBodyG.position.y = Math.sin(f * 0.11) * 0.03 - 0.1 * duck;
  refs.crabBodyG.rotation.z = -0.12 * duck + Math.sin(f * 0.08) * 0.02;
  refs.crabLegL.rotation.z = Math.sin(f * 0.12) * 0.06;
  refs.crabLegR.rotation.z = -Math.sin(f * 0.12) * 0.06;
  // claws: count in line 1 (3 lifts), calm wave line 3, reach line 4, grip line 5
  const count = sstep(st(1), st(1) + 20, f) * (1 - sstep(en(1) - 10, en(1), f));
  const countBob = Math.max(0, Math.sin(3 * Math.PI * (f - st(1)) / Math.max(1, en(1) - st(1))));
  const calm = sstep(st(3), st(3) + 30, f) * (1 - sstep(en(3) - 20, en(3), f));
  const reach = sstep(st(4), st(4) + 40, f) * (1 - sstep(st(5), st(5) + 30, f));
  const grip = sstep(st(5), st(5) + 30, f);
  refs.crabClawL.rotation.z =
    -0.55 * count - 0.3 * count * countBob
    - 0.4 * calm + 0.22 * calm * Math.sin(f * 0.08)
    + 0.25 * reach
    + 0.2 * grip + 0.05 * grip * Math.sin(f * 0.15);
  refs.crabClawR.rotation.z =
    -0.3 * count
    - 0.25 * calm + 0.15 * calm * Math.sin(f * 0.08 + 1)
    + 0.15 * reach
    + 0.1 * grip;
  // jaw + head bob while speaking; duck lowers the head in line 2
  refs.crabJawG.rotation.z = -crabM * 0.35;
  refs.crabBodyG.rotation.x = Math.sin(f * 0.5) * 0.03 * crabM - 0.1 * duck;
  applyBlink(refs.crabEyeL, refs.crabEyeR, f, 33, 130);

  // ---- marker seaweed: sways gently, held steady once gripped (line 5) ---
  const held = sstep(st(5), st(5) + 30, f);
  refs.markerG.rotation.z = Math.sin(f * 0.05 + 0.4) * 0.14 * (1 - held * 0.85);

  // ---- seaweed sway --------------------------------------------------------
  refs.seaweed.forEach((b, i) => {
    const ph = b.userData.phase as number;
    b.rotation.z = Math.sin(f * 0.05 + ph) * 0.14;
  });

  // ---- light rays: dim as the surface light fades (line 4), return line 5 --
  const dim = 1 - 0.55 * sstep(st(4), st(4) + 40, f) * (1 - sstep(st(5), st(5) + 60, f));
  const bright = 0.02 * sstep(st(5), st(5) + 60, f);
  refs.rays.forEach((r) => {
    ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.07 * dim + bright;
  });

  // ---- ambient bubbles rising (loop, pure function of frame) --------------
  refs.bubblesG.children.forEach((c, i) => {
    const speed = 0.012 + (i % 4) * 0.004;
    const y = -2.0 + (((f * speed + i * 0.53) % 1) * 5.2);
    c.position.set(-3.5 + (i % 6) * 1.3 + Math.sin(f * 0.02 + i) * 0.25, y, -0.5 + (i % 3) * 0.6);
    c.scale.setScalar(0.6 + ((i * 0.37) % 1) * 0.7);
  });

  // ---- straight bubble column above the marker (line 5 only) --------------
  refs.columnG.visible = line === 5;
  if (line === 5) {
    refs.columnG.children.forEach((c, i) => {
      const y = 0.35 + (((f * 0.03 + i * 0.11) % 1) * 5.0);
      c.position.set(2.05 + Math.sin(f * 0.03 + i) * 0.12, y, 0.3);
      c.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(f * 0.1 + i)));
    });
  }

  pulseSparkles(refs.sparkles, f, line === 5 && f >= st(5) + 30);

  // ---- camera: frame by true extents --------------------------------------
  // whale scale 0.95: head extent +2.2, tail extent -3.2 (fluke lobes)
  const headX = wh.x + 2.2 * Math.cos(wh.ry);
  const tailX = wh.x - 3.2 * Math.cos(wh.ry);
  const left = Math.min(cr.x - 0.6, headX, tailX);
  const right = Math.max(cr.x + 0.6, headX, tailX);
  const { mid: midX, z } = frameExtent(left, right, 1.2);
  const midY = (cr.y + 0.5 + wh.y) / 2;
  camera.position.set(midX * 0.8, midY + 0.3 + Math.sin(f * 0.015) * 0.05, z);
  camera.lookAt(midX * 0.9, midY - 0.2, 0);
}
