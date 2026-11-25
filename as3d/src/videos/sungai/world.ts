import * as THREE from "three";
import { sph, sphT, cone, cyl, smat, makeClouds, makeSun, rng } from "../../shared/kit";

// =====================================================================
// ANAK SUNGAI — world: satu dunia menyambung sepanjang +X.
// Hutan & mata air (x −50..−14) → tanah lapang & anak pohon (−28..−12)
// → ladang kering (−11..+11) → desa (+12..+30) → pantai & laut (+31..).
// Protagonis: pita air biru terang + gumpalan tetes "Si Tetes" di ujungnya.
// =====================================================================

export interface Bird { root: THREE.Group; bodyG: THREE.Group; wingL: THREE.Group; wingR: THREE.Group; headG: THREE.Group }
export interface Bfly { root: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh }
export interface Rabbit { root: THREE.Group; bodyG: THREE.Group; headG: THREE.Group; earL: THREE.Mesh; earR: THREE.Mesh }
export interface Deer { root: THREE.Group; bodyG: THREE.Group; headG: THREE.Group }
export interface Squirrel { root: THREE.Group; bodyG: THREE.Group; tailG: THREE.Group }
export interface Human { root: THREE.Group; bodyG: THREE.Group; headG: THREE.Group; armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group }
export interface Duck { root: THREE.Group; bodyG: THREE.Group; headG: THREE.Group }
export interface Chicken { root: THREE.Group; bodyG: THREE.Group; headG: THREE.Group }
export interface Fish { root: THREE.Group; tailG: THREE.Group }
export interface Crab { root: THREE.Group; bodyG: THREE.Group; eyeL: THREE.Group; eyeR: THREE.Group }
export interface Sapling { root: THREE.Group; leavesG: THREE.Group; leafMats: THREE.MeshStandardMaterial[]; berries: THREE.Group }
export interface TreeT { root: THREE.Group; topG: THREE.Group }

export interface SungaiRefs {
  streamG: THREE.Group;
  ribbon: THREE.Mesh; ribbonIn: THREE.Mesh;
  branchRibbon: THREE.Mesh; sideRibbon: THREE.Mesh;
  flowDots: THREE.Mesh[];
  blob: THREE.Group; blobBodyG: THREE.Group; blobEyeL: THREE.Mesh; blobEyeR: THREE.Mesh;
  poolDisc: THREE.Mesh; poolRings: THREE.Mesh[]; springFall: THREE.Mesh;
  clouds: THREE.Group[]; cloudMats: THREE.MeshStandardMaterial[];
  sunMesh: THREE.Mesh; sunGlow: THREE.Mesh;
  raysG: THREE.Group; motes: THREE.Group;
  rainLines: THREE.LineSegments; rainRings: THREE.Mesh[];
  treesSway: THREE.Group[];
  birds1: Bird[]; bflies1: Bfly[]; deer1: Deer; squirrel1: Squirrel;
  sapling: Sapling; rabbit1: Rabbit; perchBirds: Bird[]; bflies2: Bfly[]; squirrel2: Squirrel;
  farmer: Human; birdDry: Bird; rabbitDry: Rabbit; lizard: THREE.Group; lizardTail: THREE.Group; puddles: THREE.Mesh[];
  kids: Human[]; carrier: Human; elder: Human;
  gateBoard: THREE.Mesh; wheel: THREE.Group; ducks: Duck[]; chickens: Chicken[]; riceWater: THREE.Mesh[];
  fishes: Fish[]; gulls: Bird[]; boat: THREE.Group; crab: Crab;
  waves: THREE.Mesh[]; seaSpark: THREE.Group; splashRings: THREE.Mesh[];
  grownBird: Bird;
}

// ------------------------------------------------------------ path sungai
export const PATH_PTS: [number, number][] = [
  [-41, 0], [-37, 1.5], [-33, -1], [-29, 1.5], [-24, 1], [-20, -1.5], [-15, 1],
  [-10, -1], [-5, 1.5], [0, -1], [5, 1], [10, -1.5], [15, 1.5], [20, -0.5],
  [25, -2], [30, 0.5], [35, 0], [40, 0.5], [44, 0], [48, 0],
];
export const streamCurve = new THREE.CatmullRomCurve3(
  PATH_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "catmullrom", 0.35);
export const STREAM_LEN = streamCurve.getLength();

export function pathY(x: number): number {
  // dasar sungai turun lembut ke permukaan laut mulai x 38
  if (x < 38) return 0;
  return -0.48 * Math.min(1, (x - 38) / 6);
}
export function pointAt(u: number): { p: THREE.Vector3; ry: number } {
  const uu = Math.max(0, Math.min(1, u));
  const p = streamCurve.getPointAt(uu);
  const tan = streamCurve.getTangentAt(uu);
  p.y = pathY(p.x);
  return { p, ry: Math.atan2(-tan.z, tan.x) };
}
/** u perkiraan untuk posisi x di lintasan (untuk menaruh properti dekat sungai). */
export function uAtX(x: number): number {
  let best = 0, bd = 1e9;
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const p = streamCurve.getPointAt(u);
    const d = Math.abs(p.x - x);
    if (d < bd) { bd = d; best = u; }
  }
  return best;
}

// ------------------------------------------------------------ helper murah
function sphD(parent: THREE.Object3D, color: string, r: number,
  p: [number, number, number], s: [number, number, number] = [1, 1, 1], rough = 0.95): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), smat(color, rough));
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = false; m.receiveShadow = true;
  parent.add(m); return m;
}
function box(parent: THREE.Object3D, color: string, w: number, h: number, d: number,
  p: [number, number, number], rot: [number, number, number] = [0, 0, 0], shadow = true): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), smat(color, 0.95));
  m.position.set(...p); m.rotation.set(...rot);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m); return m;
}
function groundBox(parent: THREE.Object3D, color: string, x0: number, x1: number, zr: number): THREE.Mesh {
  const m = box(parent, color, x1 - x0, 0.6, zr * 2, [(x0 + x1) / 2, -0.3, 0], [0, 0, 0], false);
  m.castShadow = false;
  return m;
}

// ------------------------------------------------------------ pohon & tetumbuhan
export function makeTreeV(parent: THREE.Object3D, x: number, z: number, s: number,
  greens: string[] = ["#3f9e4d", "#359046", "#49ac57"], trunk = "#8a5a36"): TreeT {
  const root = new THREE.Group(); root.position.set(x, 0, z); root.scale.setScalar(s); parent.add(root);
  cyl(root, trunk, 0.2, 0.32, 1.9, [0, 0.95, 0]);
  cyl(root, trunk, 0.09, 0.14, 1.1, [0.5, 2.1, 0.2], [0, 0, -0.7]);
  const topG = new THREE.Group(); topG.position.set(0, 1.9, 0); root.add(topG);
  sph(topG, greens[0], 1.35, [0, 0.8, 0]);
  sph(topG, greens[1], 1.0, [0.85, 0.35, 0.3]);
  sph(topG, greens[2], 0.95, [-0.8, 0.45, -0.25]);
  sph(topG, greens[1], 0.8, [0.1, 1.5, -0.4]);
  topG.children.forEach(c => { (c as THREE.Mesh).castShadow = true; });
  return { root, topG };
}
function makePine(parent: THREE.Object3D, x: number, z: number, s: number, col = "#2e7d43") {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  cyl(g, "#7a5230", 0.14, 0.22, 1.2, [0, 0.6, 0]);
  cone(g, col, 1.25, 2.2, [0, 2.0, 0]);
  cone(g, col, 0.95, 1.8, [0, 3.1, 0]);
  cone(g, col, 0.6, 1.4, [0, 4.1, 0]);
  return g;
}
function makePalm(parent: THREE.Object3D, x: number, z: number, s: number, lean = 0.16): TreeT {
  const root = new THREE.Group(); root.position.set(x, 0, z); root.scale.setScalar(s); parent.add(root);
  for (let i = 0; i < 3; i++) {
    cyl(root, "#a97c50", 0.16 - i * 0.02, 0.2 - i * 0.02, 1.3, [i * lean * 1.4, 0.6 + i * 1.2, 0], [0, 0, -lean]);
  }
  const topG = new THREE.Group(); topG.position.set(3 * lean * 1.4, 4.1, 0); root.add(topG);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const fr = cone(topG, i % 2 ? "#43a047" : "#37914c", 0.26, 1.9, [Math.cos(a) * 0.8, 0.02, Math.sin(a) * 0.8],
      [Math.sin(a) * 1.38, 0, -Math.cos(a) * 1.38 + Math.PI / 2]);
    fr.scale.set(1, 1, 0.3);
  }
  sph(topG, "#8a5a36", 0.22, [0.25, -0.25, 0.15]);
  sph(topG, "#8a5a36", 0.2, [-0.2, -0.3, -0.1]);
  return { root, topG };
}
function makeBush(parent: THREE.Object3D, x: number, z: number, s: number, cols = ["#359046", "#3f9e4d"]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  sphD(g, cols[0], 0.65, [0, 0.32, 0], [1.25, 0.75, 1]);
  sphD(g, cols[1], 0.45, [0.55, 0.24, 0.2], [1.2, 0.75, 1]);
  sphD(g, cols[1], 0.4, [-0.5, 0.22, -0.15], [1.2, 0.7, 1]);
  return g;
}
function makeRock(parent: THREE.Object3D, x: number, z: number, s: number, col = "#9a9a92") {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  sphD(g, col, 0.55, [0, 0.16, 0], [1.3, 0.62, 1]);
  sphD(g, "#b9bdc2", 0.3, [-0.18, 0.34, 0.1], [1, 0.6, 1]);
  return g;
}
function grassField(parent: THREE.Object3D, n: number, seed: number,
  x0: number, x1: number, z0: number, z1: number, colA: string, colB: string,
  avoid?: (x: number, z: number) => boolean) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    if (avoid && avoid(x, z)) continue;
    sphD(parent, r() > 0.5 ? colA : colB, 0.16 + r() * 0.1, [x, 0.06, z], [1.2, 0.55, 1.2]);
  }
}
function nearStream(x: number, z: number, w = 2.2): boolean {
  // jarak kasar ke lintasan: sampling titik lintasan
  for (let i = 0; i <= 40; i++) {
    const p = streamCurve.getPointAt(i / 40);
    const dx = p.x - x, dz = p.z - z;
    if (dx * dx + dz * dz < w * w) return true;
  }
  return false;
}

// ------------------------------------------------------------ karakter
export function makeBird(parent: THREE.Object3D, body = "#f4f6f7", wing = "#dfe7ec", beak = "#f2a541", s = 1): Bird {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, body, 0.3, [0, 0, 0], [1.5, 0.9, 0.9], 0.7);
  cone(bodyG, wing, 0.16, 0.5, [-0.5, 0.05, 0], [0, 0, Math.PI / 2.4]);
  const headG = new THREE.Group(); headG.position.set(0.42, 0.14, 0); bodyG.add(headG);
  sph(headG, body, 0.19, [0, 0, 0], [1, 0.95, 0.95], 0.7);
  cone(headG, beak, 0.07, 0.3, [0.3, -0.02, 0], [0, 0, -Math.PI / 2]);
  sphD(headG, "#241d1a", 0.045, [0.1, 0.05, 0.13]);
  sphD(headG, "#241d1a", 0.045, [0.1, 0.05, -0.13]);
  const mkWing = (side: number) => {
    const w = new THREE.Group(); w.position.set(0, 0.14, side * 0.16); bodyG.add(w);
    const m = sph(w, wing, 0.3, [0, 0, side * 0.42], [1.5, 0.16, 1.15], 0.8);
    m.castShadow = false;
    return w;
  };
  return { root, bodyG, wingL: mkWing(1), wingR: mkWing(-1), headG };
}
export function makeBfly(parent: THREE.Object3D, col = "#b388e6"): Bfly {
  const root = new THREE.Group(); parent.add(root);
  cyl(root, "#4a3728", 0.03, 0.03, 0.34, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const wgeo = new THREE.SphereGeometry(0.17, 12, 8);
  const mk = (side: number) => {
    const m = new THREE.Mesh(wgeo, smat(col, 0.6));
    m.scale.set(1, 0.25, 1.5); m.position.set(0, 0.02, side * 0.16);
    m.castShadow = false; root.add(m); return m;
  };
  return { root, wingL: mk(1), wingR: mk(-1) };
}
export function makeRabbit(parent: THREE.Object3D, col = "#cbb59d", s = 1): Rabbit {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, col, 0.34, [0, 0.34, 0], [1.25, 0.95, 0.9], 0.85);
  sph(bodyG, "#efe6da", 0.14, [-0.4, 0.4, 0], [1, 1, 1], 0.85);
  const headG = new THREE.Group(); headG.position.set(0.38, 0.55, 0); bodyG.add(headG);
  sph(headG, col, 0.21, [0, 0, 0], [1.05, 0.95, 0.9], 0.85);
  sph(headG, "#e8a0a8", 0.05, [0.2, -0.03, 0]);
  sphD(headG, "#241d1a", 0.04, [0.1, 0.05, 0.13]);
  sphD(headG, "#241d1a", 0.04, [0.1, 0.05, -0.13]);
  const earGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const mkEar = (z: number) => {
    const e = new THREE.Mesh(earGeo, smat(col, 0.85));
    e.scale.set(0.55, 2.3, 0.8); e.position.set(-0.05, 0.32, z); e.castShadow = false;
    headG.add(e); return e;
  };
  return { root, bodyG, headG, earL: mkEar(0.09), earR: mkEar(-0.09) };
}
export function makeDeer(parent: THREE.Object3D, s = 1): Deer {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, "#b07a45", 0.52, [0, 1.05, 0], [1.5, 1, 0.85], 0.85);
  sph(bodyG, "#e8d3ae", 0.4, [0.1, 0.88, 0], [1.4, 0.8, 0.75], 0.85);
  [[0.45, 0.28], [0.45, -0.28], [-0.45, 0.28], [-0.45, -0.28]].forEach(([lx, lz]) => {
    cyl(bodyG, "#9c6a38", 0.07, 0.09, 1.0, [lx, 0.5, lz]);
  });
  sph(bodyG, "#e8d3ae", 0.16, [-0.82, 1.25, 0], [1, 1.3, 1]);
  const headG = new THREE.Group(); headG.position.set(0.72, 1.62, 0); bodyG.add(headG);
  cyl(headG, "#b07a45", 0.13, 0.17, 0.55, [-0.12, -0.2, 0], [0, 0, 0.5]);
  sph(headG, "#b07a45", 0.24, [0.08, 0.08, 0], [1.25, 0.9, 0.8], 0.85);
  sph(headG, "#8a5a30", 0.11, [0.34, 0.0, 0], [1.2, 0.8, 0.8]);
  sphD(headG, "#241d1a", 0.05, [0.16, 0.12, 0.16]);
  sphD(headG, "#241d1a", 0.05, [0.16, 0.12, -0.16]);
  cone(headG, "#c98f54", 0.09, 0.34, [-0.08, 0.3, 0.16], [0.3, 0, -0.25]);
  cone(headG, "#c98f54", 0.09, 0.34, [-0.08, 0.3, -0.16], [-0.3, 0, -0.25]);
  cone(headG, "#8a5a30", 0.05, 0.5, [-0.02, 0.42, 0.14], [0, 0, -0.5]);
  cone(headG, "#8a5a30", 0.05, 0.5, [-0.02, 0.42, -0.14], [0, 0, -0.5]);
  return { root, bodyG, headG };
}
export function makeSquirrel(parent: THREE.Object3D, s = 1): Squirrel {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, "#c47b3a", 0.2, [0, 0.24, 0], [1.1, 1.15, 0.9], 0.85);
  sph(bodyG, "#f0dcc0", 0.13, [0.1, 0.18, 0], [0.9, 1, 0.8], 0.85);
  sph(bodyG, "#c47b3a", 0.13, [0.16, 0.48, 0], [1, 0.95, 0.9], 0.85);
  sphD(bodyG, "#241d1a", 0.032, [0.24, 0.52, 0.08]);
  sphD(bodyG, "#241d1a", 0.032, [0.24, 0.52, -0.08]);
  cone(bodyG, "#c47b3a", 0.05, 0.16, [0.08, 0.62, 0.07], [0, 0, -0.2]);
  cone(bodyG, "#c47b3a", 0.05, 0.16, [0.08, 0.62, -0.07], [0, 0, -0.2]);
  const tailG = new THREE.Group(); tailG.position.set(-0.18, 0.18, 0); bodyG.add(tailG);
  sph(tailG, "#d98f47", 0.16, [-0.1, 0.18, 0], [0.8, 1.5, 0.8], 0.9);
  sph(tailG, "#d98f47", 0.13, [-0.02, 0.48, 0], [0.8, 1.3, 0.8], 0.9);
  return { root, bodyG, tailG };
}
export function makeHuman(parent: THREE.Object3D, s: number, shirt: string, pants: string, skin = "#c98d5f", hatCol?: string): Human {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  const mkLeg = (z: number) => {
    const l = new THREE.Group(); l.position.set(0, 0.78, z); bodyG.add(l);
    cyl(l, pants, 0.09, 0.11, 0.78, [0, -0.39, 0]);
    return l;
  };
  const legL = mkLeg(0.13), legR = mkLeg(-0.13);
  cyl(bodyG, shirt, 0.21, 0.26, 0.72, [0, 1.14, 0]);
  sph(bodyG, shirt, 0.24, [0, 1.48, 0], [1.05, 0.6, 1]);
  const mkArm = (z: number) => {
    const a = new THREE.Group(); a.position.set(0, 1.44, z); bodyG.add(a);
    cyl(a, shirt, 0.07, 0.08, 0.62, [0, -0.3, 0]);
    sph(a, skin, 0.075, [0, -0.64, 0], [1, 1, 1], 0.7);
    return a;
  };
  const armL = mkArm(0.3), armR = mkArm(-0.3);
  armL.rotation.x = 0.12; armR.rotation.x = -0.12;
  const headG = new THREE.Group(); headG.position.set(0, 1.72, 0); bodyG.add(headG);
  sph(headG, skin, 0.21, [0, 0.1, 0], [0.95, 1.05, 0.9], 0.7);
  sphD(headG, "#241d1a", 0.035, [0.16, 0.12, 0.08]);
  sphD(headG, "#241d1a", 0.035, [0.16, 0.12, -0.08]);
  if (hatCol) {
    cyl(headG, hatCol, 0.3, 0.32, 0.05, [0, 0.26, 0]);
    cone(headG, hatCol, 0.2, 0.22, [0, 0.36, 0]);
  } else {
    sph(headG, "#3a2a1c", 0.2, [-0.02, 0.2, 0], [0.95, 0.7, 0.9], 0.95);
  }
  return { root, bodyG, headG, armL, armR, legL, legR };
}
export function makeDuck(parent: THREE.Object3D, s = 1): Duck {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, "#f7f3e8", 0.3, [0, 0.3, 0], [1.35, 0.9, 0.95], 0.8);
  cone(bodyG, "#e8e2d2", 0.14, 0.4, [-0.42, 0.42, 0], [0, 0, Math.PI / 3]);
  const headG = new THREE.Group(); headG.position.set(0.36, 0.52, 0); bodyG.add(headG);
  sph(headG, "#f7f3e8", 0.16, [0, 0.08, 0], [1, 1, 0.95], 0.8);
  const bill = sph(headG, "#f2a541", 0.09, [0.2, 0.02, 0], [1.5, 0.45, 1.1], 0.7);
  bill.castShadow = false;
  sphD(headG, "#241d1a", 0.035, [0.08, 0.14, 0.1]);
  sphD(headG, "#241d1a", 0.035, [0.08, 0.14, -0.1]);
  return { root, bodyG, headG };
}
export function makeChicken(parent: THREE.Object3D, s = 1): Chicken {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, "#e8b04b", 0.24, [0, 0.3, 0], [1.25, 1, 0.95], 0.85);
  cone(bodyG, "#c98f2e", 0.13, 0.42, [-0.3, 0.48, 0], [0, 0, Math.PI / 3.2]);
  const headG = new THREE.Group(); headG.position.set(0.26, 0.52, 0); bodyG.add(headG);
  sph(headG, "#e8b04b", 0.13, [0, 0.06, 0], [1, 1, 0.95], 0.85);
  cone(headG, "#e8734a", 0.05, 0.16, [0.16, 0.0, 0], [0, 0, -Math.PI / 2]);
  sph(headG, "#d23c2a", 0.055, [0, 0.22, 0], [1.2, 0.8, 0.6], 0.7);
  sphD(headG, "#241d1a", 0.03, [0.07, 0.1, 0.09]);
  sphD(headG, "#241d1a", 0.03, [0.07, 0.1, -0.09]);
  cyl(bodyG, "#e8734a", 0.02, 0.02, 0.2, [0.05, 0.08, 0.08]);
  cyl(bodyG, "#e8734a", 0.02, 0.02, 0.2, [0.05, 0.08, -0.08]);
  return { root, bodyG, headG };
}
export function makeFish(parent: THREE.Object3D, col = "#ff9a5c", s = 1): Fish {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  sph(root, col, 0.22, [0, 0, 0], [1.6, 0.85, 0.6], 0.5);
  sph(root, "#ffffff", 0.13, [0.12, -0.06, 0], [1.3, 0.7, 0.55], 0.5);
  sphD(root, "#241d1a", 0.04, [0.22, 0.05, 0.11]);
  sphD(root, "#241d1a", 0.04, [0.22, 0.05, -0.11]);
  const tailG = new THREE.Group(); tailG.position.set(-0.34, 0, 0); root.add(tailG);
  const t = cone(tailG, col, 0.16, 0.36, [-0.14, 0, 0], [0, 0, Math.PI / 2]);
  t.scale.set(1, 1, 0.3);
  cone(root, col, 0.1, 0.24, [-0.02, 0.2, 0], [0, 0, -0.3]);
  return { root, tailG };
}
export function makeCrab(parent: THREE.Object3D, s = 1): Crab {
  const root = new THREE.Group(); root.scale.setScalar(s); parent.add(root);
  const bodyG = new THREE.Group(); root.add(bodyG);
  sph(bodyG, "#d84f35", 0.3, [0, 0.22, 0], [1.3, 0.6, 1], 0.7);
  sph(bodyG, "#e86a4a", 0.2, [0.32, 0.3, 0.22], [1, 0.8, 1], 0.7);
  sph(bodyG, "#e86a4a", 0.17, [0.32, 0.3, -0.22], [1, 0.8, 1], 0.7);
  for (let i = 0; i < 3; i++) {
    cyl(bodyG, "#c2432e", 0.03, 0.04, 0.4, [-0.1 + i * 0.16, 0.08, 0.34], [0.7, 0, 0.3]);
    cyl(bodyG, "#c2432e", 0.03, 0.04, 0.4, [-0.1 + i * 0.16, 0.08, -0.34], [-0.7, 0, -0.3]);
  }
  const mkEye = (z: number) => {
    const e = new THREE.Group(); e.position.set(0.22, 0.36, z); bodyG.add(e);
    cyl(e, "#c2432e", 0.025, 0.025, 0.18, [0, 0.08, 0]);
    sph(e, "#241d1a", 0.05, [0, 0.2, 0], [1, 1, 1], 0.3);
    return e;
  };
  return { root, bodyG, eyeL: mkEye(0.12), eyeR: mkEye(-0.12) };
}

// ------------------------------------------------------------ pita air
export const RIB_N = 300;
export function baseWidth(u: number): number {
  // lebar dasar pita menurut posisi: sempit di hulu, melebar ke muara
  let w = 1.5;
  if (u > 0.3) w = 1.65;
  if (u > 0.55) w = 1.8;
  if (u > 0.75) w = 2.1;
  if (u > 0.9) w = 2.6;
  if (u > 0.965) w = 2.6 + (u - 0.965) / 0.035 * 3.4; // pelebaran muara
  return w;
}
export interface RibbonData {
  mesh: THREE.Mesh;
  centers: THREE.Vector3[];
  sides: THREE.Vector3[];
  us: number[];
}
export function buildRibbon(parent: THREE.Object3D, curve: THREE.Curve<THREE.Vector3>,
  n: number, color: string, opacity: number, yOff: number, wScale: number,
  profile?: (u: number) => number): RibbonData {
  const centers: THREE.Vector3[] = [], sides: THREE.Vector3[] = [], us: number[] = [];
  const pos = new Float32Array((n + 1) * 2 * 3);
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    centers.push(p.clone()); sides.push(side); us.push(u);
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? -1 : 1;
      const j = (i * 2 + k) * 3;
      pos[j] = p.x + side.x * sgn * 0.5;
      pos[j + 1] = p.y + yOff;
      pos[j + 2] = p.z + side.z * sgn * 0.5;
    }
    if (i < n) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: 0.32, metalness: 0,
    transparent: opacity < 1, opacity, depthWrite: opacity >= 1,
    emissive: new THREE.Color(color), emissiveIntensity: 0.22,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true; mesh.castShadow = false;
  mesh.frustumCulled = false;
  parent.add(mesh);
  const data: RibbonData = { mesh, centers, sides, us };
  mesh.userData.ribbon = { ...data, wScale, yOff, profile: profile ?? baseWidth };
  return data;
}
/** Ambil RibbonData dari mesh pita (untuk updateRibbon di story). */
export function ribbonDataOf(mesh: THREE.Mesh): RibbonData {
  return mesh.userData.ribbon as RibbonData;
}
/** Gambar ulang lebar pita: factor global × taper di dekat ujung kepala. */
export function updateRibbon(data: RibbonData, headU: number, factor: number) {
  const { mesh, centers, sides, us } = data;
  const wScale = (mesh.userData.ribbon as { wScale: number }).wScale;
  const yOff = (mesh.userData.ribbon as { yOff: number }).yOff;
  const profile = (mesh.userData.ribbon as { profile: (u: number) => number }).profile;
  const posAttr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const pos = posAttr.array as Float32Array;
  const n = us.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = us[i];
    let w = profile(u) * factor * wScale;
    // taper membulat tepat di belakang kepala aliran
    const dh = headU - u;
    if (dh < 0.012 && dh >= -0.002) w *= 0.45 + 0.55 * Math.max(0, dh / 0.012);
    if (u > headU) w = 0.0001;
    const c = centers[i], s = sides[i];
    for (let k = 0; k < 2; k++) {
      const sgn = k === 0 ? -1 : 1;
      const j = (i * 2 + k) * 3;
      pos[j] = c.x + s.x * sgn * w * 0.5;
      pos[j + 1] = c.y + yOff + pathY(c.x);
      pos[j + 2] = c.z + s.z * sgn * w * 0.5;
    }
  }
  posAttr.needsUpdate = true;
  const vis = Math.max(0, Math.min(n, Math.ceil(headU * n) + 1));
  mesh.geometry.setDrawRange(0, vis * 6);
  mesh.visible = headU > 0.001;
}

// =====================================================================
// ASSEMBLY DUNIA
// =====================================================================
export function buildWorld(scene: THREE.Scene): SungaiRefs {
  const g = scene as unknown as THREE.Group;
  const R = rng(7);
  const treesSway: THREE.Group[] = [];
  const addTree = (x: number, z: number, s: number, greens?: string[]) => {
    const t = makeTreeV(g, x, z, s, greens);
    t.topG.userData.phase = R() * Math.PI * 2;
    treesSway.push(t.topG);
    return t;
  };

  // ---------- tanah per zona ----------
  groundBox(g, "#57a047", -52, -11, 26);            // hutan + lapang
  groundBox(g, "#c9a86a", -11, 11.5, 26);           // ladang kering
  groundBox(g, "#74ac52", 11.5, 31, 26);            // desa
  groundBox(g, "#ecd9a0", 31, 46, 26);              // pantai
  const sea = box(g, "#1b6ea6", 90, 0.5, 110, [84, -0.75, 0], [0, 0, 0], false); // laut (atas y=-0,5)
  sea.receiveShadow = false;
  box(g, "#e3cd8f", 10, 0.3, 30, [40, -0.32, 0], [0, 0, 0], false); // beting pasir dangkal
  // bukit latar jauh
  [[-38, -30, 16], [-6, -33, 20], [26, -31, 17], [58, -34, 22], [-20, 30, 15], [16, 31, 18]].forEach(([x, z, s]) => {
    sphD(g, "#6fae6a", s, [x, -s * 0.35, z], [1.4, 0.55, 1]);
  });
  // tepian basah gelap di bawah pita (digambar sebagai pita lebar coklat tua)
  const bankCurve = streamCurve;
  const bankData = buildRibbon(g, bankCurve, 200, "#4a3b28", 1, 0.015, 1.35);
  (bankData.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
  (bankData.mesh.material as THREE.MeshStandardMaterial).roughness = 1;
  bankData.mesh.renderOrder = -1;

  // ---------- awan + matahari ----------
  const clouds = makeClouds(g, [
    [-30, 15, -14, 1.6], [-2, 17, -18, 2.0], [24, 16, -15, 1.7],
    [52, 15, -20, 2.2], [-48, 18, -10, 1.4], [8, 19, 12, 1.5], [40, 18, 14, 1.6],
  ]);
  const cloudMats: THREE.MeshStandardMaterial[] = [];
  clouds.forEach(c => c.children.forEach(m => cloudMats.push((m as THREE.Mesh).material as THREE.MeshStandardMaterial)));
  const sunMesh = makeSun(g, 60, 34, -45, 2.6, "#ffdf6b");
  const sunGlow = sphT(g, "#ffdf8a", 4.2, 0.3, [60, 34, -45]);
  sunGlow.castShadow = false;

  // sinar menembus dedaunan di hutan + debu cahaya
  const raysG = new THREE.Group(); g.add(raysG);
  for (let i = 0; i < 4; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.4, 16, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(-42 + i * 6.5, 8, -4 + (i % 2) * 7);
    ray.rotation.z = 0.32;
    ray.castShadow = false;
    raysG.add(ray);
  }
  const motes = new THREE.Group(); g.add(motes);
  for (let i = 0; i < 16; i++) {
    const m = sphD(motes, "#fff7c0", 0.05, [-44 + R() * 20, 1 + R() * 5, -6 + R() * 12]);
    m.userData.phase = R() * Math.PI * 2;
    (m as THREE.Mesh).castShadow = false;
  }

  // ============================================================ HUTAN (babak 1–2)
  // mata air: lingkaran batu + kolam + tirai air kecil
  const springC = pointAt(0).p;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    makeRock(g, springC.x + Math.cos(a) * 3.4 - 1.2, springC.z + Math.sin(a) * 3.0, 0.9 + R() * 0.5);
  }
  const poolDisc = new THREE.Mesh(new THREE.CircleGeometry(3.1, 36),
    new THREE.MeshStandardMaterial({ color: "#35b6f2", roughness: 0.2, emissive: "#1177aa", emissiveIntensity: 0.3 }));
  poolDisc.rotation.x = -Math.PI / 2;
  poolDisc.position.set(springC.x - 1.2, 0.06, springC.z);
  poolDisc.receiveShadow = true;
  g.add(poolDisc);
  const poolRings: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 40),
      new THREE.MeshBasicMaterial({ color: "#dff6ff", transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(poolDisc.position); ring.position.y = 0.1;
    ring.castShadow = false;
    g.add(ring); poolRings.push(ring);
  }
  const springFall = cyl(g, "#bfe9ff", 0.13, 0.2, 1.5, [springC.x - 3.4, 0.85, springC.z - 0.6]);
  (springFall.material as THREE.MeshStandardMaterial).transparent = true;
  (springFall.material as THREE.MeshStandardMaterial).opacity = 0.75;
  springFall.castShadow = false;
  makeRock(g, springC.x - 3.6, springC.z - 0.6, 1.5);

  // pepohonan hutan rapat berlapis — SEMUA di seberang aliran (z<0):
  // sisi kamera (z 3..14) bebas pohon tinggi agar koridor kamera bersih;
  // lapisan depan diisi semak/batu/rumput/akar rendah saja.
  const forestTrees: [number, number, number][] = [
    [-46, -8, 1.5], [-44, -14, 1.3], [-40, -11, 1.7], [-38, -5, 1.2], [-35, -7, 1.2],
    [-33, -15, 1.5], [-30, -12, 1.4], [-28, -4.5, 1.0], [-26, -8, 1.5], [-21, -11, 1.35],
    [-19, -14, 1.4], [-16, -9, 1.2], [-14, -5.5, 1.1], [-36, -16, 1.9], [-24, -17, 1.8],
    [-18, -18, 1.6], [-45, -18, 1.7], [-30, -19, 1.6], [-12, -15, 1.6], [-40, -4, 1.0],
  ];
  forestTrees.forEach(([x, z, s]) => addTree(x, z, s));
  makePine(g, -47, -3, 1.5); makePine(g, -31, -14, 1.7); makePine(g, -17, -13, 1.4); makePine(g, -22, -16, 1.5);
  // semak, pakis, batu, akar di hutan
  [[-42, 5], [-36, -4], [-29, 5], [-25, -5], [-20, 6], [-15, -5], [-38, 13], [-27, -13], [-33, 12], [-19, -14]]
    .forEach(([x, z]) => makeBush(g, x, z, 0.9 + R() * 0.6));
  [[-39, 3, 1.1], [-28, -3.5, 0.8], [-22, 4.5, 0.9], [-17, -3, 0.7], [-34, -5.5, 0.8], [-13.5, 3, 0.8]]
    .forEach(([x, z, s]) => makeRock(g, x, z, s));
  for (let i = 0; i < 3; i++) { // akar melengkung
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.16, 10, 20, Math.PI), smat("#7a5230", 1));
    arc.position.set(-36 + i * 8, 0.05, i % 2 === 0 ? 6.5 : -6.5);
    arc.rotation.set(0, R() * 2, 0);
    arc.castShadow = true; arc.receiveShadow = true;
    g.add(arc);
  }
  grassField(g, 70, 11, -50, -12, -13, 13, "#4c9440", "#5cab4a", (x, z) => nearStream(x, z, 2.4));
  // bunga-bunga kecil di lapang babak 2
  const flowerSpots: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const x = -28 + R() * 14, z = -9 + R() * 18;
    if (nearStream(x, z, 2.0)) continue;
    flowerSpots.push([x, z]);
  }
  const petalCols = ["#e86a8a", "#f2c14e", "#ffffff", "#b388e6", "#ff8a5c"];
  flowerSpots.forEach(([x, z], i) => {
    const fg = new THREE.Group(); fg.position.set(x, 0, z); fg.userData.phase = R() * Math.PI * 2; g.add(fg);
    cyl(fg, "#3f9e4d", 0.02, 0.03, 0.34, [0, 0.17, 0]);
    sphD(fg, petalCols[i % petalCols.length], 0.1, [0, 0.38, 0], [1, 0.8, 1]);
  });

  // ---------- anak pohon (babak 2) ----------
  const sapPos = pointAt(uAtX(-24)).p;
  const sapling = ((): Sapling => {
    const root = new THREE.Group();
    root.position.set(sapPos.x - 0.5, 0, sapPos.z + 3.4);
    g.add(root);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), smat("#a98a5a", 1));
    soil.rotation.x = -Math.PI / 2; soil.position.y = 0.02; soil.receiveShadow = true; root.add(soil);
    cyl(root, "#8a5a36", 0.07, 0.11, 1.35, [0, 0.67, 0]);
    const leavesG = new THREE.Group(); leavesG.position.set(0, 1.35, 0); root.add(leavesG);
    const leafMats: THREE.MeshStandardMaterial[] = [];
    const mkLeaf = (x: number, y: number, z: number, r: number) => {
      const m = smat("#b9c25e", 0.9); leafMats.push(m);
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
      s.position.set(x, y, z); s.castShadow = true; leavesG.add(s);
    };
    mkLeaf(0, 0.25, 0, 0.42); mkLeaf(0.34, 0.05, 0.1, 0.3); mkLeaf(-0.32, 0.08, -0.08, 0.3);
    mkLeaf(0.05, 0.5, -0.15, 0.28); mkLeaf(-0.1, 0.02, 0.3, 0.26);
    const berries = new THREE.Group(); berries.visible = false; root.add(berries);
    for (let i = 0; i < 5; i++) sphD(berries, "#e86a4a", 0.07, [Math.cos(i * 2.2) * 0.4, 1.5 + (i % 3) * 0.22, Math.sin(i * 2.2) * 0.4]);
    return { root, leavesG, leafMats, berries };
  })();
  // tunggul + batang tumbang untuk tupai
  cyl(g, "#7a5230", 0.42, 0.48, 0.7, [-19.5, 0.35, -4.5]);
  const logM = cyl(g, "#8a5a36", 0.3, 0.3, 4.6, [-30, 0.32, -5.5], [0, 0.5, Math.PI / 2]);
  logM.rotation.x = 0.2;

  // karakter hutan
  const birds1 = [makeBird(g, "#7fb2e0", "#5d94c9", "#f2a541", 1.0), makeBird(g, "#f2c14e", "#dfa92e", "#e8734a", 0.85), makeBird(g, "#e86a8a", "#cf5578", "#f2a541", 0.9)];
  birds1.forEach(b => { b.root.visible = false; });
  const bflies1 = [makeBfly(g, "#b388e6"), makeBfly(g, "#f2c14e")];
  const bflies2 = [makeBfly(g, "#e86a8a"), makeBfly(g, "#7fd4f2")];
  const deer1 = makeDeer(g, 1.05);
  deer1.root.position.set(-34.5, 0, 2.0); deer1.root.rotation.y = 1.35;
  const squirrel1 = makeSquirrel(g, 1);
  const squirrel2 = makeSquirrel(g, 0.9);
  squirrel2.root.position.set(-19.5, 0.72, -4.5); squirrel2.root.rotation.y = 0.7;
  const rabbit1 = makeRabbit(g);
  const sapR = pointAt(uAtX(-21)).p;
  rabbit1.root.position.set(sapR.x + 0.8, 0, sapR.z - 2.6); rabbit1.root.rotation.y = 2.6;
  const perchBirds = [makeBird(g, "#e8734a", "#cf5f36", "#f2c14e", 0.7), makeBird(g, "#7fd4f2", "#5cb8dd", "#f2a541", 0.65)];
  perchBirds[0].root.position.set(-27.5, 3.6, -6.5);
  perchBirds[1].root.position.set(-26.6, 3.85, -6.2);

  // ============================================================ LADANG KERING (babak 3)
  // retakan tanah: garis-garis gelap pipih acak
  const crackMat = smat("#8a6a3c", 1);
  for (let i = 0; i < 46; i++) {
    const x = -10 + R() * 20, z = -11 + R() * 22;
    if (nearStream(x, z, 1.6)) continue;
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.8 + R() * 1.8, 0.03, 0.09 + R() * 0.06), crackMat);
    c.position.set(x, 0.025, z); c.rotation.y = R() * Math.PI;
    c.receiveShadow = true; g.add(c);
  }
  for (let i = 0; i < 10; i++) { // bercak tanah kering pucat
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.8 + R() * 1.4, 18), smat("#b98d4f", 1));
    p.rotation.x = -Math.PI / 2;
    p.position.set(-9 + R() * 19, 0.015, -10 + R() * 20);
    p.receiveShadow = true; g.add(p);
  }
  grassField(g, 55, 23, -11, 11, -12, 12, "#c2a054", "#b28c46", (x, z) => nearStream(x, z, 1.8));
  // pohon mati + pagar rusak + batu
  const deadTree = new THREE.Group(); deadTree.position.set(4.5, 0, -6.5); g.add(deadTree);
  cyl(deadTree, "#8a7355", 0.16, 0.26, 2.6, [0, 1.3, 0]);
  cyl(deadTree, "#8a7355", 0.07, 0.11, 1.5, [0.55, 2.9, 0.1], [0, 0, -0.8]);
  cyl(deadTree, "#8a7355", 0.05, 0.09, 1.1, [-0.45, 3.0, -0.1], [0, 0, 0.9]);
  for (let i = 0; i < 6; i++) { // pagar rusak
    const px = -8 + i * 3.4;
    const post = cyl(g, "#9a7c50", 0.09, 0.11, 1.15, [px, 0.55, -7.5], [0, 0, (R() - 0.5) * 0.35]);
    post.rotation.x = (R() - 0.5) * 0.2;
    if (i < 5 && i !== 2) box(g, "#a8875c", 3.4, 0.12, 0.08, [px + 1.7, 0.92 - (i === 3 ? 0.25 : 0), -7.5], [0, 0, i === 3 ? -0.16 : 0.02]);
  }
  [[-6, 5.5, 1.0], [1, -4.5, 0.8], [7.5, 4, 1.2], [-2, 8, 0.7], [9, -6, 0.9]].forEach(([x, z, s]) => makeRock(g, x, z, s, "#a89a80"));
  [[-7, -3], [3, 6.5], [8.5, 1.5]].forEach(([x, z]) => makeBush(g, x, z, 0.85, ["#a8a04e", "#98903f"]));
  // genangan sisa yang mengering
  const puddles: THREE.Mesh[] = [];
  [[-13.5, -2.5], [-6.5, 3.8], [1.5, -3.4]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20),
      new THREE.MeshStandardMaterial({ color: "#5db9e8", roughness: 0.25, transparent: true, opacity: 0.85, emissive: "#1177aa", emissiveIntensity: 0.15 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.045, z);
    g.add(p); puddles.push(p);
  });
  const farmer = makeHuman(g, 1.0, "#c9552e", "#5d6e46", "#c98d5f", "#e8d9a0");
  farmer.root.position.set(2.2, 0, -4.6); farmer.root.rotation.y = 2.5;
  const birdDry = makeBird(g, "#d9c9a8", "#c2ae87", "#e8a04c", 0.8);
  birdDry.root.position.set(4.1, 0.12, -5.6); birdDry.root.rotation.y = 0.8;
  const rabbitDry = makeRabbit(g, "#d8c6a8", 0.95);
  rabbitDry.root.position.set(-3.4, 0, 6.2); rabbitDry.root.rotation.y = -0.7;
  const lizard = new THREE.Group(); lizard.position.set(1.2, 0.32, -4.2); g.add(lizard);
  sphD(lizard, "#a8a04e", 0.16, [0, 0, 0], [1.9, 0.45, 0.7]);
  sphD(lizard, "#98903f", 0.1, [0.34, 0.02, 0], [1.2, 0.6, 0.8]);
  const lizardTail = new THREE.Group(); lizardTail.position.set(-0.3, 0, 0); lizard.add(lizardTail);
  cone(lizardTail, "#a8a04e", 0.06, 0.7, [-0.35, 0, 0], [0, 0, Math.PI / 2]);

  // ============================================================ DESA (babak 4)
  const makeHouse = (x: number, z: number, ry: number, wall: string, roof: string, s = 1) => {
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; h.scale.setScalar(s); g.add(h);
    box(h, wall, 3.4, 2.2, 2.8, [0, 1.1, 0]);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.6, 4), smat(roof, 0.95));
    rf.position.y = 3.0; rf.rotation.y = Math.PI / 4; rf.castShadow = true; h.add(rf);
    box(h, "#6b4a2f", 0.8, 1.4, 0.1, [0.5, 0.7, 1.42], [0, 0, 0], false);
    box(h, "#ffe9a8", 0.7, 0.7, 0.08, [-0.9, 1.4, 1.42], [0, 0, 0], false);
    box(h, "#8a5a36", 0.5, 2.4, 0.5, [1.9, 1.2, 1.2]);
    return h;
  };
  makeHouse(15.5, -8.5, 0.25, "#f2e3c2", "#c9552e");
  makeHouse(22.5, -10.5, -0.15, "#e8d3ae", "#a84a2a", 1.1);
  makeHouse(32, -9.5, -0.5, "#f7ecd2", "#c9552e", 0.95);
  makeHouse(19.8, -13.8, 0.1, "#eee0bc", "#b34a28", 0.9);
  // pagar desa + jalan tanah
  for (let i = 0; i < 8; i++) {
    cyl(g, "#8a5a36", 0.07, 0.09, 1.0, [12.5 + i * 2.2, 0.5, 5.6]);
    if (i < 7) box(g, "#9a6a3c", 2.2, 0.09, 0.06, [13.6 + i * 2.2, 0.78, 5.6], [0, 0, 0], false);
  }
  box(g, "#d9bd85", 17, 0.04, 2.2, [20.5, 0.02, 3.2], [0, 0.06, 0], false).receiveShadow = true;
  // sawah bertingkat + airnya
  const riceWater: THREE.Mesh[] = [];
  [[15, 10.5, 7, 3.4], [19.5, 14.5, 8, 3.2], [24.5, 11, 6.4, 3.6]].forEach(([x, z, w, d], i) => {
    box(g, "#5da244", w, 0.35, d, [x, 0.17, z]);
    box(g, "#8a6a3c", w + 0.5, 0.18, d + 0.5, [x, 0.08, z], [0, 0, 0], false);
    const wtr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4),
      new THREE.MeshStandardMaterial({ color: "#aee2ff", roughness: 0.15, transparent: true, opacity: 0 }));
    wtr.rotation.x = -Math.PI / 2; wtr.position.set(x, 0.37, z);
    g.add(wtr); riceWater.push(wtr);
    for (let k = 0; k < 7; k++) cone(g, "#69b44c", 0.09, 0.5, [x - w / 2 + 0.7 + k * (w - 1.4) / 6, 0.55, z + (i % 2 ? 0.7 : -0.7)]);
  });
  addTree(18.5, -5.5, 1.35); addTree(29, -6, 1.2); addTree(12.5, -4, 1.1);
  [[13, 6.8], [21, 6.5], [26, -4.5], [17, -12], [28.5, 12]].forEach(([x, z]) => makeBush(g, x, z, 0.8 + R() * 0.4));
  grassField(g, 45, 31, 12, 30, -13, 13, "#5da244", "#6cb257", (x, z) => nearStream(x, z, 2.2));
  // kolam penampung + pintu air (titik balik)
  const gateU = uAtX(17);
  const gatePt = pointAt(gateU).p;
  const pondC = new THREE.Mesh(new THREE.CircleGeometry(3.4, 30),
    new THREE.MeshStandardMaterial({ color: "#2f9fd8", roughness: 0.25, emissive: "#0d5f8a", emissiveIntensity: 0.2 }));
  pondC.rotation.x = -Math.PI / 2;
  pondC.position.set(gatePt.x + 1.5, 0.05, gatePt.z - 9.5);
  pondC.receiveShadow = true; g.add(pondC);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5;
    makeRock(g, pondC.position.x + Math.cos(a) * 3.6, pondC.position.z + Math.sin(a) * 3.6, 0.55 + R() * 0.3);
  }
  const gateFrame = new THREE.Group();
  gateFrame.position.set(gatePt.x + 0.8, 0, gatePt.z - 4.6);
  gateFrame.rotation.y = 0.5;
  g.add(gateFrame);
  cyl(gateFrame, "#7a5230", 0.13, 0.16, 2.3, [-1.0, 1.15, 0]);
  cyl(gateFrame, "#7a5230", 0.13, 0.16, 2.3, [1.0, 1.15, 0]);
  cyl(gateFrame, "#7a5230", 0.09, 0.09, 2.3, [0, 2.3, 0], [0, 0, Math.PI / 2]);
  const gateBoard = box(gateFrame, "#a8763e", 1.9, 1.5, 0.14, [0, 0.75, 0]);
  // kincir air
  const wheel = new THREE.Group();
  const wheelPt = pointAt(uAtX(24.5)).p;
  wheel.position.set(wheelPt.x + 0.6, 2.0, wheelPt.z - 3.6);
  g.add(wheel);
  const wheelSpin = new THREE.Group(); wheel.add(wheelSpin);
  const rimMat = smat("#8a5a36", 0.9);
  [-0.55, 0.55].forEach(zo => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.1, 10, 36), rimMat);
    rim.position.z = zo; rim.castShadow = true; wheelSpin.add(rim);
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = cyl(wheelSpin, "#9a6a3c", 0.06, 0.06, 3.9, [0, 0, 0], [0, 0, a]);
    sp.rotation.x = 0; sp.rotation.set(0, 0, a);
    const pd = box(wheelSpin, "#b3814a", 0.55, 0.95, 1.25, [Math.cos(a) * 2.0, Math.sin(a) * 2.0, 0], [0, 0, a + Math.PI / 2]);
    pd.castShadow = true;
  }
  cyl(wheelSpin, "#6b4a2f", 0.16, 0.16, 1.6, [0, 0, 0], [Math.PI / 2, 0, 0]);
  wheel.userData.spin = wheelSpin;
  cyl(g, "#7a5230", 0.14, 0.18, 2.6, [wheel.position.x - 1.4, 1.0, wheel.position.z - 0.9], [0.35, 0, 0.3]);
  cyl(g, "#7a5230", 0.14, 0.18, 2.6, [wheel.position.x + 1.4, 1.0, wheel.position.z - 0.9], [-0.35, 0, -0.3]);
  // warga desa
  const kids = [makeHuman(g, 0.62, "#e8b13c", "#4a6fa5"), makeHuman(g, 0.58, "#5da2c9", "#7a4a8c")];
  kids[0].root.position.set(gateFrame.position.x - 1.9, 0, gateFrame.position.z + 0.9); kids[0].root.rotation.y = 2.2;
  kids[1].root.position.set(gateFrame.position.x + 1.7, 0, gateFrame.position.z + 1.3); kids[1].root.rotation.y = -2.4;
  const carrier = makeHuman(g, 0.95, "#7a9e4f", "#6b4a2f");
  carrier.root.position.set(20, 0, 3.4); carrier.root.rotation.y = -1.2;
  const bucket = cyl(carrier.bodyG, "#c9552e", 0.16, 0.12, 0.3, [0.1, 0.28, 0.52]);
  bucket.castShadow = false;
  const elder = makeHuman(g, 0.97, "#8c6bb8", "#4f4a3a", "#e8e0cc");
  elder.root.position.set(23.2, 0, -1.8); elder.root.rotation.y = 2.8;
  const ducks = [makeDuck(g), makeDuck(g, 0.85), makeDuck(g, 0.9)];
  ducks[0].root.position.set(16.5, 0, 7.6); ducks[1].root.position.set(17.4, 0, 8.3); ducks[2].root.position.set(15.6, 0, 8.6);
  const chickens = [makeChicken(g), makeChicken(g, 0.9)];
  chickens[0].root.position.set(19.5, 0, -6.8); chickens[1].root.position.set(26.5, 0, 4.6);

  // ============================================================ PANTAI & LAUT (babak 5)
  const palms: [number, number, number, number][] = [[33, -6.5, 1.15, 0.16], [37.5, 3.5, 0.9, -0.12], [42, -7.5, 1.25, 0.2], [30.5, 3.0, 0.85, 0.1]];
  palms.forEach(([x, z, s, ln]) => { const p = makePalm(g, x, z, s, ln); p.topG.userData.phase = R() * 6; treesSway.push(p.topG); });
  [[34, 3.5, 0.9], [38.5, -4, 1.1], [41, 4.5, 0.8], [45, -3, 1.0], [47, 5, 0.7]].forEach(([x, z, s]) => makeRock(g, x, z, s, "#b0a08a"));
  [[43, -2.5], [46, 2], [39, 5.5]].forEach(([x, z]) => { // batu karang warna di dangkal
    sphD(g, "#f28ba8", 0.4, [x, -0.25, z], [1, 0.7, 1]);
    sphD(g, "#ff9a5c", 0.28, [x + 0.4, -0.3, z + 0.3], [1, 0.7, 1]);
  });
  for (let i = 0; i < 14; i++) sphD(g, "#fff6e0", 0.09 + R() * 0.07, [32 + R() * 13, 0.05, -8 + R() * 16], [1, 0.5, 1]);
  grassField(g, 18, 41, 31, 40, -11, 11, "#b5a86b", "#c4b578", (x, z) => nearStream(x, z, 2.4));
  // ombak: pita busa di garis pantai
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10),
      new THREE.MeshStandardMaterial({ color: "#eafcff", roughness: 0.4, transparent: true, opacity: 0.75, emissive: "#bfe9ff", emissiveIntensity: 0.12 }));
    w.scale.set(16 - i * 2.5, 0.32, 0.85);
    w.position.set(43.5 + i * 3.2, -0.38, 0);
    w.castShadow = false;
    g.add(w); waves.push(w);
  }
  const seaSpark = new THREE.Group(); g.add(seaSpark);
  for (let i = 0; i < 22; i++) {
    const s = sphD(seaSpark, i % 2 ? "#ffffff" : "#ffe9a8", 0.09, [42 + R() * 26, -0.32, -14 + R() * 28], [1.6, 0.4, 1]);
    s.userData.phase = R() * Math.PI * 2;
    (s as THREE.Mesh).castShadow = false;
  }
  // perahu nelayan kecil
  const boat = new THREE.Group(); boat.position.set(52, -0.35, -8); boat.rotation.y = 0.5; g.add(boat);
  const hull = sph(boat, "#b3502e", 1.0, [0, 0, 0], [2.3, 0.75, 0.85], 0.8);
  hull.castShadow = true;
  sph(boat, "#8a3a20", 0.9, [0, 0.28, 0], [2.15, 0.6, 0.72], 0.8);
  cyl(boat, "#7a5230", 0.06, 0.08, 2.6, [-0.2, 1.5, 0]);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.0, 4), smat("#f7ecd2", 0.9));
  sail.position.set(0.35, 1.9, 0); sail.scale.set(1, 1, 0.18); sail.rotation.y = Math.PI / 4;
  boat.add(sail);
  const fisher = makeHuman(boat, 0.8, "#4a6fa5", "#5d4a30");
  fisher.root.position.set(-0.9, 0.35, 0); fisher.root.rotation.y = -0.4;
  // ikan, camar, kepiting
  const fishes = [makeFish(g, "#ff9a5c", 1), makeFish(g, "#f2c14e", 0.85), makeFish(g, "#7fd4f2", 0.9)];
  fishes.forEach(f => { f.root.visible = false; });
  const gulls = [makeBird(g, "#ffffff", "#e8eef2", "#f2a541", 1.05), makeBird(g, "#ffffff", "#e8eef2", "#f2a541", 0.95),
    makeBird(g, "#f4f6f7", "#dfe7ec", "#f2a541", 1.0), makeBird(g, "#ffffff", "#eef3f6", "#f2a541", 0.9)];
  gulls.forEach(b => { b.root.visible = false; });
  const crab = makeCrab(g, 0.9);
  crab.root.position.set(36, 0, 5.2); crab.root.rotation.y = -0.5;
  const splashRings: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({ color: "#eafcff", transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    g.add(ring); splashRings.push(ring);
  }
  // burung dewasa di anak pohon untuk koda (disembunyikan sampai koda)
  const grownBird = makeBird(g, "#e8734a", "#cf5f36", "#f2c14e", 0.75);
  grownBird.root.visible = false;

  // ============================================================ HUJAN
  const RAIN_N = 340;
  const rainPos = new Float32Array(RAIN_N * 2 * 3);
  const rainSeed: number[] = [];
  for (let i = 0; i < RAIN_N; i++) rainSeed.push(R());
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: "#d8f2ff", transparent: true, opacity: 0 });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  rainLines.userData.seed = rainSeed;
  g.add(rainLines);
  const rainRings: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.04, 8, 28),
      new THREE.MeshBasicMaterial({ color: "#dff6ff", transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    ring.userData.phase = R();
    g.add(ring); rainRings.push(ring);
  }

  // ============================================================ PROTAGONIS
  const streamG = new THREE.Group(); g.add(streamG);
  const ribbonData = buildRibbon(streamG, streamCurve, RIB_N, "#35b6f2", 1, 0.075, 1);
  // sesuaikan y pusat pita dengan kemiringan dasar (pathY) — buildRibbon pakai y kurva (0)
  ribbonData.centers.forEach(c => { c.y = 0; });
  const ribbonInData = buildRibbon(streamG, streamCurve, RIB_N, "#aee9ff", 0.5, 0.1, 0.55);
  ribbonInData.centers.forEach(c => { c.y = 0; });
  streamG.userData.main = ribbonData;
  streamG.userData.inner = ribbonInData;
  // pita cabang ke anak pohon + pita sisi dari kolam desa
  const sapPt = pointAt(uAtX(-24)).p;
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sapPt.x, 0, sapPt.z + 0.4),
    new THREE.Vector3(sapPt.x - 0.3, 0, sapPt.z + 2.0),
    new THREE.Vector3(sapling.root.position.x, 0, sapling.root.position.z - 0.4),
  ]);
  const branchData = buildRibbon(streamG, branchCurve, 24, "#35b6f2", 1, 0.07, 0.34, () => 1.7);
  branchData.centers.forEach(c => { c.y = 0; });
  streamG.userData.branch = branchData;
  const sideCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(pondC.position.x - 0.8, 0, pondC.position.z + 2.6),
    new THREE.Vector3(gateFrame.position.x + 0.8, 0, gateFrame.position.z + 0.6),
    new THREE.Vector3(gatePt.x + 0.4, 0, gatePt.z - 0.6),
  ]);
  const sideData = buildRibbon(streamG, sideCurve, 24, "#35b6f2", 1, 0.07, 0.5, () => 1.9);
  sideData.centers.forEach(c => { c.y = 0; });
  streamG.userData.side = sideData;
  // perbarui pita tepian mengikuti bentuk yang sama (statis penuh)
  updateRibbon(bankData, 1, 1.35 / 1.35 * 1.0);
  bankData.mesh.geometry.setDrawRange(0, Infinity);

  // titik-titik aliran putih yang bergerak di atas pita
  const flowDots: THREE.Mesh[] = [];
  const dotMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35, emissive: "#cfeeff", emissiveIntensity: 0.35, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 42; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), dotMat);
    d.scale.set(1.9, 0.5, 0.9);
    d.castShadow = false;
    streamG.add(d); flowDots.push(d);
  }
  // Si Tetes: gumpalan air berwajah di ujung aliran
  const blob = new THREE.Group(); g.add(blob);
  const blobBodyG = new THREE.Group(); blob.add(blobBodyG);
  const drop = sph(blobBodyG, "#4fc3f7", 0.46, [0, 0.42, 0], [1, 1.1, 0.95], 0.18);
  drop.material = new THREE.MeshStandardMaterial({ color: "#4fc3f7", roughness: 0.15, emissive: "#1a86c9", emissiveIntensity: 0.35 });
  cone(blobBodyG, "#4fc3f7", 0.2, 0.5, [0, 1.05, 0]);
  (blobBodyG.children[1] as THREE.Mesh).material = drop.material;
  sph(blobBodyG, "#aee9ff", 0.16, [-0.16, 0.62, 0.3], [1, 1.4, 0.6], 0.2).castShadow = false;
  const blobEyeL = sphD(blobBodyG, "#12303f", 0.075, [0.37, 0.55, 0.21]);
  const blobEyeR = sphD(blobBodyG, "#12303f", 0.075, [0.37, 0.55, -0.21]);
  sphD(blobBodyG, "#ffffff", 0.028, [0.43, 0.62, 0.24]);
  sphD(blobBodyG, "#ffffff", 0.028, [0.43, 0.62, -0.18]);
  sphD(blobBodyG, "#ff9db0", 0.07, [0.33, 0.36, 0.3], [0.7, 0.6, 0.6]);
  sphD(blobBodyG, "#ff9db0", 0.07, [0.33, 0.36, -0.3], [0.7, 0.6, 0.6]);

  return {
    streamG, ribbon: ribbonData.mesh, ribbonIn: ribbonInData.mesh,
    branchRibbon: branchData.mesh, sideRibbon: sideData.mesh,
    flowDots, blob, blobBodyG, blobEyeL, blobEyeR,
    poolDisc, poolRings, springFall,
    clouds, cloudMats, sunMesh, sunGlow, raysG, motes,
    rainLines, rainRings, treesSway,
    birds1, bflies1, deer1, squirrel1,
    sapling, rabbit1, perchBirds, bflies2, squirrel2,
    farmer, birdDry, rabbitDry, lizard, lizardTail, puddles,
    kids, carrier, elder, gateBoard, wheel, ducks, chickens, riceWater,
    fishes, gulls, boat, crab, waves, seaSpark, splashRings, grownBird,
  };
}
