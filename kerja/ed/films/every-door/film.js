// "Every Door Is Different" — the long Imam Malik film. Every time comes from
// storyboard.json; the cam labels in filmshots.json (written by storyboard.build.py)
// place the camera and fire the world's state changes. The narration is not yet recorded
// (see NOTES.md), so the picture is cut to the storyboard's planned times; when the take
// exists, voice.mjs rewrites the board and this file follows it unchanged.
import { createFilm } from "../../kit/engine/motion.js";
import { createWorld } from "./world.js";

const storyboard = await (await fetch("storyboard.json")).json();
const meta = await (await fetch("filmshots.json")).json();
const film = await createFilm({ storyboard });
const { tl, gsap, $, stage, shots: s } = film;

const world = createWorld($("#world"), s);
const S = world.S;
film.each((t) => world.draw(t));
film.captions(); // pill subtitles from the board's voice lines, key phrases in amber

Object.assign(stage, { lx: 0.5, ly: 0.32, glow: 0.5, floor: 1 });
film.light({ glow: 0.72 }, s.s44.start, 2.0);   // the doors act opens up
film.light({ glow: 0.55 }, s.s98.start, 2.0);   // and settles for the peace

const DOORX = [5140, 5570, 6000, 6430, 6860];
const doorOf = (m) => { const d = /door(\d)/.exec(m.cam); return d ? +d[1] : 0; };

function camFor(m) {
  const { act, type, cam } = m;
  const macro = type === "macro";
  if (act === "hook" || act === "night" || act === "light") {
    if (cam === "majelis-birdaway") return { x: 1500, y: 545, z: 0.8 };
    if (cam === "light-city" || cam === "light-streets") return { x: 9000, y: 545, z: 0.92 };
    let x = 0;
    if (cam.includes("letter") || cam.includes("desk") || cam.includes("pen")) x = 170;
    if (cam.includes("portico") || cam.includes("sleeper")) x = -120;
    return { x, y: 550, z: macro ? 1.8 : type === "type" ? 1.12 : type === "diagram" ? 0.9 : 1.0 };
  }
  if (act === "worshipper") {
    if (type === "compare") return { x: 2820, y: 560, z: 0.76 };
    return { x: 2960, y: 555, z: macro ? 1.85 : type === "type" ? 1.1 : 1.0 };
  }
  if (act === "demand") {
    if (cam.startsWith("hut")) return { x: 3260, y: 555, z: 1.55 };
    return { x: 0, y: 550, z: type === "type" ? 1.1 : 0.98 };
  }
  if (act === "doors") {
    const d = doorOf(m);
    if (!d) return { x: 6000, y: 560, z: cam === "doors-reply" ? 1.3 : 0.6 };
    // Macro subjects in this act sit ON the door floor (y=910): the push-in must aim
    // low and stay wide enough to keep the floor in frame. (At the old y=555, z=1.7
    // the visible band ended at y≈873 and the prostration in s53 left the picture —
    // caught by the stills QC, 16 Nov 2026.)
    if (macro) return { x: DOORX[d - 1], y: 640, z: 1.45 };
    return { x: DOORX[d - 1], y: 555, z: type === "diagram" ? 0.95 : 1.12 };
  }
  if (act === "peace") return { x: 0, y: 545, z: 1 }; // the split screen drives itself
  if (act === "city") {
    return { x: 9000, y: 550, z: macro ? 1.8 : type === "compare" ? 0.9 : type === "diagram" || type === "recap" ? 0.74 : 1.0 };
  }
  return { x: 9000, y: 545, z: 1.0 }; // endcard: the city, dimming
}

// ── camera: smooth travel, or a fade through black when the set changes ───────
let prev = camFor(meta[0]);
tl.set(S.cam, prev, 0);
for (const m of meta) {
  const shot = s[m.id], dur = shot.end - shot.start, tgt = camFor(m);
  const jump = Math.abs(tgt.x - prev.x) > 1600 || (m.act === "peace") !== (prev.act === "peace");
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

// ── state beats, keyed by the board's cam labels ──────────────────────────────
const at = (m) => s[m.id].start, durOf = (m) => s[m.id].end - s[m.id].start;
const pose = (bow, pros, sit, t, d = 0.7) => {
  tl.to(S, { umariBow: bow, duration: d, ease: "power2.inOut" }, t);
  tl.to(S, { umariPros: pros, duration: d, ease: "power2.inOut" }, t);
  tl.to(S, { umariSit: sit, duration: d, ease: "power2.inOut" }, t);
};
for (const m of meta) {
  const t = at(m), d = durOf(m), cam = m.cam;
  if (cam === "majelis-letter") {
    tl.fromTo(S, { bird: 0 }, { bird: 1, duration: d * 0.7, ease: "power1.inOut" }, t);
    tl.to(S, { letter: 1, duration: 0.4 }, t + d * 0.62);
    tl.set(S, { bird: -1 }, t + d * 0.75);
  }
  if (cam === "majelis-alone") tl.to(S, { studentsDim: 1, duration: 1.2 }, t + 0.3);
  if (cam === "majelis-letterclose") tl.to(S, { studentsDim: 0.55, duration: 1 }, t);
  if (cam === "majelis-birdaway") {
    tl.to(S, { studentsDim: 0, duration: 1 }, t);
    tl.fromTo(S, { bird: 0 }, { bird: 1, duration: d * 0.9, ease: "power1.in" }, t);
    tl.set(S, { bird: -1 }, t + d * 0.95);
  }
  if (m.act === "worshipper") {
    if (cam === "mountain-stand") pose(1, 0, 0, t + d * 0.55, 1.1);
    else if (cam === "mountain-bow") pose(1, 0, 0, t, 0.4);
    else if (cam === "mountain-prostrate") pose(0, 1, 0, t + 0.2, 1.0);
    else if (cam === "mountain-cycle") {
      pose(1, 0, 0, t + d * 0.25, 0.9); pose(0, 1, 0, t + d * 0.55, 0.9); pose(0, 0, 0, t + d * 0.85, 0.7);
    } else if (["mountain-face", "mountain-beads", "mountain-peace", "mountain-rug"].includes(cam)) pose(0, 0, 1, t, 0.6);
    else pose(0, 0, 0, t, 0.6);
  }
  if (cam === "vision-scattered") { tl.to(S, { vision: 1, duration: 0.7 }, t); tl.to(S, { scatter: 1, duration: 1.4 }, t + 0.3); }
  if (cam === "vision-emptyhall") tl.to(S, { studentsDim: 1, duration: 1.2 }, t);
  if (cam === "vision-walking") tl.to(S, { studentsDim: 0.35, duration: 1 }, t);
  if (m.act === "night" && cam === "night-reading") {
    tl.to(S, { vision: 0, scatter: 0, studentsDim: 0, duration: 0.6 }, t);
  }
  if (m.act === "doors") {
    const dn = doorOf(m);
    if (cam === "doors-arc") tl.to(S, { arc: 1, duration: 1.2 }, t);
    if (dn) {
      const glows = { duration: 0.9, ease: "power2.out" };
      S.doorGlow.forEach((g, i) => { glows[i] = i === dn - 1 ? 1 : Math.max(g, 0.45); });
      tl.to(S.doorGlow, glows, t);
    }
    if (cam === "doors-survey" || cam === "doors-all") tl.to(S.doorGlow, { 0: 0.9, 1: 0.9, 2: 0.9, 3: 0.9, 4: 0.9, duration: 1 }, t);
    if (cam === "door1-praying") tl.to(S, { d1bow: 1, duration: 1.1 }, t + d * 0.5);
    if (cam === "door1-prostrate") { tl.to(S, { d1bow: 0, duration: 0.5 }, t); tl.to(S, { d1pros: 1, duration: 1 }, t + d * 0.2); }
    if (cam === "door1-rose") tl.to(S, { d1pros: 0, d1bow: 0, duration: 1 }, t + 0.2);
  }
  if (cam === "light-multiply") tl.to(S, { chain: 0.5, duration: d * 0.8 }, t);
  if (cam === "light-student") { tl.to(S, { chain: 0.75, duration: 1 }, t); tl.fromTo(S, { carry: 0 }, { carry: 1, duration: d * 0.85, ease: "power1.inOut" }, t + 0.2); }
  if (cam === "light-family") { tl.set(S, { carry: -1 }, t); tl.to(S, { chain: 1, duration: 1 }, t); }
  if (cam === "light-city") tl.to(S, { cityLit: 0.5, duration: d * 0.9 }, t);
  if (cam === "light-streets") tl.to(S, { cityLit: 0.68, duration: d * 0.9 }, t);
  if (cam === "light-lampfromlamp") tl.to(S, { cityLit: 0.8, duration: d * 0.8 }, t);
  if (cam === "light-another") tl.to(S, { cityLit: 0.88, duration: d * 0.8 }, t);
  if (cam === "light-morning") tl.to(S, { dawn: 0.45, duration: d * 0.9 }, t);
  if (cam === "light-fullcircle") tl.to(S, { dawn: 0.7, duration: d * 0.8 }, t);
  if (m.act === "peace" && cam === "peace-split") { tl.to(S, { split: 1, seam: 1, duration: 0.7 }, t); }
  if (cam === "peace-onesky") tl.to(S, { seam: 0, duration: 1.4 }, t + 0.3);
  if (cam === "peace-bird") {
    tl.fromTo(S, { bird: 0 }, { bird: 1, duration: d * 0.85, ease: "power1.inOut" }, t);
    tl.set(S, { bird: -1 }, t + d * 0.9);
  }
  if (cam === "peace-landscape") tl.to(S, { dawn: 0.3, duration: d * 0.8 }, t);
  if (m.act === "city" && cam === "city-pullback") {
    tl.set(S, { split: 0, seam: 0 }, t);
    tl.to(S, { cityLit: 0.95, duration: d * 0.8 }, t);
  }
  if (cam === "city-yourdoor" || cam === "city-stepthrough") tl.to(S, { doorCity: 1, doorFigure: 1, duration: 1 }, t);
  if (cam === "city-recap") tl.to(S, { doorCity: 0.25, duration: 1 }, t);
  if (cam === "city-morning") tl.to(S, { dawn: 1, duration: d * 0.85 }, t);
}

// ── the end card ──────────────────────────────────────────────────────────────
const endStart = s[meta[meta.length - 4].id].start; // the endcard act's first shot
tl.to(S, { dim: 0.8, duration: 2.2, ease: "power2.inOut" }, endStart);
const typeShot = meta[meta.length - 3], cardShot = meta[meta.length - 2];
film.scene("#end", s[typeShot.id].start, storyboard.duration);
tl.to(S, { dim: 1, duration: 0.8 }, s[typeShot.id].start);
gsap.set("#endline", { autoAlpha: 0 });
film.show("#endline", s[typeShot.id].start + 0.4, 0.8);
film.typeIn(film.split("#end-a"), s[typeShot.id].start + 0.5);
film.typeIn(film.split("#end-b"), s[cardShot.id].start + 0.3);
film.sheen("#endline", s[cardShot.id].start + 1.6, 1.2);

film.finish();
