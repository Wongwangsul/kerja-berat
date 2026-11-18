// "Kabar Baik, Kabar Buruk — Kenapa Bumi Tidak Jatuh?" — a dialogue gag on the
// petir-guntur stage, under a space diorama. Every time comes from storyboard.json
// (the two-voice take set the speaking shots' times); this file only moves the
// camera, the Earth, the arrows and the figures' joints, and letters the spoken
// lines chunk by chunk so the type lands with the voice.
import { createFilm } from "../../kit/engine/motion.js";
import { createWorld, POSES } from "./world.js";

const storyboard = await (await fetch("storyboard.json")).json();
const film = await createFilm({ storyboard });
const { tl, $, shots: s } = film;

const world = createWorld($("#world"), s);
const S = world.S;
film.each((t) => world.draw(t));
// No film.captions(): the spoken lines are lettered by hand as dialogue, in the
// shots' sections in index.html (the format's own practice).

const pose = (fig, preset, at, dur = 0.5, ease = "power2.inOut") =>
  tl.to(fig.j, { ...POSES[preset], duration: dur, ease }, at);
const cam = (vars, at, dur, ease = "power3.inOut") =>
  tl.to(S.cam, { ...vars, duration: dur, ease }, at);

// ── s01: the diorama, the opening line ──────────────────────────────────────
cam({ x: 548, y: 966, z: 1.08 }, 0, s.s01.dur, "none");
pose(S.figA, "talk", s.s01.start + 0.55, 0.5);
film.scene("#d1", s.s01.start, s.s01.end);
film.pop("#d1 .who", s.s01.start + 0.08);
film.typeIn(film.split("#line1"), s.s01.start + 0.18, { stagger: 0.03 });

// ── s02: B chooses, flat ────────────────────────────────────────────────────
cam({ x: 606, y: 972, z: 1.16 }, s.s02.start, 0.85);
pose(S.figB, "palm", s.s02.start + 0.12, 0.45);
pose(S.figA, "listen", s.s02.start + 0.1, 0.5);
film.scene("#d2", s.s02.start, s.s02.end);
film.pop("#d2 .who", s.s02.start + 0.05);
film.typeIn(film.split("#line2"), s.s02.start + 0.12, { stagger: 0.034 });

// ── s03: the good news — the imagined fall ──────────────────────────────────
// Camera pushes to Earth; the amber down-arrow draws under it in the line's
// second half.
cam({ x: 330, y: 900, z: 1.45 }, s.s03.start, 1.15);
pose(S.figA, "talk", s.s03.start + 0.2, 0.5);
pose(S.figB, "listen", s.s03.start + 0.1, 0.5);
tl.to(S, { arrowDown: 1, duration: 0.7, ease: "power2.out" }, s.s03.start + s.s03.dur * 0.52);
film.scene("#d3", s.s03.start, s.s03.end);
film.pop("#d3 .who", s.s03.start + 0.05);
film.typeIn(film.split("#line3a"), s.s03.start + 0.14, { stagger: 0.03 });
film.typeIn(film.split("#line3b"), s.s03.start + s.s03.dur * 0.30, { stagger: 0.03 });
film.typeIn(film.split("#line3c"), s.s03.start + s.s03.dur * 0.62, { stagger: 0.03 });

// ── s04: no 'down' — the apple falls to the centre ──────────────────────────
tl.to(S, { crossP: 1, duration: 0.55, ease: "power2.out" }, s.s04.start + s.s04.dur * 0.18);
tl.to(S, { appleP: 1, duration: s.s04.dur * 0.42, ease: "power1.in" }, s.s04.start + s.s04.dur * 0.48);
tl.to(S, { centreGlow: 1, duration: 0.5, ease: "power2.out" }, s.s04.start + s.s04.dur * 0.88);
tl.to(S, { arrowDown: 0, duration: 0.6, ease: "power1.out" }, s.s04.end - 0.6);
tl.set(S, { crossP: 0 }, s.s04.end);
pose(S.figA, "point", s.s04.start + s.s04.dur * 0.5, 0.45);
film.scene("#d4", s.s04.start, s.s04.end);
film.pop("#d4 .who", s.s04.start + 0.05);
film.typeIn(film.split("#line4a"), s.s04.start + 0.12, { stagger: 0.03 });
film.typeIn(film.split("#line4b"), s.s04.start + s.s04.dur * 0.24, { stagger: 0.03 });
film.typeIn(film.split("#line4c"), s.s04.start + s.s04.dur * 0.48, { stagger: 0.03 });
film.typeIn(film.split("#line4d"), s.s04.start + s.s04.dur * 0.70, { stagger: 0.03 });

// ── s05: B asks; the diorama resets ─────────────────────────────────────────
cam({ x: 546, y: 966, z: 1.05 }, s.s05.start, 0.9);
pose(S.figA, "idle", s.s05.start + 0.1, 0.6);
pose(S.figB, "point", s.s05.start + s.s05.dur * 0.42, 0.45);
film.scene("#d5", s.s05.start, s.s05.end);
film.pop("#d5 .who", s.s05.start + 0.05);
film.typeIn(film.split("#line5"), s.s05.start + 0.12, { stagger: 0.03 });

// ── s06: the bad news — Earth falls toward the Sun ──────────────────────────
// The slide starts on "jatuh" (~30% in) and creeps for the rest of the shot.
const fallStart = s.s06.start + s.s06.dur * 0.30;
cam({ x: 540, y: 940, z: 1.22 }, s.s06.start, 0.9);
tl.to(S, { fallP: 1, duration: 0.8, ease: "power2.out" }, fallStart);
tl.to(S.earth, { x: 330, y: 700, duration: s.s06.end - fallStart, ease: "power1.in" }, fallStart);
tl.to(S, { warm: 1.35, duration: s.s06.dur, ease: "none" }, s.s06.start);
pose(S.figA, "talk", s.s06.start + 0.15, 0.5);
pose(S.figB, "listen", s.s06.start + 0.1, 0.5);
film.scene("#d6", s.s06.start, s.s06.end);
film.pop("#d6 .who", s.s06.start + 0.05);
film.typeIn(film.split("#line6a"), s.s06.start + 0.12, { stagger: 0.03 });
film.typeIn(film.split("#line6b"), fallStart - 0.35, { stagger: 0.032 });
film.typeIn(film.split("#line6c"), fallStart + 0.75, { stagger: 0.032 });
film.typeIn(film.split("#line6d"), s.s06.start + s.s06.dur * 0.72, { stagger: 0.032 });

// ── s07: B panics — one lightning crack ─────────────────────────────────────
cam({ x: 606, y: 972, z: 1.16 }, s.s07.start, 0.7);
tl.to(S, { flash: 1, duration: 0.06, ease: "power1.in" }, s.s07.start + 0.05);
tl.to(S, { flash: 0.25, duration: 0.09, ease: "power1.out" }, s.s07.start + 0.11);
tl.to(S, { flash: 0.85, duration: 0.05, ease: "power1.in" }, s.s07.start + 0.2);
tl.to(S, { flash: 0, duration: 0.6, ease: "power2.out" }, s.s07.start + 0.25);
tl.to(S, { tremble: 1, duration: 0.3, ease: "power1.out" }, s.s07.start + 0.1);
pose(S.figA, "handsUp", s.s07.start + 0.12, 0.35, "power2.out");
pose(S.figB, "handsUp", s.s07.start + 0.2, 0.35, "power2.out");
film.scene("#d7", s.s07.start, s.s07.end);
film.pop("#d7 .who", s.s07.start + 0.05);
film.typeIn(film.split("#line7"), s.s07.start + 0.12, { stagger: 0.03 });

// ── s08: the rescue — sideways, fast ────────────────────────────────────────
// Earth veers up and past the Sun on "menyamping" (~35% in), streaks trailing.
const veer = s.s08.start + s.s08.dur * 0.35;
cam({ x: 540, y: 960, z: 1.0 }, s.s08.start, 0.95);
tl.to(S, { tremble: 0, duration: 0.3, ease: "power1.out" }, s.s08.start);
tl.to(S, { fallP: 0, duration: 0.4, ease: "power1.out" }, veer);
tl.to(S.earth, { x: 470, y: 540, duration: s.s08.end - veer, ease: "power2.out" }, veer);
tl.to(S, { speedP: 1, duration: 0.35, ease: "power2.out" }, veer);
tl.to(S, { speedP: 0, duration: 0.7, ease: "power1.out" }, s.s08.end - 0.7);
pose(S.figA, "palm", s.s08.start + 0.15, 0.5);
pose(S.figB, "listen", s.s08.start + 0.3, 0.6);
film.scene("#d8", s.s08.start, s.s08.end);
film.pop("#d8 .who", s.s08.start + 0.05);
film.typeIn(film.split("#line8a"), s.s08.start + 0.12, { stagger: 0.03 });
film.typeIn(film.split("#line8b"), veer - 0.45, { stagger: 0.03 });
film.typeIn(film.split("#line8c"), s.s08.start + s.s08.dur * 0.58, { stagger: 0.03 });
film.typeIn(film.split("#line8d"), s.s08.start + s.s08.dur * 0.78, { stagger: 0.03 });

// ── s09: the payoff — the loop completes on "orbit" ─────────────────────────
// Earth settles onto the ellipse's top point, then rides one full loop; the
// ellipse lights as it goes. The loop's last stretch carries into s10–s11.
tl.set(S.earth, { x: 540, y: 525 }, s.s09.start);
tl.set(S, { orbiting: 1, orbA: -1.78 }, s.s09.start);
tl.to(S, { orbA: -1.78 + Math.PI * 2, duration: s.s09.dur * 0.92, ease: "none" }, s.s09.start + s.s09.dur * 0.08);
tl.to(S, { ellipse: 1, duration: s.s09.dur * 0.9, ease: "none" }, s.s09.start + s.s09.dur * 0.08);
tl.to(S, { warm: 1, duration: s.s09.dur, ease: "none" }, s.s09.start);
pose(S.figA, "talk", s.s09.start + 0.15, 0.5);
pose(S.figB, "delight", s.s09.start + s.s09.dur * 0.5, 0.5);
film.scene("#d9", s.s09.start, s.s09.end);
film.pop("#d9 .who", s.s09.start + 0.05);
film.typeIn(film.split("#line9a"), s.s09.start + 0.12, { stagger: 0.03 });
film.typeIn(film.split("#line9b"), s.s09.start + s.s09.dur * 0.38, { stagger: 0.03 });
film.typeIn(film.split("#line9c"), s.s09.start + s.s09.dur * 0.66, { stagger: 0.03 });

// ── s10: the recap, wordless — Earth keeps looping ──────────────────────────
tl.to(S, { orbA: -1.78 + Math.PI * 2 + Math.PI * 1.1, duration: s.s10.dur + s.s11.dur, ease: "none" }, s.s10.start);
pose(S.figA, "listen", s.s10.start + 0.2, 0.6);
pose(S.figB, "listen", s.s10.start + 0.3, 0.6);
tl.to(S.figA.j, { hx: 0.09, duration: s.s10.dur * 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, s.s10.start + 0.3);
tl.to(S.figB.j, { hx: -0.03, duration: s.s10.dur * 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, s.s10.start + 0.45);
film.scene("#d10", s.s10.start, s.s10.end);
film.typeIn(film.split("#line10"), s.s10.start + 0.85, { stagger: 0.03 });

// ── s11: the end card over the dimming stage ────────────────────────────────
film.scene("#s11", s.s11.start, storyboard.duration);
tl.to(S, { dim: 0.55, duration: 1.3, ease: "power2.inOut" }, s.s11.start);
cam({ z: 1.05 }, s.s11.start, s.s11.dur, "none");
pose(S.figA, "tired", s.s11.start + 0.4, 0.85);
pose(S.figB, "cross", s.s11.start + 0.55, 0.85);
film.show("#series", s.s11.start + 0.35, 0.7);
film.typeIn(film.split("#end-a"), s.s11.start + 0.55, { stagger: 0.03 });
film.typeIn(film.split("#end-a2"), s.s11.start + 0.85, { stagger: 0.03 });
film.typeIn(film.split("#end-b"), s.s11.start + 1.25, { stagger: 0.03 });
film.sheen("#endline", s.s11.start + 2.3, 1.1);

film.finish();
