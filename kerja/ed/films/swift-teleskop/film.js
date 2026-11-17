// "Teleskop NASA Jatuh di Langit Sumatra" — the camera and the beats. Every
// time comes from storyboard.json; the cam labels in filmshots.json place the
// camera; the state beats (the fireball, the slew, the swelling air, the
// chart, the spin, the second fall) are keyed by shot id below.
import { createFilm } from "../../kit/engine/motion.js";
import { createWorld } from "./world.js";

const storyboard = await (await fetch("storyboard.json")).json();
const meta = await (await fetch("filmshots.json")).json();
const film = await createFilm({ storyboard });
const { tl, gsap, $, stage, shots: s } = film;

const world = createWorld($("#world"), s);
const S = world.S;
film.each((t) => world.draw(t));
film.captions(); // pill subtitles from the board's voice lines

Object.assign(stage, { lx: 0.5, ly: 0.3, glow: 0.35, floor: 1 });
film.light({ glow: 0.55 }, s.s24.start, 2.0);   // the burst act burns amber
film.light({ glow: 0.35 }, s.s39.start, 2.0);   // and settles for the long fall

// A camera position for every cam label the builder used.
const CAMS = {
  "sumatra-wide":   { x: 0,     y: 560, z: 0.95 },
  "sumatra-streak": { x: 60,    y: 530, z: 1.02 },
  "sumatra-macro":  { x: 30,    y: 590, z: 1.65 },
  "orbit-wide":     { x: 3200,  y: 540, z: 0.95 },
  "orbit-diagram":  { x: 3200,  y: 520, z: 1.05 },
  "orbit-macro":    { x: 3200,  y: 470, z: 1.70 },
  "burst-wide":     { x: 6400,  y: 540, z: 0.95 },
  "burst-diagram":  { x: 6480,  y: 520, z: 1.08 },
  "burst-macro":    { x: 6640,  y: 500, z: 1.55 },
  "panels-ui":      { x: 9600,  y: 540, z: 1.00 },
  "atmos-diagram":  { x: 12800, y: 540, z: 1.00 },
  "atmos-macro":    { x: 12650, y: 560, z: 1.35 },
  "chart-chart":    { x: 16000, y: 540, z: 1.00 },
  "rescue-wide":    { x: 19200, y: 540, z: 0.95 },
  "rescue-diagram": { x: 19200, y: 530, z: 1.10 },
  "rescue-compare": { x: 19200, y: 540, z: 1.22 },
  "rescue-macro":   { x: 19520, y: 520, z: 1.65 },
  "map-wide":       { x: 22400, y: 540, z: 0.95 },
  "map-diagram":    { x: 22400, y: 540, z: 1.08 },
  "map-macro":      { x: 22340, y: 500, z: 1.55 },
  "legacy-wide":    { x: 25600, y: 540, z: 0.95 },
  "legacy-panels":  { x: 25600, y: 540, z: 1.05 },
  "legacy-macro":   { x: 25600, y: 540, z: 1.45 },
};
const camFor = (m) => CAMS[m.cam] || CAMS["orbit-wide"];

// ── camera: smooth travel, or a fade through black when the set changes ─────
let prev = camFor(meta[0]);
tl.set(S.cam, prev, 0);
for (const m of meta) {
  const shot = s[m.id], dur = shot.end - shot.start, tgt = camFor(m);
  const jump = Math.abs(tgt.x - prev.x) > 1600;
  if (jump && shot.start > 0.1) {
    tl.to(S, { fade: 1, duration: 0.16, ease: "power2.in" }, shot.start - 0.16);
    tl.set(S.cam, tgt, shot.start);
    tl.to(S, { fade: 0, duration: 0.3, ease: "power2.out" }, shot.start);
  } else if (shot.start > 0.1) {
    const mv = Math.min(1.4, dur * 0.45);
    tl.to(S.cam, { ...tgt, duration: mv, ease: "power3.inOut" }, shot.start);
    tl.to(S.cam, { z: tgt.z * 1.045, duration: dur - mv, ease: "none" }, shot.start + mv);
  }
  prev = { ...tgt, act: m.act };
}

// ── state beats, keyed by shot id ────────────────────────────────────────────
const BEATS = {
  s04: [["streakA", 1]],                        // the fireball crosses the coast sky
  s06: [["streakA", -1]],                       // spent — a plain night again
  s19: [["panelA", 0.25], ["panelB", 0.25], ["panelC", 0.25]],
  s20: [["panelA", 1], ["panelB", 0.15], ["panelC", 0.15]],
  s21: [["panelB", 1], ["panelA", 0.15], ["panelC", 0.55]],
  s22: [["burstI", 0.55]],                      // the UVOT line plays over the burst itself
  s24: [["burstI", 1]],
  s27: [["slew", 1]],                           // Swift turns to the burst (seen on the burst stage)
  s44: [["chartP", 0.45]],
  s46: [["swell", 0.6]],
  s48: [["swell", 1], ["sinkP", 0.35]],
  s49: [["chartP", 0.75]],
  s52: [["chartP", 1]],
  s53: [["sinkP", 0.62]],
  s64: [["arms", 0.65]],                        // the plan: arms open
  s66: [["thrust", 1]],
  s67: [["thrust", 0]],
  s71: [["spin", 0.55]],                        // the wheels fail
  s73: [["spin", 1]],
  s77: [["spin", 0.12]],                        // tamed — at a price
  s81: [["spin", 0]],                           // the decision
  s85: [["measure", 1]],
  s86: [["arms", 1], ["thrust", 1]],            // the rehearsal, 12–15 km away
  s87: [["thrust", 0], ["measure", 0]],
  s88: [["linkFall", 0.5]],                     // the rescuer falls first
  s90: [["linkFall", 1]],
  s91: [["lowOrb", 1]],                         // Swift on the low ring now
  s102: [["mapP", 0.4]],
  s107: [["entryI", 1]],                        // the air itself catches fire (atmos stage)
  s108: [["streakA", 1]],                       // and the coast sees him break apart
  s109: [["mapP", 1]],
  s116: [["archI", 0.4]],
  s117: [["archI", 0.65]],
  s118: [["archI", 0.85]],
  s119: [["archI", 1]],
};
for (const m of meta) {
  const beats = BEATS[m.id];
  if (!beats) continue;
  const t = s[m.id].start, d = s[m.id].end - s[m.id].start;
  for (const [prop, to] of beats) {
    if (prop === "streakA" && to === 1) { // the fireball always starts from the top of the sky
      tl.fromTo(S, { streakA: 0 }, { streakA: 1, duration: Math.max(0.8, d * 0.85), ease: "power1.inOut" }, t + d * 0.05);
    } else {
      tl.to(S, { [prop]: to, duration: Math.max(0.8, d * 0.85), ease: "power1.inOut" }, t + d * 0.05);
    }
  }
}

// ── the end card ──────────────────────────────────────────────────────────────
const endStart = s[meta[meta.length - 3].id].start; // s122: the legacy turns to farewell
tl.to(S, { dim: 0.8, duration: 2.2, ease: "power2.inOut" }, endStart);
const typeShot = meta[meta.length - 2], cardShot = meta[meta.length - 1]; // s123, s124
film.scene("#end", s[typeShot.id].start, storyboard.duration);
tl.to(S, { dim: 1, duration: 0.8 }, s[typeShot.id].start);
gsap.set("#endline", { autoAlpha: 0 });
film.show("#endline", s[typeShot.id].start + 0.4, 0.8);
film.typeIn(film.split("#end-a"), s[typeShot.id].start + 0.5);
film.typeIn(film.split("#end-b"), s[cardShot.id].start + 0.3);
film.sheen("#endline", s[cardShot.id].start + 1.6, 1.2);

film.finish();
