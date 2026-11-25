import * as THREE from "three";
import {
  smat, sph, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeTree, makeBush,
  makeFlowers, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface KucingRefs {
  cat: THREE.Group; catBodyG: THREE.Group; catHeadG: THREE.Group;
  catJawG: THREE.Group; catEarL: THREE.Group; catEarR: THREE.Group;
  catLegFL: THREE.Group; catLegFR: THREE.Group;
  catLegBL: THREE.Group; catLegBR: THREE.Group;
  catTailG: THREE.Group; catEyeL: THREE.Mesh; catEyeR: THREE.Mesh;
  giraffe: THREE.Group; girBodyG: THREE.Group; girNeckG: THREE.Group;
  girHeadG: THREE.Group; girJawG: THREE.Group;
  girEarL: THREE.Group; girEarR: THREE.Group;
  girLegFL: THREE.Group; girLegFR: THREE.Group;
  girLegBL: THREE.Group; girLegBR: THREE.Group;
  girTailG: THREE.Group; girEyeL: THREE.Mesh; girEyeR: THREE.Mesh;
  yarnG: THREE.Group; yarnStrand: THREE.Mesh;
  clouds: THREE.Group[]; flowers: THREE.Group[]; sparkles: THREE.Group;
}

const ORANGE = "#f08a1d";
const ORANGE_DARK = "#d96f0e";
const CREAM = "#ffd9a0";
const YELLOW = "#f2c14e";
const BROWN = "#8a5a2e";
const BROWN_DARK = "#6b4423";

// ---------------------------------------------------------------- cat
function buildCat(): {
  root: THREE.Group;
  refs: Pick<KucingRefs, "catBodyG" | "catHeadG" | "catJawG" | "catEarL" | "catEarR"
    | "catLegFL" | "catLegFR" | "catLegBL" | "catLegBR" | "catTailG"
    | "catEyeL" | "catEyeR">;
} {
  const cat = new THREE.Group();
  const catBodyG = new THREE.Group();
  catBodyG.position.set(0, 0.45, 0);
  cat.add(catBodyG);

  // body: orange ellipsoid + cream belly + darker back stripes
  sph(catBodyG, ORANGE, 0.42, [0, 0, 0], [1.35, 0.9, 0.85]);
  sph(catBodyG, CREAM, 0.3, [0.15, -0.12, 0], [1.2, 0.7, 0.8]);
  sph(catBodyG, ORANGE_DARK, 0.12, [-0.28, 0.3, 0], [0.5, 0.6, 1.05]);
  sph(catBodyG, ORANGE_DARK, 0.12, [0, 0.34, 0], [0.5, 0.6, 1.05]);
  sph(catBodyG, ORANGE_DARK, 0.12, [0.28, 0.3, 0], [0.5, 0.6, 1.05]);

  // head
  const catHeadG = new THREE.Group();
  catHeadG.position.set(0.52, 0.2, 0);
  catBodyG.add(catHeadG);
  sph(catHeadG, ORANGE, 0.3, [0, 0, 0]);
  sph(catHeadG, CREAM, 0.16, [0.24, -0.08, 0], [1.1, 0.8, 0.9]);
  sph(catHeadG, "#e86a8a", 0.05, [0.38, -0.02, 0], [1, 0.8, 0.8], 0.5);
  const { eyeL, eyeR } = makeEyes(catHeadG, 0.18, 0.1, 0.17, 0.05);
  // whiskers: two thin pale lines each side of the muzzle
  cyl(catHeadG, "#fff2d8", 0.008, 0.008, 0.24, [0.3, -0.04, 0.2], [0.5, 0, 1.25]);
  cyl(catHeadG, "#fff2d8", 0.008, 0.008, 0.24, [0.3, -0.08, 0.2], [0.2, 0, 1.45]);
  cyl(catHeadG, "#fff2d8", 0.008, 0.008, 0.24, [0.3, -0.04, -0.2], [-0.5, 0, 1.25]);
  cyl(catHeadG, "#fff2d8", 0.008, 0.008, 0.24, [0.3, -0.08, -0.2], [-0.2, 0, 1.45]);
  // lower jaw (speaking)
  const catJawG = new THREE.Group();
  catJawG.position.set(0.2, -0.2, 0);
  catHeadG.add(catJawG);
  sph(catJawG, "#c96a12", 0.09, [0.05, -0.03, 0], [1.3, 0.5, 0.9]);

  // pointy ears, pivot at the base so they can twitch / fold back
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.02, 0.26, z);
    catHeadG.add(g);
    cone(g, ORANGE, 0.11, 0.24, [0, 0.1, 0]);
    cone(g, "#e86a8a", 0.06, 0.12, [0.01, 0.08, 0]);
    g.rotation.x = z > 0 ? -0.18 : 0.18;
    return g;
  };
  const catEarL = mkEar(0.17);
  const catEarR = mkEar(-0.17);

  // legs: short columns + round paws, pivot at the hip
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.18, z);
    catBodyG.add(g);
    cyl(g, ORANGE, 0.07, 0.06, 0.24, [0, -0.12, 0]);
    sph(g, CREAM, 0.08, [0.02, -0.24, 0], [1.3, 0.6, 1.1]);
    return g;
  };
  const catLegFL = mkLeg(0.3, 0.18);
  const catLegFR = mkLeg(0.3, -0.18);
  const catLegBL = mkLeg(-0.32, 0.18);
  const catLegBR = mkLeg(-0.32, -0.18);

  // long tail, pivot at the rear so it can wag and droop
  const catTailG = new THREE.Group();
  catTailG.position.set(-0.52, 0.15, 0);
  catBodyG.add(catTailG);
  cyl(catTailG, ORANGE, 0.055, 0.045, 0.5, [-0.14, 0.22, 0], [0, 0, 0.7]);
  sph(catTailG, ORANGE_DARK, 0.07, [-0.3, 0.42, 0]);

  return {
    root: cat,
    refs: {
      catBodyG, catHeadG, catJawG, catEarL, catEarR,
      catLegFL, catLegFR, catLegBL, catLegBR, catTailG,
      catEyeL: eyeL, catEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- giraffe
function buildGiraffe(): {
  root: THREE.Group;
  refs: Pick<KucingRefs, "girBodyG" | "girNeckG" | "girHeadG" | "girJawG"
    | "girEarL" | "girEarR" | "girLegFL" | "girLegFR" | "girLegBL" | "girLegBR"
    | "girTailG" | "girEyeL" | "girEyeR">;
} {
  const giraffe = new THREE.Group();
  const girBodyG = new THREE.Group();
  girBodyG.position.set(0, 2.0, 0);
  giraffe.add(girBodyG);

  // body: yellow ellipsoid + cream belly + brown spots (seeded, on surface)
  sph(girBodyG, YELLOW, 0.85, [0, 0, 0], [1.6, 0.95, 0.8]);
  sph(girBodyG, "#fbe3a1", 0.6, [0.1, -0.35, 0], [1.4, 0.7, 0.75]);
  const sr = rng(7);
  for (let i = 0; i < 11; i++) {
    const a = sr() * Math.PI * 2;
    const b = (sr() - 0.5) * 1.1;
    const x = Math.cos(a) * 1.15;
    const y = 0.15 + Math.sin(b) * 0.55;
    const z = Math.sin(a) * 0.62;
    sph(girBodyG, BROWN, 0.13 + sr() * 0.08, [x, y, z], [1, 0.75, 0.35]);
  }

  // neck: long, pivoted at the front-top of the body so it can bow
  const girNeckG = new THREE.Group();
  girNeckG.position.set(0.95, 0.45, 0);
  girBodyG.add(girNeckG);
  cyl(girNeckG, YELLOW, 0.22, 0.3, 2.0, [0, 1.0, 0]);
  // mane: short dark ridge along the back of the neck
  for (let i = 0; i < 5; i++) {
    sph(girNeckG, BROWN_DARK, 0.11, [-0.24, 0.35 + i * 0.36, 0], [0.6, 1, 0.5]);
  }
  // neck spots
  sph(girNeckG, BROWN, 0.1, [0.14, 0.8, 0.14], [1, 1, 0.4]);
  sph(girNeckG, BROWN, 0.09, [0.15, 1.4, -0.13], [1, 1, 0.4]);
  sph(girNeckG, BROWN, 0.08, [-0.1, 1.8, 0.12], [1, 1, 0.4]);

  // head: small, elongated, at the top of the neck
  const girHeadG = new THREE.Group();
  girHeadG.position.set(0, 2.05, 0);
  girNeckG.add(girHeadG);
  sph(girHeadG, YELLOW, 0.3, [0, 0, 0], [1.6, 0.95, 0.85]);
  sph(girHeadG, "#c98f4e", 0.18, [0.38, -0.08, 0], [1.3, 0.8, 0.9]);
  sph(girHeadG, "#5a3d24", 0.05, [0.55, -0.04, 0], [1, 0.8, 0.8], 0.5);
  const { eyeL, eyeR } = makeEyes(girHeadG, 0.28, 0.12, 0.18, 0.055);
  // ossicones: two little knobs on top
  cyl(girHeadG, BROWN_DARK, 0.035, 0.03, 0.26, [-0.05, 0.32, 0.12], [0, 0, 0.15]);
  cyl(girHeadG, BROWN_DARK, 0.035, 0.03, 0.26, [-0.05, 0.32, -0.12], [0, 0, 0.15]);
  sph(girHeadG, BROWN_DARK, 0.06, [-0.09, 0.46, 0.12]);
  sph(girHeadG, BROWN_DARK, 0.06, [-0.09, 0.46, -0.12]);
  // lower jaw (speaking)
  const girJawG = new THREE.Group();
  girJawG.position.set(0.3, -0.22, 0);
  girHeadG.add(girJawG);
  sph(girJawG, "#b97f3e", 0.12, [0.05, -0.03, 0], [1.4, 0.5, 0.9]);

  // ears: flattened, sticking out sideways
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.12, 0.14, z);
    girHeadG.add(g);
    sph(g, YELLOW, 0.14, [0, 0, z > 0 ? 0.08 : -0.08], [1.2, 0.45, 0.7]);
    sph(g, BROWN, 0.07, [0, 0, z > 0 ? 0.14 : -0.14], [1, 0.4, 0.6]);
    return g;
  };
  const girEarL = mkEar(0.3);
  const girEarR = mkEar(-0.3);

  // legs: long columns + dark hooves, pivot at the hip
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.55, z);
    girBodyG.add(g);
    sph(g, YELLOW, 0.17, [0, -0.08, 0], [1, 1.4, 1]);
    cyl(g, YELLOW, 0.11, 0.09, 1.4, [0, -0.7, 0]);
    sph(g, "#4a3524", 0.11, [0, -1.4, 0], [1.2, 0.7, 1.2]);
    return g;
  };
  const girLegFL = mkLeg(0.75, 0.35);
  const girLegFR = mkLeg(0.75, -0.35);
  const girLegBL = mkLeg(-0.75, 0.35);
  const girLegBR = mkLeg(-0.75, -0.35);

  // tail with dark tuft
  const girTailG = new THREE.Group();
  girTailG.position.set(-1.3, 0.1, 0);
  girBodyG.add(girTailG);
  cyl(girTailG, YELLOW, 0.05, 0.04, 0.9, [-0.08, -0.4, 0], [0, 0, 0.25]);
  sph(girTailG, BROWN_DARK, 0.11, [-0.2, -0.85, 0], [0.8, 1.5, 0.8]);

  return {
    root: giraffe,
    refs: {
      girBodyG, girNeckG, girHeadG, girJawG, girEarL, girEarR,
      girLegFL, girLegFR, girLegBL, girLegBR, girTailG,
      girEyeL: eyeL, girEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): KucingRefs {
  const g = scene as unknown as THREE.Group;

  // yard: green ground, soft hills behind, morning sky props
  groundDisc(g, "#69b84a");
  const hills: [number, number, number, string][] = [
    [-22, -22, 20, "#5da843"], [8, -24, 24, "#63ae47"], [28, -20, 18, "#76c253"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.82, z], [1, 0.55, 1], 1);
    h.castShadow = false;
  });

  // little house at the far left (home yard): cream body + terracotta roof
  const houseG = new THREE.Group();
  houseG.position.set(-8.5, 0, -7);
  g.add(houseG);
  cyl(houseG, "#f5e6c8", 1.9, 1.9, 2.4, [0, 1.2, 0]);
  cone(houseG, "#c96a3e", 2.5, 1.8, [0, 3.3, 0]);
  cyl(houseG, "#8a5a36", 0.22, 0.22, 1.0, [1.0, 3.9, 0]);
  sph(houseG, "#6b4423", 0.42, [0, 0.7, 1.85], [0.85, 1.35, 0.3]);
  sph(houseG, "#bfe3f2", 0.28, [-1.0, 1.5, 1.8], [1, 1, 0.3]);
  sph(houseG, "#bfe3f2", 0.28, [1.0, 1.5, 1.8], [1, 1, 0.3]);

  // wooden fence along the left edge of the yard
  const fenceG = new THREE.Group();
  g.add(fenceG);
  for (let i = 0; i < 5; i++) {
    cyl(fenceG, "#8a5a36", 0.09, 0.09, 1.1, [-6.2, 0.55, -3.5 + i * 1.5]);
  }
  cyl(fenceG, "#a9743f", 0.06, 0.06, 6.2, [-6.2, 0.5, -0.5], [Math.PI / 2, 0, 0]);
  cyl(fenceG, "#a9743f", 0.06, 0.06, 6.2, [-6.2, 0.9, -0.5], [Math.PI / 2, 0, 0]);

  // trees framing the yard (right tree pushed far back so its canopy
  // never crowds the giraffe's head)
  makeTree(g, -5.8, -4.5, 1.5);
  makeTree(g, 10.5, -7, 1.3);

  // thorny bush on the right (the yarn's destination) + a smaller one.
  // Kept CLEAR of the giraffe's feet (giraffe max x 3.9, legs z -0.15..-0.85)
  // so it never reads as the giraffe standing in the bush.
  const bushG = makeBush(g, 5.4, -2.0, 1.4, ["#2e7d32", "#359046"]);
  const thr = rng(9);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + thr() * 0.4;
    cone(bushG, "#1e4d24", 0.05, 0.34,
      [Math.cos(a) * 0.72, 0.55 + (k % 2) * 0.22, Math.sin(a) * 0.58],
      [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]);
  }
  makeBush(g, 7.0, -3.0, 1.0, ["#2e7d32", "#359046"]);

  makeGrassTufts(g, 55, 31, -7, 7.5, -3, 4);
  const flowers = makeFlowers(g, 42, 32, -6.5, 7, -2.5, 3.5, (x, z) => Math.abs(z - 0.9) < 0.5 && x > -4 && x < 4.5);

  const clouds = makeClouds(g, [
    [-10, 6.7, -14, 1.4], [10, 8.5, -18, 1.7], [13, 6.3, -12.5, 1.1], [-19, 7.2, -16, 1.5],
  ]);
  makeSun(g, -13.5, 7.9, -22);

  // red yarn ball: wound ball + torus wrap; rolls along the yard
  const yarnG = new THREE.Group();
  g.add(yarnG);
  sph(yarnG, "#d92b2b", 0.32, [0, 0, 0]);
  const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 12, 32), smat("#a81f1f"));
  wrap.rotation.x = Math.PI / 2.4;
  wrap.castShadow = true;
  yarnG.add(wrap);
  const wrap2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 12, 32), smat("#e84a4a"));
  wrap2.rotation.y = Math.PI / 2.2;
  wrap2.castShadow = true;
  yarnG.add(wrap2);
  // loose strand trailing on the ground behind the ball
  const yarnStrand = cyl(g, "#d92b2b", 0.02, 0.02, 0.55, [0, 0.05, 0.9], [0, 0, Math.PI / 2]);
  yarnStrand.castShadow = false;

  // sparkles: catch moment (line 6) + warm close (line 7), around the yarn
  const sparkles = makeSparkles(g, [
    [4.3, 1.1, 1.0], [4.7, 0.9, 0.6], [3.9, 1.3, 1.1], [3.4, 2.0, 0.5], [5.0, 1.5, 0.8],
  ], 1.2);

  const cat = buildCat();
  g.add(cat.root);
  const gir = buildGiraffe();
  g.add(gir.root);

  return {
    cat: cat.root, ...cat.refs,
    giraffe: gir.root, ...gir.refs,
    yarnG, yarnStrand,
    clouds, flowers, sparkles,
  };
}
