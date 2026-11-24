import * as THREE from "three";
import {
  sph, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeTree, makeBush,
  makeFlowers, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface KelinciRefs {
  rabbit: THREE.Group; rabBodyG: THREE.Group; rabHeadG: THREE.Group;
  rabJawG: THREE.Group; rabEarL: THREE.Group; rabEarR: THREE.Group;
  rabLegFL: THREE.Group; rabLegFR: THREE.Group;
  rabLegBL: THREE.Group; rabLegBR: THREE.Group;
  rabEyeL: THREE.Mesh; rabEyeR: THREE.Mesh;
  lion: THREE.Group; lionBodyG: THREE.Group; lionHeadG: THREE.Group;
  lionJawG: THREE.Group; lionLegFL: THREE.Group; lionLegFR: THREE.Group;
  lionLegBL: THREE.Group; lionLegBR: THREE.Group; lionTailG: THREE.Group;
  lionEyeL: THREE.Mesh; lionEyeR: THREE.Mesh;
  clouds: THREE.Group[]; flowers: THREE.Group[];
  dirtG: THREE.Group; sparkles: THREE.Group; bushG: THREE.Group;
}

const CREAM = "#f3e3c2";
const CREAM_DARK = "#e0c9a0";
const ORANGE = "#e08a2e";
const ORANGE_DARK = "#c96f1d";
const MANE = "#b45a1a";

// ---------------------------------------------------------------- rabbit
function buildRabbit(): {
  root: THREE.Group;
  refs: Pick<KelinciRefs, "rabBodyG" | "rabHeadG" | "rabJawG" | "rabEarL" | "rabEarR" | "rabLegFL" | "rabLegFR" | "rabLegBL" | "rabLegBR" | "rabEyeL" | "rabEyeR">;
} {
  const rabbit = new THREE.Group();
  const rabBodyG = new THREE.Group();
  rabBodyG.position.set(0, 0.55, 0);
  rabbit.add(rabBodyG);

  sph(rabBodyG, CREAM, 0.45, [0, 0, 0], [1.3, 0.95, 0.9]);
  sph(rabBodyG, "#fff8ea", 0.36, [0.12, -0.18, 0], [1.2, 0.75, 0.8]);
  // fluffy tail
  sph(rabBodyG, "#ffffff", 0.16, [-0.58, 0.08, 0]);

  const rabHeadG = new THREE.Group();
  rabHeadG.position.set(0.55, 0.32, 0);
  rabBodyG.add(rabHeadG);
  sph(rabHeadG, CREAM, 0.32, [0, 0, 0]);
  sph(rabHeadG, "#fff8ea", 0.18, [0.22, -0.08, 0], [1.2, 0.8, 0.9]);
  sph(rabHeadG, "#d98a94", 0.05, [0.4, -0.04, 0], [1, 0.8, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(rabHeadG, 0.24, 0.12, 0.2, 0.05);
  // lower jaw
  const rabJawG = new THREE.Group();
  rabJawG.position.set(0.18, -0.18, 0);
  rabHeadG.add(rabJawG);
  sph(rabJawG, CREAM_DARK, 0.12, [0.06, -0.04, 0], [1.3, 0.55, 0.9]);

  // long ears: pivot at base, elongated spheres with pink inner
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.08, 0.28, z);
    rabHeadG.add(g);
    sph(g, CREAM, 0.16, [0, 0.3, 0], [0.55, 1.9, 0.4]);
    sph(g, "#f2b8c6", 0.09, [0.02, 0.28, 0], [0.5, 1.7, 0.35]);
    return g;
  };
  const rabEarL = mkEar(0.13);
  const rabEarR = mkEar(-0.13);

  // legs: big hind feet + small front paws
  const mkHind = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.28, -0.32, z);
    rabBodyG.add(g);
    sph(g, CREAM_DARK, 0.16, [0.02, -0.12, 0], [1.6, 0.7, 0.9]);
    return g;
  };
  const rabLegBL = mkHind(0.22);
  const rabLegBR = mkHind(-0.22);
  const mkFront = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.38, -0.3, z);
    rabBodyG.add(g);
    cyl(g, CREAM_DARK, 0.06, 0.05, 0.34, [0, -0.17, 0]);
    sph(g, CREAM_DARK, 0.07, [0.03, -0.34, 0], [1.3, 0.7, 1]);
    return g;
  };
  const rabLegFL = mkFront(0.18);
  const rabLegFR = mkFront(-0.18);

  return { root: rabbit, refs: { rabBodyG, rabHeadG, rabJawG, rabEarL, rabEarR, rabLegFL, rabLegFR, rabLegBL, rabLegBR, rabEyeL: eyeL, rabEyeR: eyeR } };
}

// ---------------------------------------------------------------- lion
function buildLion(): {
  root: THREE.Group;
  refs: Pick<KelinciRefs, "lionBodyG" | "lionHeadG" | "lionJawG" | "lionLegFL" | "lionLegFR" | "lionLegBL" | "lionLegBR" | "lionTailG" | "lionEyeL" | "lionEyeR">;
} {
  const lion = new THREE.Group();
  const lionBodyG = new THREE.Group();
  lionBodyG.position.set(0, 1.0, 0);
  lion.add(lionBodyG);

  sph(lionBodyG, ORANGE, 0.75, [0, 0, 0], [1.5, 0.95, 0.9]);
  sph(lionBodyG, "#f2c078", 0.6, [0.2, -0.28, 0], [1.35, 0.75, 0.8]);

  const lionHeadG = new THREE.Group();
  lionHeadG.position.set(1.05, 0.5, 0);
  lionBodyG.add(lionHeadG);
  // mane: a flattened disc framing the face (reads as a mane in profile too),
  // with a few rim balls for texture — not a ring of balls, which read as a stack
  // NOTE (QC 24 Nov): disc + rim enlarged so the mane reads as a halo from
  // every angle — the small version read as a brown cap on the head.
  sph(lionHeadG, MANE, 0.62, [-0.24, -0.03, 0], [0.5, 1.0, 1.0]);
  for (let i = 0; i < 7; i++) {
    const a = (-0.6 + i * 0.2) * Math.PI;
    sph(lionHeadG, MANE, 0.23, [-0.26, Math.sin(a) * 0.62, Math.cos(a) * 0.62]);
  }
  sph(lionHeadG, ORANGE, 0.5, [0.18, 0, 0]);
  sph(lionHeadG, "#f2c078", 0.28, [0.48, -0.12, 0], [1.2, 0.85, 0.9]);
  sph(lionHeadG, "#5a3a22", 0.075, [0.72, -0.06, 0], [1, 0.85, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(lionHeadG, 0.52, 0.16, 0.32, 0.06);
  // ears peeking out of the mane
  sph(lionHeadG, ORANGE_DARK, 0.1, [-0.05, 0.42, 0.3], [1, 0.8, 0.6]);
  sph(lionHeadG, ORANGE_DARK, 0.1, [-0.05, 0.42, -0.3], [1, 0.8, 0.6]);
  // lower jaw
  const lionJawG = new THREE.Group();
  lionJawG.position.set(0.3, -0.28, 0);
  lionHeadG.add(lionJawG);
  sph(lionJawG, ORANGE_DARK, 0.2, [0.1, -0.06, 0], [1.3, 0.55, 0.9]);

  // legs: thick columns + big paws
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.5, z);
    lionBodyG.add(g);
    cyl(g, ORANGE_DARK, 0.16, 0.13, 0.55, [0, -0.27, 0]);
    sph(g, ORANGE_DARK, 0.18, [0.05, -0.56, 0], [1.3, 0.7, 1]);
    return g;
  };
  const lionLegFL = mkLeg(0.55, 0.32);
  const lionLegFR = mkLeg(0.55, -0.32);
  const lionLegBL = mkLeg(-0.55, 0.32);
  const lionLegBR = mkLeg(-0.55, -0.32);

  // tail with tuft
  const lionTailG = new THREE.Group();
  lionTailG.position.set(-1.05, 0.15, 0);
  lionBodyG.add(lionTailG);
  cyl(lionTailG, ORANGE, 0.07, 0.07, 0.7, [-0.3, 0.05, 0], [0, 0, 1.1]);
  sph(lionTailG, MANE, 0.16, [-0.62, 0.22, 0]);

  return { root: lion, refs: { lionBodyG, lionHeadG, lionJawG, lionLegFL, lionLegFR, lionLegBL, lionLegBR, lionTailG, lionEyeL: eyeL, lionEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): KelinciRefs {
  const g = scene as unknown as THREE.Group;

  // dry savanna ground + green meadow patch on the right (the safe goal)
  groundDisc(g, "#c2a95c");
  const patch = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40),
    new THREE.MeshStandardMaterial({ color: new THREE.Color("#58b368"), roughness: 1, flatShading: false }));
  patch.rotation.x = -Math.PI / 2; patch.position.set(3.6, 0.02, 0); patch.receiveShadow = true;
  g.add(patch);
  const hills: [number, number, number, string][] = [
    [-24, -21, 22, "#a8984e"], [7, -25, 27, "#b3a254"], [30, -20, 19, "#c2a95c"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.82, z], [1, 0.55, 1], 1);
    h.castShadow = false;
  });
  makeGrassTufts(g, 60, 31, -15, 17, -3, 9, "#a8933f", "#bfae55");
  const flowers = makeFlowers(g, 30, 32, 1.5, 16, -2.5, 7.5);
  makeTree(g, -9, -8, 1.2, "#8a5a36", ["#5da843", "#4d9e3f", "#63b84a"]);
  makeTree(g, 9, -9.5, 1.35, "#8a5a36", ["#5da843", "#4d9e3f", "#63b84a"]);
  makeTree(g, -15, -7, 1.0, "#8a5a36", ["#5da843", "#4d9e3f", "#63b84a"]);
  makeBush(g, -6.5, -3.6, 1); makeBush(g, 7.5, -4, 1.1);

  // thorn bush in the middle: dark spiky ball cluster, set back so it never
  // swallows the lion's head (the lion walks in front of it, not through it)
  const bushG = new THREE.Group();
  bushG.position.set(0.0, 0, -2.4);
  g.add(bushG);
  sph(bushG, "#2e6b34", 0.95, [0, 0.95, 0], [1.25, 1, 1]);
  sph(bushG, "#357a3b", 0.7, [0.65, 0.65, 0.2], [1.1, 0.9, 1]);
  sph(bushG, "#275c2c", 0.65, [-0.65, 0.6, -0.2], [1.1, 0.9, 1]);
  sph(bushG, "#3f8a44", 0.58, [0.1, 1.6, 0], [1, 0.9, 1]);
  const r = rng(41);
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2;
    const y = 0.35 + r() * 1.6;
    const rr = 0.75 + r() * 0.35;
    cone(bushG, "#1f4d24", 0.08, 0.45,
      [Math.cos(a) * rr, y, Math.sin(a) * rr * 0.8],
      [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]);
  }

  const clouds = makeClouds(g, [
    [-10, 6.7, -14, 1.4], [4.5, 7.5, -17, 1.7], [13, 6.3, -12.5, 1.1], [-19, 7.2, -16, 1.5],
  ]);
  makeSun(g, -13.5, 7.9, -22);

  // flying dirt (digging, lines 2–3 and 5)
  const dirtG = new THREE.Group();
  g.add(dirtG);
  for (let i = 0; i < 10; i++) {
    sph(dirtG, "#8a6a3a", 0.07, [0, 0, 0], [1, 1, 1], 1);
  }
  dirtG.visible = false;

  const sparkles = makeSparkles(g, [
    [2.6, 1.6, 0.4], [3.6, 1.4, 0.2], [3.1, 1.9, -0.2], [2.3, 1.1, 0.6], [4.1, 1.8, 0.4],
  ], 1.2);

  const rabbit = buildRabbit();
  g.add(rabbit.root);
  const lion = buildLion();
  g.add(lion.root);

  return {
    rabbit: rabbit.root, ...rabbit.refs,
    lion: lion.root, ...lion.refs,
    clouds, flowers, dirtG, sparkles, bushG,
  };
}
