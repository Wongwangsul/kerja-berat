// Timeline of the Tacoma pilot: "Jembatan yang Menari Sampai Runtuh" (Tacoma Narrows, 1940).
// Shots timed to the voice words (words.json). Story physics: wind-driven vertical wave growing all morning,
// then a torsional (twisting) mode, then the centre span tears off and drops. One hero car crosses, stops
// mid-span; the driver gets out and scrambles to the near bank. Camera grammar as in the bridge template:
// smootherstep glides 18-40 f, holds always creep, big reframes are cuts, impacts are 7-frame flip kicks.
export const FPS = 30;
export const TOTAL = 2070; // final voice 68.9 s at 30 fps + tail
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const SNAP = 39.16, DROP0 = 39.45, DROP1 = 40.6; // the word "robek" in words.json
export const DROP_H = 7.6;
const WAVE_F = 0.42, TWIST_F = 0.30;
export const ampV = (tau: number) => lin([[0, 0.05], [8, 0.08], [14, 0.16], [20, 0.26], [26, 0.38], [32, 0.50], [SNAP, 0.55], [SNAP + 0.4, 0]], tau);
export const ampT = (tau: number) => lin([[0, 0], [20, 0.012], [26, 0.05], [30, 0.10], [34, 0.15], [SNAP, 0.17], [SNAP + 0.4, 0]], tau);
export const waveBounce = (tau: number) => ampV(tau) * Math.sin(2 * Math.PI * WAVE_F * tau);
export const twistAt = (tau: number) => ampT(tau) * Math.sin(2 * Math.PI * TWIST_F * tau + 0.7);
/** hero car z: crosses from the far bank, stops mid-span at z = -3 (tau in seconds) */
export const carZ = (tau: number) => lin([[14.5, 34], [23.5, -3], [1e9, -3]], tau);
export const front = carZ; // legacy export for world.ts
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // legacy export
export const stomp = (_tau: number) => 1; // legacy export
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
/** the falling piece: the centre span, z in about [-16, 12] */
export const dropW = (z: number) => smooth((z + 21) / 5) * smooth((17 - z) / 5);
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean; twist: number };
export const deckY = (z: number, b: BridgeState, x = 0) => D0 + b.bounce * shapeZ(z) + b.twist * x * shapeZ(z) - b.drop * DROP_H * dropW(z);
/** deck roll angle (rad) at z, for tilting cars and people standing on it */
export const deckRoll = (z: number, b: BridgeState) => b.twist * shapeZ(z);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "traffic" | "watch" | "driver" | "wreck" | "wreckgold" | "sign" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean; sign?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 207, light: "day", crowd: "traffic", tau: (t) => t + 30.5 }, // hook flash-forward: wild twist, car mid-span
  { id: 2, a: 207, b: 498, light: "day", crowd: "traffic", tau: (t) => t, towns: true }, // setting: town aerial, calm bridge
  { id: 3, a: 498, b: 675, light: "day", crowd: "watch", tau: (t) => t }, // wind rises, watchers gather
  { id: 4, a: 675, b: 762, light: "day", crowd: "traffic", tau: (t) => t }, // the car trapped mid-span
  { id: 5, a: 762, b: 918, light: "day", crowd: "driver", tau: (t) => t }, // Leonard gets out, calls Tubby
  { id: 6, a: 918, b: 1098, light: "day", crowd: "driver", tau: (t) => t }, // the twist; he scrambles to shore
  { id: 7, a: 1098, b: 1239, light: "day", crowd: "none", tau: (t) => t }, // the break and the fall
  { id: 8, a: 1239, b: 1497, light: "day", crowd: "wreck", tau: (t) => t }, // deadpan: wreckage in the water
  { id: 9, a: 1497, b: 1797, light: "golden", crowd: "none", tau: (t) => t }, // explanation: the park swing
  { id: 10, a: 1797, b: 1920, light: "day", crowd: "sign", tau: (t) => t, sign: true }, // the new rule
  { id: 11, a: 1920, b: TOTAL, light: "golden", crowd: "wreckgold", tau: (t) => t }, // callback: the reef
];
export const XFADE: Record<number, number> = { 8: 8, 9: 8, 10: 8, 11: 8 };
export const FLASH_AT = 207;
export const COLLAPSE_ID = 7, TWIST_ID = 6, SWING_ID = 9;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export const bridgeState = (id: number, t: number): BridgeState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  if (id === 8) return { bounce: 0, drop: 1, snap: 1, collapsed: true, twist: 0 }; // wreck in the water
  if (id === 10 || id === 11) return { bounce: 0, drop: 0, snap: 0, collapsed: false, twist: 0 }; // the new bridge, calm
  if (id === 9) return { bounce: 0.35 * Math.sin(2 * Math.PI * 0.5 * (t - 49.9)), drop: 0, snap: 0, collapsed: false, twist: 0 }; // distant gentle sway behind the park
  if (id === 7) return { bounce: waveBounce(tau), drop: dropU(tau), snap: clamp01((tau - SNAP) / 0.7), collapsed: tau >= DROP1, twist: twistAt(tau) };
  return { bounce: waveBounce(tau), drop: 0, snap: 0, collapsed: false, twist: twistAt(tau) };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const Cz = (id: number, f: number) => carZ(SHOTS[id - 1].tau(T(f)));
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

// ---- framings ----
// shot 1 (hook): wide side of the twisting span, slow push; a roll key as the twist peaks
const S1a = (f: number) => dolly([16, D0 + 4.2, -19], [0, D0 + 0.9, -3], pushK(f, 0, 0.002), { fov: 40, roll: 0.04 });
const S1b = (f: number) => dolly([14, D0 + 3.4, -12], [0, D0 + 1.0, -3], pushK(f, 120, 0.002), { fov: 40, roll: 0.06 });
// shot 2 (setting): town aerial zoom pushes (template grammar)
const S2a = (f: number) => zoom([17, 13, -52], [0, 9, 4], 44, pushK(f, 201, 0.002));
const S2b = (f: number) => zoom([10, 10.5, -42], [0, 8, 8], 42, pushK(f, 290, 0.002));
const S2c = (f: number) => zoom([6, 9.5, -33], [0, 8.4, 24], 40, pushK(f, 405, 0.0015, 0.006, 35));
// shot 3 (wind rises): side tracking of the incoming hero car, then wider on the span
const S3a = (f: number) => { const C = Cz(3, f); return dolly([13.5, D0 + 2.3, C + 7], [0, D0 + 1.1, C + 1], pushK(f, 498, 0.002), { fov: 42 }); };
const S3b = (f: number) => dolly([17, D0 + 3.0, -6], [0, D0 + 0.9, 2], pushK(f, 600, 0.0018), { fov: 44, roll: -0.03 });
// shot 4 (trapped): MS of the hero car riding the wave, punch on the stop
const S4a = (f: number) => { const C = Cz(4, f); return dolly([7.2, D0 + 1.7, C - 7.0], [-0.6, D0 + 1.0, C], pushK(f, 675, 0.0022, 0.005, 25), { fov: 38 }); };
const S4b = (f: number) => { const C = Cz(4, f); return dolly([5.4, D0 + 1.5, C - 5.2], [-0.8, D0 + 1.05, C], pushK(f, 720, 0.002, 0.006, 30), { fov: 36, roll: 0.04 }); };
// shot 5 (driver out): CU two-shot of man + car door
const S5a = (f: number) => { const C = Cz(5, f); return dolly([3.6, D0 + 1.55, C - 4.4], [-0.2, D0 + 1.25, C + 0.4], pushK(f, 762, 0.0022), { fov: 36 }); };
const S5b = (f: number) => { const C = Cz(5, f); return dolly([2.9, D0 + 1.5, C - 3.4], [-0.2, D0 + 1.3, C + 0.5], pushK(f, 845, 0.002, 0.005, 28), { fov: 34, roll: -0.03 }); };
// shot 6 (twist): wide side, the whole span rolling; slow push, roll key near the peak
const S6a = (f: number) => dolly([18, D0 + 2.6, 3], [0, D0 + 0.8, -3], pushK(f, 918, 0.0016), { fov: 43 });
const S6b = (f: number) => dolly([15, D0 + 2.2, 0], [0, D0 + 0.8, -3], pushK(f, 1010, 0.0018), { fov: 41, roll: 0.055 });
// shot 7 (collapse): side wide -> cut to aerial at the tear -> cut down to the water at the slam
const S7a = (f: number) => dolly([16.5, D0 + 3.2, -19], [0, D0 + 0.4, -4], pushK(f, 1098, 0.002), { fov: 44 });
const S7b = (f: number) => dolly([26, 24, -38], [0, 3, -2], pushK(f, 1173, 0.0022), { fov: 44 });
const S7c = (f: number) => dolly([9, 2.0, -20], [0, 1.2, -6], pushK(f, 1216, 0.002), { fov: 44, roll: -0.04 });
// shot 8 (wreck): water level, slow push on the car roof
const S8a = (f: number) => dolly([6.6, 1.6, -26.4], [0.4, 0.5, -11], pushK(f, 1236, 0.0012), { fov: 40, roll: -0.02 }); // on the S11 axis, pulled back: roof centred
const S8b = (f: number) => dolly([4.9, 1.3, -22.2], [0.4, 0.5, -11], pushK(f, 1360, 0.0012), { fov: 38, roll: 0.025 });
// shot 9 (swing): the template's park framings
const S9a = (f: number) => dolly([PARK[0] + 0.55, D0 + 1.5, PARK[2] - 8], [PARK[0] + 0.55, D0 + 1.75, PARK[2]], pushK(f, 1491, 0.001), { fov: 40 });
const S9b = (f: number) => dolly([PARK[0] - 1.6, D0 + 1.9, PARK[2] - 9.5], [PARK[0] + 0.4, D0 + 1.95, PARK[2]], pushK(f, 1647, 0.0015), { fov: 42 });
// shot 10 (the rule): the engineer at the sign, then a wider calm-bridge framing
const S10a = (f: number) => zoom([1.3, D0 + 1.6, -36.6], [2.9, D0 + 1.3, -31.2], 42, pushK(f, 1791, 0.0025, 0.004, 24));
const S10b = (f: number) => dolly([7.5, D0 + 2.6, -38], [0, D0 + 1.2, -18], pushK(f, 1855, 0.0018), { fov: 42 });
// shot 11 (callback): water level by the wreck, crane out over the golden strait
const S11a = (f: number) => dolly([3.2, 1.05, -18.5], [0.4, 0.6, -11.5], pushK(f, 1914, 0.0012), { fov: 40 });
const S11b = (f: number): Shot => {
  const a = S11a(1980), s = glide((f - 1980) / 85);
  const B: V3 = [11, 9.5, -36], L: V3 = [0, 4.5, -4];
  return { pos: [0, 1, 2].map((i) => a.pos[i] + (B[i] - a.pos[i]) * s) as V3,
    look: [0, 1, 2].map((i) => a.look[i] + (L[i] - a.look[i]) * s) as V3, fov: (a.fov ?? 40) + (43 - (a.fov ?? 40)) * s, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 120, dur: 34, s: S1b }],
  2: [{ f: 201, s: S2a }, { f: 290, dur: 18, s: S2b }, { f: 405, dur: 18, s: S2c }],
  3: [{ f: 498, s: S3a }, { f: 600, cut: true, s: S3b }],
  4: [{ f: 675, s: S4a }, { f: 720, dur: 22, s: S4b }],
  5: [{ f: 762, s: S5a }, { f: 845, dur: 24, s: S5b }],
  6: [{ f: 918, s: S6a }, { f: 1010, dur: 30, s: S6b }],
  7: [{ f: 1098, s: S7a }, { f: 1173, cut: true, s: S7b }, { f: 1216, cut: true, s: S7c }],
  8: [{ f: 1236, s: S8a }, { f: 1360, dur: 22, s: S8b }],
  9: [{ f: 1491, s: S9a }, { f: 1647, dur: 28, s: S9b }],
  10: [{ f: 1791, s: S10a }, { f: 1855, cut: true, s: S10b }],
  11: [{ f: 1914, s: S11a }, { f: 1980, cut: true, s: S11b }],
};

const KICKS: [number, number][] = [[SNAP, 1.2], [DROP1, 1.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const carFocus = (id: number) => (f: number): V3 => [-0.8, D0 + 1.1, Cz(id, f)];
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: () => [0, D0 + 1.2, -3] }, // hook: span sharp-ish, town soft
  { f: 207, cInf: 0 }, // town aerial establishing
  { f: 498, cInf: 0 }, // wind wide
  { f: 675, cInf: 12, focus: carFocus(4) }, // trapped car MS
  { f: 762, cInf: 14, focus: carFocus(5) }, // driver CU
  { f: 918, cInf: 0 }, // twist wide stays readable
  { f: 1098, cInf: 0 }, // collapse
  { f: 1239, cInf: 12, focus: () => [0.4, 0.5, -11] }, // wreck: roof sharp
  { f: 1497, cInf: 7 }, // park swing (template value)
  { f: 1797, cInf: 12, focus: () => [3.35, D0 + 1.6, -31.55] }, // engineer at the sign
  { f: 1920, cInf: 8, focus: () => [1.2, 0.7, -11] }, // callback: tentacle sharp, then crane opens up
  { f: 1980, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 1497, b: 1797, kit: "plant_bushDetailed", pos: [69.65, D0, -79.4], s: 1.2, yaw: 0.4 }, // park swing (template)
  { a: 1797, b: 1855, kit: "plant_bushDetailed", pos: [3.6, D0, -34.9], s: 1.1, yaw: 0.3 }, // sign shot, bottom-right clear of the engineer
];
