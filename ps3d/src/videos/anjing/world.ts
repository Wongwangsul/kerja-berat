import * as THREE from "three";
import {
  smat, sph, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeSparkles, makeEyes,
  makeFlowers, makeGrassTufts,
} from "../../shared/kit";

export interface AnjingRefs {
  dog: THREE.Group; dogBodyG: THREE.Group; dogHeadG: THREE.Group;
  dogJawG: THREE.Group; dogEarL: THREE.Group; dogEarR: THREE.Group;
  dogLegFL: THREE.Group; dogLegFR: THREE.Group;
  dogLegBL: THREE.Group; dogLegBR: THREE.Group;
  dogTailG: THREE.Group; dogEyeL: THREE.Mesh; dogEyeR: THREE.Mesh;
  panda: THREE.Group; pandaBodyG: THREE.Group; pandaHeadG: THREE.Group;
  pandaJawG: THREE.Group; pandaEarL: THREE.Group; pandaEarR: THREE.Group;
  pandaLegFL: THREE.Group; pandaLegFR: THREE.Group;
  pandaLegBL: THREE.Group; pandaLegBR: THREE.Group;
  pandaEyeL: THREE.Mesh; pandaEyeR: THREE.Mesh;
  bundleG: THREE.Group; moundG: THREE.Group;
  bamboo: THREE.Group[]; crops: THREE.Group[];
  clouds: THREE.Group[]; flowers: THREE.Group[]; sparkles: THREE.Group;
}

const BROWN = "#b5722e";
const BROWN_DARK = "#8a4f1d";
const CREAM = "#e8c89a";
const TAN = "#d9a05e";
const PANDA_WHITE = "#f7f5ef";
const PANDA_BLACK = "#232120";

// ---------------------------------------------------------------- dog
function buildDog(): {
  root: THREE.Group;
  refs: Pick<AnjingRefs, "dogBodyG" | "dogHeadG" | "dogJawG" | "dogEarL" | "dogEarR"
    | "dogLegFL" | "dogLegFR" | "dogLegBL" | "dogLegBR" | "dogTailG"
    | "dogEyeL" | "dogEyeR">;
} {
  const dog = new THREE.Group();
  const dogBodyG = new THREE.Group();
  dogBodyG.position.set(0, 0.48, 0);
  dog.add(dogBodyG);

  // body: warm brown ellipsoid + cream belly + darker back patch
  sph(dogBodyG, BROWN, 0.45, [0, 0, 0], [1.4, 0.9, 0.85]);
  sph(dogBodyG, CREAM, 0.32, [0.12, -0.14, 0], [1.25, 0.7, 0.8]);
  sph(dogBodyG, BROWN_DARK, 0.2, [-0.15, 0.28, 0], [1.2, 0.55, 0.9]);

  // head
  const dogHeadG = new THREE.Group();
  dogHeadG.position.set(0.55, 0.22, 0);
  dogBodyG.add(dogHeadG);
  sph(dogHeadG, BROWN, 0.32, [0, 0, 0]);
  // muzzle: lighter elongated snout along +x
  sph(dogHeadG, TAN, 0.17, [0.28, -0.06, 0], [1.35, 0.8, 0.9]);
  sph(dogHeadG, "#2b2018", 0.06, [0.46, -0.02, 0], [1, 0.85, 0.85], 0.4);
  const { eyeL, eyeR } = makeEyes(dogHeadG, 0.16, 0.1, 0.18, 0.055);
  // lower jaw (speaking)
  const dogJawG = new THREE.Group();
  dogJawG.position.set(0.24, -0.2, 0);
  dogHeadG.add(dogJawG);
  sph(dogJawG, BROWN_DARK, 0.1, [0.05, -0.03, 0], [1.35, 0.5, 0.9]);

  // floppy ears: flattened drooping spheres, pivot at the top so they
  // can perk / swing with follow-through
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.04, 0.24, z);
    dogHeadG.add(g);
    sph(g, BROWN_DARK, 0.16, [0, -0.12, z > 0 ? 0.03 : -0.03], [0.85, 1.45, 0.45]);
    sph(g, "#6b3d16", 0.1, [0, -0.2, z > 0 ? 0.05 : -0.05], [0.8, 1.2, 0.4]);
    g.rotation.x = z > 0 ? -0.15 : 0.15;
    return g;
  };
  const dogEarL = mkEar(0.24);
  const dogEarR = mkEar(-0.24);

  // legs: short columns + round cream paws, pivot at the hip
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.2, z);
    dogBodyG.add(g);
    cyl(g, BROWN, 0.07, 0.06, 0.26, [0, -0.13, 0]);
    sph(g, CREAM, 0.085, [0.02, -0.26, 0], [1.3, 0.6, 1.1]);
    return g;
  };
  const dogLegFL = mkLeg(0.32, 0.19);
  const dogLegFR = mkLeg(0.32, -0.19);
  const dogLegBL = mkLeg(-0.34, 0.19);
  const dogLegBR = mkLeg(-0.34, -0.19);

  // tail: raised, curved, pivot at the rear so it can wag
  const dogTailG = new THREE.Group();
  dogTailG.position.set(-0.58, 0.18, 0);
  dogBodyG.add(dogTailG);
  cyl(dogTailG, BROWN, 0.055, 0.045, 0.45, [-0.12, 0.24, 0], [0, 0, 0.65]);
  sph(dogTailG, CREAM, 0.07, [-0.26, 0.44, 0]);

  return {
    root: dog,
    refs: {
      dogBodyG, dogHeadG, dogJawG, dogEarL, dogEarR,
      dogLegFL, dogLegFR, dogLegBL, dogLegBR, dogTailG,
      dogEyeL: eyeL, dogEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- panda
function buildPanda(): {
  root: THREE.Group;
  refs: Pick<AnjingRefs, "pandaBodyG" | "pandaHeadG" | "pandaJawG" | "pandaEarL" | "pandaEarR"
    | "pandaLegFL" | "pandaLegFR" | "pandaLegBL" | "pandaLegBR"
    | "pandaEyeL" | "pandaEyeR">;
} {
  const panda = new THREE.Group();
  const pandaBodyG = new THREE.Group();
  pandaBodyG.position.set(0, 0.85, 0);
  panda.add(pandaBodyG);

  // body: white ellipsoid + soft grey belly
  sph(pandaBodyG, PANDA_WHITE, 0.5, [0, 0, 0], [1.25, 1.0, 0.95]);
  sph(pandaBodyG, "#e3ded2", 0.36, [0.08, -0.2, 0], [1.2, 0.7, 0.85]);
  // little white tail puff
  sph(pandaBodyG, PANDA_WHITE, 0.12, [-0.6, 0.08, 0]);

  // head
  const pandaHeadG = new THREE.Group();
  pandaHeadG.position.set(0.5, 0.35, 0);
  pandaBodyG.add(pandaHeadG);
  sph(pandaHeadG, PANDA_WHITE, 0.36, [0, 0, 0]);
  // signature black eye patches (flattened, tilted)
  sph(pandaHeadG, PANDA_BLACK, 0.13, [0.24, 0.07, 0.17], [1.15, 1.35, 0.45]);
  sph(pandaHeadG, PANDA_BLACK, 0.13, [0.24, 0.07, -0.17], [1.15, 1.35, 0.45]);
  sph(pandaHeadG, PANDA_WHITE, 0.16, [0.3, -0.1, 0], [1.2, 0.75, 0.9]);
  sph(pandaHeadG, PANDA_BLACK, 0.06, [0.42, -0.06, 0], [1, 0.8, 0.8], 0.4);
  const { eyeL, eyeR } = makeEyes(pandaHeadG, 0.3, 0.08, 0.17, 0.055);
  // lower jaw (speaking)
  const pandaJawG = new THREE.Group();
  pandaJawG.position.set(0.26, -0.24, 0);
  pandaHeadG.add(pandaJawG);
  sph(pandaJawG, "#3a3633", 0.11, [0.05, -0.03, 0], [1.35, 0.5, 0.9]);

  // round black ears, pivot at the base
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.06, 0.3, z);
    pandaHeadG.add(g);
    sph(g, PANDA_BLACK, 0.13, [0, 0.05, z > 0 ? 0.04 : -0.04]);
    return g;
  };
  const pandaEarL = mkEar(0.24);
  const pandaEarR = mkEar(-0.24);

  // limbs: black columns + dark paws, pivot at the hip/shoulder
  // (front limbs double as arms for the calm-signal and pointing)
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.32, z);
    pandaBodyG.add(g);
    cyl(g, PANDA_BLACK, 0.085, 0.075, 0.5, [0, -0.25, 0]);
    sph(g, PANDA_BLACK, 0.1, [0.02, -0.5, 0], [1.3, 0.6, 1.15]);
    return g;
  };
  const pandaLegFL = mkLeg(0.35, 0.3);
  const pandaLegFR = mkLeg(0.35, -0.3);
  const pandaLegBL = mkLeg(-0.36, 0.3);
  const pandaLegBR = mkLeg(-0.36, -0.3);

  return {
    root: panda,
    refs: {
      pandaBodyG, pandaHeadG, pandaJawG, pandaEarL, pandaEarR,
      pandaLegFL, pandaLegFR, pandaLegBL, pandaLegBR,
      pandaEyeL: eyeL, pandaEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): AnjingRefs {
  const g = scene as unknown as THREE.Group;

  // field: warm green ground + soft hills on the horizon (sunset)
  groundDisc(g, "#5da843");
  const hills: [number, number, number, string][] = [
    [-22, -24, 20, "#4f8f3a"], [8, -26, 24, "#558f3d"], [30, -22, 18, "#6aa84e"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.84, z], [1, 0.5, 1], 1);
    h.castShadow = false;
  });

  // dirt path down the middle (flattened ellipse, tan)
  const path = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40), smat("#d9b078", 1));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0.4, 0.03, 0.3);
  path.scale.set(2.0, 0.65, 1);
  path.receiveShadow = true;
  g.add(path);

  // footprints: small dark prints along the path toward the bamboo
  const prints: [number, number][] = [
    [-0.6, 0.15], [-0.2, 0.45], [0.2, 0.15], [0.6, 0.45], [1.0, 0.15],
    [1.4, 0.45], [1.8, 0.15], [2.2, 0.45], [2.6, 0.15], [3.0, 0.45],
    [3.3, 0.2],
  ];
  prints.forEach(([x, z]) => {
    sph(g, "#8a6a42", 0.11, [x, 0.05, z], [1.3, 0.25, 1], 1).castShadow = false;
  });

  // low crop rows on the left (sway in story.ts)
  const crops: THREE.Group[] = [];
  const cr = rng(11);
  const cropSpots: [number, number][] = [
    [-4.6, -1.2], [-5.2, 0.4], [-4.4, 1.4], [-5.6, -0.4], [-6.0, 1.2],
    [-3.9, -2.0], [-5.0, 2.0], [-6.4, -1.6],
  ];
  cropSpots.forEach(([x, z]) => {
    const cg = new THREE.Group();
    cg.position.set(x, 0, z);
    g.add(cg);
    for (let i = 0; i < 3; i++) {
      const h = 0.7 + cr() * 0.5;
      cone(cg, i % 2 ? "#3f9e4d" : "#57a83e", 0.16, h, [(i - 1) * 0.22, h / 2, (cr() - 0.5) * 0.25]);
    }
    sph(cg, "#e86a8a", 0.09, [0.1, 0.95, 0.1], [1, 0.8, 1], 0.6);
    cg.userData.phase = cr() * Math.PI * 2;
    crops.push(cg);
  });

  // bamboo cluster on the right (sway in story.ts)
  const bamboo: THREE.Group[] = [];
  const br = rng(21);
  const bambooSpots: [number, number, number][] = [
    [4.3, -1.6, 4.4], [4.9, -1.0, 3.8], [4.6, -2.2, 4.8],
    [5.3, -1.7, 3.4], [4.1, -2.4, 4.0],
  ];
  bambooSpots.forEach(([x, z, h]) => {
    const bg = new THREE.Group();
    bg.position.set(x, 0, z);
    g.add(bg);
    const segs = Math.max(3, Math.round(h / 0.9));
    for (let i = 0; i < segs; i++) {
      cyl(bg, "#3f9e4d", 0.09, 0.1, 0.9, [0, 0.45 + i * 0.9, 0]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20), smat("#2e7d32"));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.9 + i * 0.9, 0);
      bg.add(ring);
    }
    // leaf tuft at the top
    cone(bg, "#57a83e", 0.35, 0.9, [0.25, h + 0.3, 0.1], [0, 0, -0.7]);
    cone(bg, "#3f9e4d", 0.3, 0.8, [-0.2, h + 0.25, -0.1], [0, 0, 0.8]);
    cone(bg, "#6cbf5a", 0.28, 0.7, [0, h + 0.35, 0.25], [0.7, 0, 0]);
    bg.userData.phase = br() * Math.PI * 2;
    bamboo.push(bg);
  });

  // grass tufts in two bands OFF the dirt path (path z ≈ -1.9..2.5)
  makeGrassTufts(g, 40, 31, -7, 7.5, -3, -1.0);
  makeGrassTufts(g, 30, 33, -7, 7.5, 1.6, 4);
  // near-foreground tufts + flowers (z 2.2..4.5) break up the flat green
  // foreground band in the vertical frame
  makeGrassTufts(g, 25, 41, -6, 7, 2.2, 4.5);
  const fgFlowers = makeFlowers(g, 10, 43, -5, 6, 2.6, 4.5);
  const flowers = makeFlowers(g, 36, 32, -6.5, 7, -2.5, 3.5,
    (x, z) => Math.abs(z - 0.3) < 0.9 && x > -4 && x < 4.2);

  const clouds = makeClouds(g, [
    [-6, 7.5, -16, 1.5], [4, 8.5, -18, 1.8], [7, 6.8, -14, 1.1], [-12, 8.0, -18, 1.4],
  ]);
  makeSun(g, -6.5, 7.0, -20, 2.4, "#ffcf5e");

  // the swapped lunch bundle: red cloth wrap + knot, buried under a mound
  // until the dog digs it out (story.ts drives moundG / bundleG scale)
  const bundleG = new THREE.Group();
  bundleG.position.set(3.6, 0.22, 0.35);
  g.add(bundleG);
  sph(bundleG, "#d92b2b", 0.3, [0, 0, 0], [1.25, 0.75, 0.95]);
  sph(bundleG, "#a81f1f", 0.3, [0, 0.02, 0], [0.9, 0.5, 1.0]);
  sph(bundleG, "#f2c14e", 0.08, [0, 0.24, 0]);
  cone(bundleG, "#f2c14e", 0.05, 0.22, [-0.08, 0.32, 0.05], [0, 0, 0.6]);
  cone(bundleG, "#f2c14e", 0.05, 0.22, [0.08, 0.32, -0.05], [0, 0, -0.6]);
  bundleG.scale.setScalar(0.001);
  const moundG = new THREE.Group();
  moundG.position.set(3.6, 0, 0.35);
  g.add(moundG);
  sph(moundG, "#8a6a42", 0.34, [0, 0.05, 0], [1.2, 0.55, 1], 1);

  // sparkles: bundle reveal + warm close, around the bundle and the pair
  const sparkles = makeSparkles(g, [
    [3.6, 1.0, 0.5], [4.0, 0.8, 0.1], [3.2, 1.2, 0.6], [2.8, 2.0, 0.4],
    [2.2, 1.6, 0.5], [4.2, 1.4, 0.4],
  ], 1.2);

  const dog = buildDog();
  dog.root.scale.setScalar(1.35);
  g.add(dog.root);
  const panda = buildPanda();
  panda.root.scale.setScalar(1.3);
  g.add(panda.root);

  return {
    dog: dog.root, ...dog.refs,
    panda: panda.root, ...panda.refs,
    bundleG, moundG,
    bamboo, crops,
    clouds, flowers: [...flowers, ...fgFlowers], sparkles,
  };
}
