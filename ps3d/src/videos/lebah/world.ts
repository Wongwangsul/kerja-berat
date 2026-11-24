import * as THREE from "three";
import {
  smat, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeTree, makeBush,
  makeFlowers, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface LebahRefs {
  bee: THREE.Group; beeBodyG: THREE.Group; beeHeadG: THREE.Group;
  beeJawG: THREE.Group; beeWingL: THREE.Group; beeWingR: THREE.Group;
  beeLegF: THREE.Group; beeEyeL: THREE.Mesh; beeEyeR: THREE.Mesh;
  pollenG: THREE.Group; pollenBits: THREE.Group;
  pelican: THREE.Group; pelBodyG: THREE.Group; pelHeadG: THREE.Group;
  pelBeakLowG: THREE.Group; pelWingL: THREE.Group; pelWingR: THREE.Group;
  pelLegL: THREE.Group; pelLegR: THREE.Group;
  pelEyeL: THREE.Mesh; pelEyeR: THREE.Mesh;
  clouds: THREE.Group[]; flowers: THREE.Group[];
  windG: THREE.Group; sparkles: THREE.Group; nestG: THREE.Group;
}

const YELLOW = "#f7c531";
const DARK = "#3a2a1a";
const WHITE = "#ffffff";
const ORANGE = "#f08a1d";

// ---------------------------------------------------------------- bee
function buildBee(): {
  root: THREE.Group;
  refs: Pick<LebahRefs, "beeBodyG" | "beeHeadG" | "beeJawG" | "beeWingL" | "beeWingR" | "beeLegF" | "beeEyeL" | "beeEyeR" | "pollenG">;
} {
  const bee = new THREE.Group();
  const beeBodyG = new THREE.Group();
  bee.add(beeBodyG);

  // body: yellow ellipsoid + two dark bands (flattened spheres poking out)
  sph(beeBodyG, YELLOW, 0.26, [0, 0, 0], [1.35, 1, 0.95]);
  sph(beeBodyG, DARK, 0.27, [-0.1, 0, 0], [0.26, 1.02, 0.98]);
  sph(beeBodyG, DARK, 0.27, [0.12, 0, 0], [0.24, 1.02, 0.98]);
  // fuzzy belly
  sph(beeBodyG, "#ffe9a8", 0.2, [0.02, -0.14, 0], [1.2, 0.7, 0.85]);

  // head
  const beeHeadG = new THREE.Group();
  beeHeadG.position.set(0.34, 0.06, 0);
  beeBodyG.add(beeHeadG);
  sph(beeHeadG, DARK, 0.16, [0, 0, 0]);
  const { eyeL, eyeR } = makeEyes(beeHeadG, 0.08, 0.06, 0.1, 0.05, "#1c1410");
  // antennae
  cyl(beeHeadG, DARK, 0.012, 0.012, 0.22, [0.08, 0.2, 0.07], [0, 0, -0.5]);
  cyl(beeHeadG, DARK, 0.012, 0.012, 0.22, [0.08, 0.2, -0.07], [0, 0, -0.5]);
  // lower jaw (speaking)
  const beeJawG = new THREE.Group();
  beeJawG.position.set(0.1, -0.1, 0);
  beeHeadG.add(beeJawG);
  sph(beeJawG, "#5a3d24", 0.07, [0.05, -0.03, 0], [1.3, 0.6, 0.9]);

  // wings: translucent, pivot at top of body
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.02, 0.2, z);
    beeBodyG.add(g);
    sphT(g, "#ffffff", 0.22, 0.55, [0, 0.06, z > 0 ? 0.12 : -0.12], [1.5, 0.12, 0.7]);
    return g;
  };
  const beeWingL = mkWing(0.1);
  const beeWingR = mkWing(-0.1);

  // front leg (waves at the end)
  const beeLegF = new THREE.Group();
  beeLegF.position.set(0.2, -0.2, 0.14);
  beeBodyG.add(beeLegF);
  cyl(beeLegF, DARK, 0.02, 0.015, 0.22, [0, -0.1, 0]);

  // pollen ball carried underneath
  const pollenG = new THREE.Group();
  pollenG.position.set(-0.05, -0.34, 0);
  beeBodyG.add(pollenG);
  sph(pollenG, "#e8a91c", 0.16, [0, 0, 0], [1, 1, 1], 0.7);
  sph(pollenG, "#f2c14e", 0.1, [0.12, -0.06, 0.06]);
  sph(pollenG, "#d18f0e", 0.09, [-0.11, -0.05, -0.06]);

  return { root: bee, refs: { beeBodyG, beeHeadG, beeJawG, beeWingL, beeWingR, beeLegF, beeEyeL: eyeL, beeEyeR: eyeR, pollenG } };
}

// ---------------------------------------------------------------- pelican
function buildPelican(): {
  root: THREE.Group;
  refs: Pick<LebahRefs, "pelBodyG" | "pelHeadG" | "pelBeakLowG" | "pelWingL" | "pelWingR" | "pelLegL" | "pelLegR" | "pelEyeL" | "pelEyeR">;
} {
  const pelican = new THREE.Group();
  const pelBodyG = new THREE.Group();
  pelBodyG.position.set(0, 1.15, 0);
  pelican.add(pelBodyG);

  // body: big white ellipsoid + soft belly
  sph(pelBodyG, WHITE, 0.85, [0, 0, 0], [1.5, 0.95, 0.9]);
  sph(pelBodyG, "#f2ede2", 0.7, [0.15, -0.3, 0], [1.35, 0.75, 0.8]);
  // tail
  sph(pelBodyG, WHITE, 0.4, [-1.2, 0.18, 0], [1.1, 0.5, 0.8]);

  // neck + head (head pushed forward so it reads clear of the body in profile)
  cyl(pelBodyG, WHITE, 0.26, 0.34, 0.9, [1.08, 0.45, 0], [0, 0, -0.7]);
  const pelHeadG = new THREE.Group();
  pelHeadG.position.set(1.45, 0.68, 0);
  pelBodyG.add(pelHeadG);
  sph(pelHeadG, WHITE, 0.42, [0, 0, 0]);
  sph(pelHeadG, WHITE, 0.3, [-0.28, -0.08, 0], [1.1, 0.9, 0.95]);
  const { eyeL, eyeR } = makeEyes(pelHeadG, 0.28, 0.14, 0.24, 0.06);
  // upper beak: long flattened orange cone pointing +x
  cone(pelHeadG, ORANGE, 0.17, 1.05, [0.85, -0.06, 0], [0, 0, -Math.PI / 2]);
  const upper = pelHeadG.children[pelHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.42);
  sph(pelHeadG, "#d96f0e", 0.05, [1.36, -0.06, 0], [1, 0.8, 0.8], 0.5);
  // lower beak + pouch (pivot at beak base, rotates down to speak / open wide)
  const pelBeakLowG = new THREE.Group();
  pelBeakLowG.position.set(0.32, -0.2, 0);
  pelHeadG.add(pelBeakLowG);
  cone(pelBeakLowG, "#e07f1a", 0.13, 0.95, [0.55, -0.02, 0], [0, 0, -Math.PI / 2]);
  const low = pelBeakLowG.children[pelBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.4);
  sph(pelBeakLowG, "#f2a35e", 0.3, [0.55, -0.16, 0], [1.6, 0.55, 0.7], 0.7);

  // wings: big flattened ellipsoids, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, 0.3, z);
    pelBodyG.add(g);
    sph(g, WHITE, 0.72, [-0.15, 0, z > 0 ? 0.28 : -0.28], [1.6, 0.3, 0.55]);
    sph(g, "#efe9dc", 0.5, [-0.55, -0.05, z > 0 ? 0.3 : -0.3], [1.4, 0.28, 0.5]);
    return g;
  };
  const pelWingL = mkWing(0.72);
  const pelWingR = mkWing(-0.72);

  // legs (orange, tucked in flight, visible when perched)
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.35, -0.72, z);
    pelBodyG.add(g);
    cyl(g, ORANGE, 0.07, 0.06, 0.5, [0, -0.25, 0]);
    sph(g, ORANGE, 0.09, [0.08, -0.5, 0], [1.4, 0.6, 1]);
    return g;
  };
  const pelLegL = mkLeg(0.32);
  const pelLegR = mkLeg(-0.32);

  return { root: pelican, refs: { pelBodyG, pelHeadG, pelBeakLowG, pelWingL, pelWingR, pelLegL, pelLegR, pelEyeL: eyeL, pelEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): LebahRefs {
  const g = scene as unknown as THREE.Group;

  // meadow far below (ground plane at y = -1.6)
  const meadowG = new THREE.Group();
  meadowG.position.y = -1.6;
  g.add(meadowG);
  groundDisc(meadowG, "#69b84a");
  const hills: [number, number, number, string][] = [
    [-24, -21, 22, "#5da843"], [7, -25, 27, "#63ae47"], [30, -20, 19, "#76c253"], [-40, -18, 17, "#5da843"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(meadowG, c, rad, [x, -rad * 0.82, z], [1, 0.55, 1], 1);
    h.castShadow = false;
  });
  makeGrassTufts(meadowG, 60, 11, -15, 17, -3, 9);
  const flowers = makeFlowers(meadowG, 46, 12, -14, 16, -2.5, 7.5);
  makeBush(meadowG, -6, -3.4, 1); makeBush(meadowG, 10.5, -3.2, 1);

  // nest tree on the right (trunk rises from the meadow)
  const treeG = makeTree(meadowG, 4.6, -4.5, 1.3);
  treeG.position.y = 0;
  // nest: brown flattened bowl on a branch, at world ~(3.4, 2.2, -0.8)
  const nestG = new THREE.Group();
  nestG.position.set(3.4, 2.2, -0.8);
  g.add(nestG);
  sph(nestG, "#8a5a36", 0.7, [0, 0, 0], [1.4, 0.42, 1.2]);
  sph(nestG, "#6f4526", 0.5, [0, 0.1, 0], [1.3, 0.35, 1.1]);
  sph(nestG, "#a9743f", 0.35, [0.3, 0.16, 0.15], [1.2, 0.4, 1]);
  sph(nestG, "#a9743f", 0.3, [-0.35, 0.14, -0.15], [1.2, 0.4, 1]);

  const clouds = makeClouds(g, [
    [-10, 6.7, -14, 1.4], [4.5, 7.5, -17, 1.7], [13, 6.3, -12.5, 1.1], [-19, 7.2, -16, 1.5],
  ]);
  makeSun(g, -13.5, 7.9, -22);

  // wind streaks (only visible during the failed flight, line 3) — short
  // dashes clustered around the action, never full-width bars
  const windG = new THREE.Group();
  g.add(windG);
  const wr = rng(21);
  for (let i = 0; i < 6; i++) {
    const y = -0.5 + wr() * 4.5;
    const c = cyl(windG, "#ffffff", 0.022, 0.022, 1.1, [0, y, -0.5 + wr() * 1.2], [0, 0, Math.PI / 2]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35 });
    (c as THREE.Mesh).castShadow = false;
  }
  windG.visible = false;

  // scattered pollen bits (fly left in the wind, line 3)
  const pollenBits = new THREE.Group();
  g.add(pollenBits);
  for (let i = 0; i < 7; i++) {
    sph(pollenBits, "#f2c14e", 0.07, [0, 0, 0], [1, 1, 1], 0.7);
  }
  pollenBits.visible = false;

  const sparkles = makeSparkles(g, [
    [2.6, 3.1, 0.4], [3.6, 2.9, 0.2], [3.1, 3.4, -0.2], [2.3, 2.6, 0.6], [4.0, 3.3, 0.4],
  ], 1.2);

  const bee = buildBee();
  g.add(bee.root);
  const pel = buildPelican();
  g.add(pel.root);

  return {
    bee: bee.root, ...bee.refs,
    pelican: pel.root, ...pel.refs,
    clouds, flowers, windG, sparkles, nestG, pollenBits,
  };
}
