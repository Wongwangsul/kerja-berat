import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes, makeClouds, makeTree, makeBush, makeFlowers, rng,
} from "../../shared/kit";

export interface KelinciRefs {
  rabbit: THREE.Group; rabbitBodyG: THREE.Group; rabbitHeadG: THREE.Group;
  rabbitJawG: THREE.Group; rabbitEarL: THREE.Group; rabbitEarR: THREE.Group;
  rabbitLegFL: THREE.Group; rabbitLegFR: THREE.Group;
  rabbitLegBL: THREE.Group; rabbitLegBR: THREE.Group;
  rabbitEyeL: THREE.Mesh; rabbitEyeR: THREE.Mesh;
  fox: THREE.Group; foxBodyG: THREE.Group; foxHeadG: THREE.Group;
  foxJawG: THREE.Group; foxEarL: THREE.Group; foxEarR: THREE.Group;
  foxLegFL: THREE.Group; foxLegFR: THREE.Group; foxLegBL: THREE.Group; foxLegBR: THREE.Group;
  foxTailG: THREE.Group; foxEyeL: THREE.Mesh; foxEyeR: THREE.Mesh;
  squirrel: THREE.Group; squirrelBodyG: THREE.Group; squirrelHeadG: THREE.Group;
  squirrelJawG: THREE.Group; squirrelEarL: THREE.Group; squirrelEarR: THREE.Group;
  squirrelTailG: THREE.Group; squirrelMapG: THREE.Group; squirrelTwigG: THREE.Group;
  squirrelEyeL: THREE.Mesh; squirrelEyeR: THREE.Mesh;
  oakG: THREE.Group; holeG: THREE.Group;
  storeOldG: THREE.Group; storeNewG: THREE.Group; storeNewRoofG: THREE.Group;
  denG: THREE.Group; bushG: THREE.Group;
  rainG: THREE.Group; mudG: THREE.Group; printsG: THREE.Group;
  channelG: THREE.Group; waterG: THREE.Group; flowG: THREE.Group; dirtG: THREE.Group;
  foodG: THREE.Group; foodNewG: THREE.Group;
  grass: THREE.Group[]; flowers: THREE.Group[]; clouds: THREE.Group[];
  sparkles: THREE.Group; sunMesh: THREE.Mesh;
}

const RABBIT_CREAM = "#f2e6d0";
const RABBIT_TAN = "#d9b48a";
const RABBIT_WHITE = "#fff8ee";
const FOX_ORANGE = "#e8762a";
const FOX_DARK = "#d3641f";
const FOX_CREAM = "#fff3e0";
const SQ_BROWN = "#a85a2a";
const SQ_DARK = "#8a4a22";
const SQ_CREAM = "#f2d8b0";

// ---------------------------------------------------------------- rabbit
function buildRabbit(): {
  root: THREE.Group;
  refs: Pick<KelinciRefs, "rabbitBodyG" | "rabbitHeadG" | "rabbitJawG" | "rabbitEarL" | "rabbitEarR" | "rabbitLegFL" | "rabbitLegFR" | "rabbitLegBL" | "rabbitLegBR" | "rabbitEyeL" | "rabbitEyeR">;
} {
  const rabbit = new THREE.Group();
  const rabbitBodyG = new THREE.Group();
  rabbitBodyG.position.set(0, 0.62, 0);
  rabbit.add(rabbitBodyG);

  // body: cream ellipsoid, tan back, white belly
  sph(rabbitBodyG, RABBIT_CREAM, 0.5, [0, 0, 0], [1.25, 0.95, 0.9]);
  sph(rabbitBodyG, RABBIT_TAN, 0.45, [-0.05, 0.15, 0], [1.2, 0.8, 0.85]);
  sph(rabbitBodyG, RABBIT_WHITE, 0.4, [0.08, -0.2, 0], [1.1, 0.7, 0.78]);

  // head + muzzle + pink nose + front teeth (slightly visible)
  const rabbitHeadG = new THREE.Group();
  rabbitHeadG.position.set(0.55, 0.38, 0);
  rabbitBodyG.add(rabbitHeadG);
  sph(rabbitHeadG, RABBIT_CREAM, 0.34, [0, 0, 0], [1.05, 1, 0.95]);
  sph(rabbitHeadG, RABBIT_WHITE, 0.2, [0.28, -0.08, 0], [1.3, 0.8, 0.9]);
  sph(rabbitHeadG, "#e87a8a", 0.06, [0.48, -0.02, 0], [1, 0.85, 0.9], 0.5);
  sph(rabbitHeadG, "#ffffff", 0.055, [0.36, -0.22, 0.06], [0.8, 1.6, 0.6], 0.4);
  sph(rabbitHeadG, "#ffffff", 0.055, [0.36, -0.22, -0.06], [0.8, 1.6, 0.6], 0.4);
  const { eyeL, eyeR } = makeEyes(rabbitHeadG, 0.22, 0.14, 0.22, 0.075);
  // lower jaw (speaking)
  const rabbitJawG = new THREE.Group();
  rabbitJawG.position.set(0.28, -0.28, 0);
  rabbitHeadG.add(rabbitJawG);
  sph(rabbitJawG, RABBIT_WHITE, 0.14, [0.08, -0.02, 0], [1.4, 0.5, 0.8]);

  // long ears: pivot groups at the crown so they can flop (follow-through)
  const makeEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.05, 0.3, z);
    g.rotation.z = -0.15;
    rabbitHeadG.add(g);
    sph(g, RABBIT_CREAM, 0.16, [0, 0.35, 0], [0.55, 2.2, 0.35]);
    sph(g, "#f2b8c0", 0.09, [0.03, 0.32, 0], [0.5, 1.9, 0.3], 0.7);
    return g;
  };
  const rabbitEarL = makeEar(0.14);
  const rabbitEarR = makeEar(-0.14);

  // legs: strong hind feet (big round paws) + small front legs
  const mkHind = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.35, -0.35, z);
    rabbitBodyG.add(g);
    sph(g, RABBIT_TAN, 0.22, [0.05, -0.08, 0], [1.5, 0.75, 0.85]);
    return g;
  };
  const rabbitLegBL = mkHind(0.28);
  const rabbitLegBR = mkHind(-0.28);
  const mkFront = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.35, -0.38, z);
    rabbitBodyG.add(g);
    cyl(g, RABBIT_CREAM, 0.09, 0.08, 0.4, [0, -0.18, 0]);
    sph(g, RABBIT_CREAM, 0.1, [0.02, -0.38, 0], [1.2, 0.7, 1]);
    return g;
  };
  const rabbitLegFL = mkFront(0.2);
  const rabbitLegFR = mkFront(-0.2);

  // small round tail
  sph(rabbitBodyG, RABBIT_WHITE, 0.16, [-0.62, 0.05, 0]);

  return { root: rabbit, refs: { rabbitBodyG, rabbitHeadG, rabbitJawG, rabbitEarL, rabbitEarR, rabbitLegFL, rabbitLegFR, rabbitLegBL, rabbitLegBR, rabbitEyeL: eyeL, rabbitEyeR: eyeR } };
}

// ---------------------------------------------------------------- fox (dasar: uji Rubah, + rahang bawah)
function buildFox(): {
  root: THREE.Group;
  refs: Pick<KelinciRefs, "foxBodyG" | "foxHeadG" | "foxJawG" | "foxEarL" | "foxEarR" | "foxLegFL" | "foxLegFR" | "foxLegBL" | "foxLegBR" | "foxTailG" | "foxEyeL" | "foxEyeR">;
} {
  const fox = new THREE.Group();
  const foxBodyG = new THREE.Group();
  foxBodyG.position.set(0, 1.05, 0);
  fox.add(foxBodyG);

  sph(foxBodyG, FOX_ORANGE, 0.62, [0, 0, 0], [1.3, 0.95, 0.9]);
  sph(foxBodyG, FOX_CREAM, 0.5, [0.18, -0.22, 0], [1.15, 0.8, 0.78]);
  sph(foxBodyG, FOX_DARK, 0.45, [-0.52, -0.02, 0], [0.9, 0.95, 0.92]);

  const foxHeadG = new THREE.Group();
  foxHeadG.position.set(0.82, 0.36, 0);
  foxBodyG.add(foxHeadG);
  sph(foxHeadG, FOX_ORANGE, 0.4, [0, 0, 0]);
  sph(foxHeadG, FOX_CREAM, 0.3, [0.1, -0.16, 0], [1.0, 0.75, 1.05]);
  sph(foxHeadG, FOX_CREAM, 0.22, [0.3, -0.1, 0], [1.25, 0.8, 0.9]);
  sph(foxHeadG, "#3a2a26", 0.085, [0.56, -0.05, 0], [1, 0.85, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(foxHeadG, 0.3, 0.13, 0.21, 0.058);
  // lower jaw (speaking)
  const foxJawG = new THREE.Group();
  foxJawG.position.set(0.3, -0.28, 0);
  foxHeadG.add(foxJawG);
  sph(foxJawG, FOX_CREAM, 0.16, [0.08, -0.02, 0], [1.3, 0.45, 0.85]);

  const makeEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.06, 0.34, z);
    foxHeadG.add(g);
    cone(g, FOX_ORANGE, 0.17, 0.46, [0, 0.2, 0]);
    cone(g, "#ffb59e", 0.09, 0.26, [0.045, 0.17, 0]);
    return g;
  };
  const foxEarL = makeEar(0.2);
  const foxEarR = makeEar(-0.2);

  const makeLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.32, z);
    foxBodyG.add(g);
    cyl(g, FOX_DARK, 0.105, 0.085, 0.52, [0, -0.26, 0]);
    sph(g, FOX_DARK, 0.115, [0.05, -0.54, 0], [1.25, 0.75, 1]);
    return g;
  };
  const foxLegFL = makeLeg(0.42, 0.27);
  const foxLegFR = makeLeg(0.42, -0.27);
  const foxLegBL = makeLeg(-0.42, 0.27);
  const foxLegBR = makeLeg(-0.42, -0.27);

  // bushy tail: chain of spheres rising behind, cream tip
  const foxTailG = new THREE.Group();
  foxTailG.position.set(-0.78, 0.12, 0);
  foxTailG.scale.setScalar(0.9);
  foxBodyG.add(foxTailG);
  sph(foxTailG, FOX_ORANGE, 0.26, [-0.16, 0.02, 0], [1.2, 0.95, 0.95]);
  sph(foxTailG, FOX_ORANGE, 0.33, [-0.44, 0.14, 0], [1.25, 1, 1]);
  sph(foxTailG, FOX_CREAM, 0.27, [-0.74, 0.3, 0], [1.2, 0.95, 0.95]);

  return { root: fox, refs: { foxBodyG, foxHeadG, foxJawG, foxEarL, foxEarR, foxLegFL, foxLegFR, foxLegBL, foxLegBR, foxTailG, foxEyeL: eyeL, foxEyeR: eyeR } };
}

// ---------------------------------------------------------------- squirrel
function buildSquirrel(): {
  root: THREE.Group;
  refs: Pick<KelinciRefs, "squirrelBodyG" | "squirrelHeadG" | "squirrelJawG" | "squirrelEarL" | "squirrelEarR" | "squirrelTailG" | "squirrelMapG" | "squirrelTwigG" | "squirrelEyeL" | "squirrelEyeR">;
} {
  const sq = new THREE.Group();
  const squirrelBodyG = new THREE.Group();
  squirrelBodyG.position.set(0, 0.55, 0);
  sq.add(squirrelBodyG);

  sph(squirrelBodyG, SQ_BROWN, 0.42, [0, 0, 0], [1.2, 1.0, 0.9]);
  sph(squirrelBodyG, SQ_CREAM, 0.34, [0.1, -0.16, 0], [1.1, 0.8, 0.8]);
  sph(squirrelBodyG, SQ_DARK, 0.3, [-0.3, 0.1, 0], [1.0, 0.9, 0.9]);

  const squirrelHeadG = new THREE.Group();
  squirrelHeadG.position.set(0.45, 0.32, 0);
  squirrelBodyG.add(squirrelHeadG);
  sph(squirrelHeadG, SQ_BROWN, 0.3, [0, 0, 0], [1.05, 1, 0.95]);
  sph(squirrelHeadG, SQ_CREAM, 0.17, [0.22, -0.08, 0], [1.25, 0.8, 0.9]);
  sph(squirrelHeadG, "#3a2a26", 0.06, [0.42, -0.03, 0], [1, 0.85, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(squirrelHeadG, 0.2, 0.12, 0.18, 0.06);
  const squirrelJawG = new THREE.Group();
  squirrelJawG.position.set(0.22, -0.22, 0);
  squirrelHeadG.add(squirrelJawG);
  sph(squirrelJawG, SQ_CREAM, 0.12, [0.06, -0.02, 0], [1.3, 0.45, 0.8]);

  // small tufted ears
  const makeEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.05, 0.26, z);
    squirrelHeadG.add(g);
    cone(g, SQ_DARK, 0.11, 0.3, [0, 0.13, 0]);
    sph(g, SQ_BROWN, 0.05, [0, 0.3, 0]);
    return g;
  };
  const squirrelEarL = makeEar(0.15);
  const squirrelEarR = makeEar(-0.15);

  // big tail curving up over the back (follow-through)
  const squirrelTailG = new THREE.Group();
  squirrelTailG.position.set(-0.42, 0.12, 0);
  squirrelBodyG.add(squirrelTailG);
  sph(squirrelTailG, SQ_BROWN, 0.24, [-0.18, 0.1, 0], [1.2, 1, 1]);
  sph(squirrelTailG, SQ_DARK, 0.3, [-0.42, 0.42, 0], [1.15, 1.05, 1]);
  sph(squirrelTailG, SQ_BROWN, 0.28, [-0.52, 0.82, 0], [1.1, 1.05, 1]);
  sph(squirrelTailG, SQ_CREAM, 0.2, [-0.48, 1.14, 0], [1, 1, 1]);

  // hind feet + front paws
  sph(squirrelBodyG, SQ_DARK, 0.14, [-0.28, -0.4, 0.2], [1.4, 0.7, 0.9]);
  sph(squirrelBodyG, SQ_DARK, 0.14, [-0.28, -0.4, -0.2], [1.4, 0.7, 0.9]);
  sph(squirrelBodyG, SQ_BROWN, 0.1, [0.3, -0.3, 0.18], [1.2, 0.8, 1]);
  sph(squirrelBodyG, SQ_BROWN, 0.1, [0.3, -0.3, -0.18], [1.2, 0.8, 1]);

  // bark map: flattened bark slab with ABSTRACT scratch marks only (no text)
  const squirrelMapG = new THREE.Group();
  squirrelMapG.position.set(0.48, -0.05, 0.12);
  squirrelMapG.rotation.set(0.15, Math.PI / 2, 0.1); // fix2: peta menghadap kamera saat Tupai hadap kamera (ry -π/2)
  squirrelBodyG.add(squirrelMapG);
  sph(squirrelMapG, "#b08954", 0.35, [0, 0, 0], [1.25, 1.0, 0.14]);
  sph(squirrelMapG, "#c9a06a", 0.3, [0, 0.05, 0.03], [1.15, 0.9, 0.1]);
  // abstract scratches: short dark strokes + dots (goresan cakar, bukan huruf)
  const stroke = (x: number, y: number, rz: number, len: number) => {
    cyl(squirrelMapG, "#6b4a26", 0.018, 0.018, len, [x, y, 0.06], [0, 0, rz]);
  };
  stroke(-0.18, 0.12, 0.5, 0.22); stroke(0.05, 0.18, -0.3, 0.18); stroke(0.2, 0.02, 1.1, 0.2);
  stroke(-0.05, -0.14, 0.9, 0.24); stroke(0.18, -0.18, -0.6, 0.16); stroke(-0.22, -0.05, 0.1, 0.14);
  [[-0.28, 0.22], [0.28, 0.16], [0.02, -0.02], [-0.12, -0.24], [0.26, -0.06]].forEach(([x, y]) => {
    sph(squirrelMapG, "#6b4a26", 0.035, [x, y, 0.06]);
  });
  squirrelMapG.visible = false;

  // twig + leaves prop (s4: menahan tanah saluran)
  const squirrelTwigG = new THREE.Group();
  squirrelTwigG.position.set(0.42, -0.15, 0.2);
  squirrelTwigG.rotation.z = 0.5;
  squirrelBodyG.add(squirrelTwigG);
  cyl(squirrelTwigG, "#7a5230", 0.035, 0.045, 0.7, [0, 0.2, 0]);
  sph(squirrelTwigG, "#3f9e4d", 0.14, [0, 0.55, 0], [1.2, 0.7, 1]);
  sph(squirrelTwigG, "#49ac57", 0.12, [0.1, 0.45, 0.05], [1.2, 0.7, 1]);
  squirrelTwigG.visible = false;

  return { root: sq, refs: { squirrelBodyG, squirrelHeadG, squirrelJawG, squirrelEarL, squirrelEarR, squirrelTailG, squirrelMapG, squirrelTwigG, squirrelEyeL: eyeL, squirrelEyeR: eyeR } };
}

// ---------------------------------------------------------------- helpers
function buildHut(parent: THREE.Object3D, wood: string, roof: string, r: number, h: number): THREE.Group {
  const g = new THREE.Group();
  parent.add(g);
  cyl(g, wood, r, r * 1.05, h, [0, h / 2, 0]);
  // plank lines (thin darker rings)
  cyl(g, "#7a5230", r * 1.01, r * 1.01, 0.06, [0, h * 0.35, 0]);
  cyl(g, "#7a5230", r * 1.01, r * 1.01, 0.06, [0, h * 0.7, 0]);
  // dark doorway facing +z
  sph(g, "#241a12", 0.42 * r, [0, h * 0.32, r * 0.92], [0.8, 1.15, 0.3]);
  return g;
}

function buildCarrot(parent: THREE.Object3D, x: number, y: number, z: number, ry: number): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.z = ry;
  parent.add(g);
  cone(g, "#e8762a", 0.13, 0.55, [0, 0, 0], [0, 0, Math.PI]);
  sph(g, "#3f9e4d", 0.09, [-0.02, 0.3, 0], [1, 1.6, 0.6]);
  sph(g, "#49ac57", 0.08, [0.08, 0.28, 0.05], [1, 1.5, 0.6]);
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): KelinciRefs {
  const g = scene as unknown as THREE.Group;

  // meadow ground + rolling hills behind
  groundDisc(g, "#69b84a");
  const hillCols = ["#5da843", "#63ae47", "#76c253"];
  [[-24, -21, 22], [7, -25, 27], [30, -20, 19], [-40, -18, 17]].forEach(([x, z, rad], i) => {
    const h = sph(g, hillCols[i % 3], rad as number, [x as number, -(rad as number) * 0.82, z as number], [1, 0.55, 1], 1);
    h.castShadow = false;
  });

  // ---- big oak (pohon ek): trunk, spreading roots, dark hole under roots
  const oakG = new THREE.Group();
  oakG.position.set(6.0, 0, -4.0);
  g.add(oakG);
  cyl(oakG, "#7a5230", 0.55, 0.85, 3.4, [0, 1.7, 0]);
  cyl(oakG, "#6b4a26", 0.4, 0.6, 1.2, [0.7, 2.9, 0.2], [0, 0, -0.5]);
  cyl(oakG, "#6b4a26", 0.35, 0.55, 1.0, [-0.7, 3.0, -0.2], [0, 0, 0.5]);
  sph(oakG, "#2f7d3a", 2.2, [0, 4.6, 0]);
  sph(oakG, "#359046", 1.7, [1.6, 4.0, 0.4]);
  sph(oakG, "#49ac57", 1.6, [-1.5, 4.1, -0.3]);
  sph(oakG, "#359046", 1.4, [0.2, 5.6, -0.5]);
  sph(oakG, "#3f9e4d", 1.2, [-0.6, 3.6, 0.8]);
  // roots spreading toward the camera
  [[0.9, 0.15, 0.9], [-0.9, 0.12, 0.8], [0.2, 0.1, 1.2], [1.3, 0.1, 0.3], [-1.3, 0.1, 0.2]].forEach(([x, y, z]) => {
    sph(oakG, "#6b4a26", 0.35, [x, y, z], [1.6, 0.4, 1.0]);
  });
  // dark hole under the roots (front face, toward camera)
  const holeG = new THREE.Group();
  holeG.position.set(5.35, 0.42, -2.75);
  holeG.rotation.set(-0.25, -0.35, 0);
  g.add(holeG);
  sph(holeG, "#120d08", 0.55, [0, 0, 0], [1.15, 0.85, 0.25]);
  sph(holeG, "#241a12", 0.42, [0, 0.05, 0.08], [1.0, 0.7, 0.2]);

  // ---- Kelinci's small storehouse (empty at start), door open
  const storeOldG = new THREE.Group();
  storeOldG.position.set(-5.2, 0, -2.2);
  g.add(storeOldG);
  buildHut(storeOldG, "#a97a4a", "#8a4a22", 0.95, 1.25);
  const roofOld = new THREE.Group();
  roofOld.position.set(0, 1.25, 0);
  storeOldG.add(roofOld);
  cone(roofOld, "#8a4a22", 1.25, 0.8, [0, 0.4, 0]);
  sph(storeOldG, "#e8c88a", 0.3, [0.7, 0.5, 0.7], [1, 0.6, 1]); // hay tuft beside the hut

  // ---- fox den: mound + dark entrance
  const denG = new THREE.Group();
  denG.position.set(5.2, 0, -2.2); // fix koordinator g3350: sarang digeser ke belakang, diratakan
  g.add(denG);
  sph(denG, "#8a6a45", 1.0, [0, 0.3, 0], [1.4, 0.45, 1.1]);
  sph(denG, "#6b4a26", 0.7, [0.6, 0.2, 0.4], [1.2, 0.55, 1]);
  sph(denG, "#120d08", 0.45, [-0.5, 0.35, 0.85], [1, 0.9, 0.3]);

  // ---- bush (semak) where the footprints lead
  const bushG = new THREE.Group();
  bushG.position.set(-2.0, 0, -3.2);
  g.add(bushG);
  sph(bushG, "#359046", 0.65, [0, 0.32, 0], [1.25, 0.75, 1]);
  sph(bushG, "#3f9e4d", 0.45, [0.55, 0.24, 0.2], [1.2, 0.75, 1]);
  sph(bushG, "#2f7d3a", 0.4, [-0.5, 0.22, -0.15], [1.2, 0.7, 1]);

  // ---- hill + new shared storehouse (built in s5, on the hill away from water)
  const hillG = new THREE.Group();
  hillG.position.set(-7.5, 0, -6.5);
  g.add(hillG);
  const hill = sph(hillG, "#5da843", 4.2, [0, -2.6, 0], [1, 0.55, 1], 1);
  hill.castShadow = false;
  const storeNewG = new THREE.Group();
  storeNewG.position.set(-7.5, -0.25, -6.5);
  g.add(storeNewG);
  buildHut(storeNewG, "#b08a52", "#7a3a1a", 1.35, 1.7);
  const storeNewRoofG = new THREE.Group();
  storeNewRoofG.position.set(0, 1.7, 0);
  storeNewG.add(storeNewRoofG);
  cone(storeNewRoofG, "#7a3a1a", 1.75, 1.05, [0, 0.52, 0]);
  storeNewG.visible = false;

  // ---- mud patch + footprints (s1, hujan)
  const mudG = new THREE.Group();
  mudG.position.set(-4.6, 0.02, -1.2);
  g.add(mudG);
  const mud = sph(mudG, "#7a5230", 1.0, [0, 0, 0], [2.4, 0.12, 1.5], 0.35);
  mud.castShadow = false;
  const printsG = new THREE.Group();
  g.add(printsG);
  const printSpots: [number, number][] = [
    [-4.4, -0.9], [-4.0, -1.3], [-3.6, -1.6], [-3.2, -2.0],
    [-2.8, -2.3], [-2.4, -2.6], [-2.1, -2.9],
  ];
  printSpots.forEach(([x, z], i) => {
    sph(printsG, "#5d3d22", 0.12, [x, 0.04, z + (i % 2 === 0 ? 0.12 : -0.12)], [1.3, 0.35, 0.9], 0.6);
  });

  // ---- rain streaks (s1 only)
  const rainG = new THREE.Group();
  g.add(rainG);
  for (let i = 0; i < 42; i++) {
    const c = cyl(rainG, "#cfe6ff", 0.015, 0.015, 0.9, [0, 0, 0], [0.12, 0, 0]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#cfe6ff", transparent: true, opacity: 0.45 });
    (c as THREE.Mesh).castShadow = false;
    c.userData.seed = i;
  }

  // ---- dug channel + water (s4): from the hole down to the lower meadow
  const channelG = new THREE.Group();
  g.add(channelG);
  const trenchSpots: [number, number, number][] = [
    [5.0, -2.5, 0.3], [4.5, -2.0, 0.32], [4.0, -1.5, 0.34],
    [3.5, -1.0, 0.34], [3.0, -0.5, 0.32], [2.5, 0.0, 0.3], [2.2, 0.5, 0.28],
  ];
  trenchSpots.forEach(([x, z, r]) => {
    sph(channelG, "#6b4a26", r, [x, 0.05, z], [1.2, 0.25, 1], 0.8);
  });
  const waterG = new THREE.Group();
  g.add(waterG);
  trenchSpots.forEach(([x, z, r]) => {
    const w = sphT(waterG, "#7ec8e8", r * 0.85, 0.85, [x, 0.1, z], [1.2, 0.2, 1]);
    w.castShadow = false;
  });
  waterG.visible = false;
  const flowG = new THREE.Group();
  g.add(flowG);
  for (let i = 0; i < 4; i++) {
    const c = cyl(flowG, "#ffffff", 0.02, 0.02, 0.7, [0, 0.14, 0], [0, 0, Math.PI / 2]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#dff2ff", transparent: true, opacity: 0.7 });
    (c as THREE.Mesh).castShadow = false;
  }
  flowG.visible = false;

  // ---- dirt puffs while digging (s4)
  const dirtG = new THREE.Group();
  g.add(dirtG);
  for (let i = 0; i < 10; i++) {
    sphT(dirtG, "#8a6a45", 0.09, 0.9, [0, 0, 0]);
  }
  dirtG.visible = false;

  // ---- food rescued from the hole (carrots + seeds), s4 late + s5
  const foodG = new THREE.Group();
  foodG.position.set(4.55, 0.25, -2.1);
  g.add(foodG);
  buildCarrot(foodG, 0, 0.1, 0.15, 0.3);
  buildCarrot(foodG, 0.25, 0.08, -0.1, -0.4);
  buildCarrot(foodG, -0.2, 0.08, -0.2, 0.9);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    sph(foodG, i % 2 === 0 ? "#e8c88a" : "#c9a06a", 0.09, [Math.cos(a) * 0.35, 0.02, Math.sin(a) * 0.3 + 0.1]);
  }
  foodG.visible = false;
  const foodNewG = new THREE.Group();
  foodNewG.position.set(-6.4, -0.1, -5.8);
  g.add(foodNewG);
  buildCarrot(foodNewG, 0, 0.1, 0, 0.2);
  buildCarrot(foodNewG, 0.3, 0.08, 0.15, -0.5);
  for (let i = 0; i < 8; i++) {
    sph(foodNewG, "#e8c88a", 0.09, [-0.3 + (i % 4) * 0.18, 0.02, 0.25 + Math.floor(i / 4) * 0.15]);
  }
  foodNewG.visible = false;

  // ---- small trees, bushes, flowers, grass (swaying), clouds, sun
  makeTree(g, -9, -7.5, 1.15);
  makeTree(g, 12, -8, 1.2);
  makeTree(g, -13, -9, 1.4);
  makeTree(g, -1.5, -11, 1.0);
  makeBush(g, 1.5, -4.6, 1.0);
  makeBush(g, -8.5, -3.8, 1.1);
  makeBush(g, 9.5, -2.5, 0.9);
  const flowers = makeFlowers(g, 46, 11, -14, 14, -4.5, 3.5, (x, z) => Math.abs(z) < 0.9 && x > -5 && x < 4);
  const grass: THREE.Group[] = [];
  const gr = rng(23);
  for (let i = 0; i < 42; i++) {
    const x = -14 + gr() * 30, z = -4.5 + gr() * 8;
    const tuft = new THREE.Group();
    tuft.position.set(x, 0, z);
    tuft.userData.phase = gr() * Math.PI * 2;
    g.add(tuft);
    sph(tuft, "#57a83e", 0.17, [0, 0.07, 0], [1.15, 0.55, 1.15]);
    sph(tuft, "#63b84a", 0.11, [0.14, 0.05, 0.1], [1.1, 0.5, 1.1]);
    grass.push(tuft);
  }
  const clouds = makeClouds(g, [
    [-10, 6.7, -14, 1.4], [4.5, 7.5, -17, 1.7], [13, 6.3, -12.5, 1.1], [-19, 7.2, -16, 1.5],
  ]);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 18),
    new THREE.MeshBasicMaterial({ color: "#ffd94d" }));
  sunMesh.position.set(-13.5, 7.9, -22);
  g.add(sunMesh);

  const sparkles = makeSparkles(g, [
    [-6.0, 2.6, -5.0], [-5.2, 3.0, -5.4], [-7.0, 2.2, -5.2], [-6.6, 3.4, -5.8],
    [-5.6, 2.0, -4.6], [-7.4, 3.0, -5.0], [-6.2, 3.8, -5.6], [-5.0, 2.4, -5.8],
  ], 1.2);

  const rabbit = buildRabbit();
  g.add(rabbit.root);
  const fox = buildFox();
  fox.root.scale.setScalar(0.85); // Rubah sedikit lebih kecil dari Kelinci agar tidak menelan tokoh lain
  g.add(fox.root);
  const squirrel = buildSquirrel();
  g.add(squirrel.root);

  return {
    rabbit: rabbit.root, ...rabbit.refs,
    fox: fox.root, ...fox.refs,
    squirrel: squirrel.root, ...squirrel.refs,
    oakG, holeG, storeOldG, storeNewG, storeNewRoofG, denG, bushG,
    rainG, mudG, printsG, channelG, waterG, flowG, dirtG,
    foodG, foodNewG, grass, flowers, clouds, sparkles, sunMesh,
  };
}
