import * as THREE from "three";
import {
  smat, smatT, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeSparkles, makeEyes,
  makeGrassTufts, makeBush,
} from "../../shared/kit";

export interface PelikanRefs {
  pelican: THREE.Group; pelicanBodyG: THREE.Group; pelicanNeckG: THREE.Group;
  pelicanHeadG: THREE.Group; pelicanPouchG: THREE.Group;
  pelicanWingL: THREE.Group; pelicanWingR: THREE.Group;
  pelicanFootL: THREE.Group; pelicanFootR: THREE.Group;
  pelicanTailG: THREE.Group; pelicanEyeL: THREE.Mesh; pelicanEyeR: THREE.Mesh;
  catchFish: THREE.Group;
  crow: THREE.Group; crowBodyG: THREE.Group; crowHeadG: THREE.Group;
  crowBeakLowG: THREE.Group; crowWingL: THREE.Group; crowWingR: THREE.Group;
  crowTailG: THREE.Group; crowFootL: THREE.Group; crowFootR: THREE.Group;
  crowEyeL: THREE.Mesh; crowEyeR: THREE.Mesh;
  branchG: THREE.Group;
  fish: THREE.Group[]; fishTailGs: THREE.Group[];
  splashG: THREE.Group; splashDrops: THREE.Mesh[]; splashRing: THREE.Mesh;
  water: THREE.Mesh;
  clouds: THREE.Group[]; sparkles: THREE.Group;
}

const WHITE = "#ffffff";
const WHITE_SOFT = "#f6f1e6";
const BEAK_YELLOW = "#f2b234";
const POUCH = "#f08a3c";
const POUCH_DARK = "#e07f2e";
const ORANGE = "#f08a1d";
const CROW_BLACK = "#1c1e24";
const CROW_SHEEN = "#2e3440";
const FISH_SILVER = "#bfe3f2";
const FISH_BLUE = "#7fc4de";

// ---------------------------------------------------------------- pelican
function buildPelican(): {
  root: THREE.Group;
  refs: Pick<PelikanRefs, "pelicanBodyG" | "pelicanNeckG" | "pelicanHeadG"
    | "pelicanPouchG" | "pelicanWingL" | "pelicanWingR"
    | "pelicanFootL" | "pelicanFootR" | "pelicanTailG"
    | "pelicanEyeL" | "pelicanEyeR" | "catchFish">;
} {
  const pelican = new THREE.Group();
  const pelicanBodyG = new THREE.Group();
  pelicanBodyG.position.set(0, 1.02, 0);
  pelican.add(pelicanBodyG);

  // body: big round white ellipsoid + cream belly
  sph(pelicanBodyG, WHITE, 0.85, [0, 0, 0], [1, 1.05, 0.82]);
  sph(pelicanBodyG, WHITE_SOFT, 0.6, [0.18, -0.28, 0], [1, 0.9, 0.72]);

  // neck: long column rising from the front of the body, overlapping
  // both body and head so no pinch shows between the balls
  const pelicanNeckG = new THREE.Group();
  pelicanNeckG.position.set(0.62, 0.7, 0);
  pelicanBodyG.add(pelicanNeckG);
  sph(pelicanNeckG, WHITE, 0.38, [0.1, 0.45, 0], [0.9, 1.7, 0.9]);
  sph(pelicanNeckG, WHITE_SOFT, 0.28, [0.16, 0.15, 0], [0.75, 1.2, 0.75]);

  // head: white ball + small crest tuft at the back
  const pelicanHeadG = new THREE.Group();
  pelicanHeadG.position.set(0.18, 0.9, 0);
  pelicanNeckG.add(pelicanHeadG);
  sph(pelicanHeadG, WHITE, 0.44, [0, 0, 0]);
  sph(pelicanHeadG, WHITE_SOFT, 0.14, [-0.34, 0.26, 0], [1.5, 0.65, 0.7]);
  const { eyeL, eyeR } = makeEyes(pelicanHeadG, 0.18, 0.1, 0.22, 0.06);
  // upper beak: long flat yellow bill along +x
  cone(pelicanHeadG, BEAK_YELLOW, 0.14, 1.35, [0.88, 0, 0], [0, 0, -Math.PI / 2]);
  const upper = pelicanHeadG.children[pelicanHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.5);
  // pouch + lower mandible (pivot at the beak base, rotates down to speak/dive):
  // slim and hanging BELOW the upper bill, never covering it
  const pelicanPouchG = new THREE.Group();
  pelicanPouchG.position.set(0.35, -0.16, 0);
  pelicanHeadG.add(pelicanPouchG);
  sph(pelicanPouchG, POUCH, 0.36, [0.58, -0.14, 0], [1.9, 0.34, 0.45], 0.7);
  cone(pelicanPouchG, POUCH_DARK, 0.05, 1.1, [0.58, -0.28, 0], [0, 0, -Math.PI / 2]);
  const low = pelicanPouchG.children[pelicanPouchG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.4);

  // fish caught in the pouch (closing): three small silver fish sticking
  // out of the pouch, hidden until line 5
  const catchFish = new THREE.Group();
  catchFish.position.set(0.85, -0.34, 0);
  catchFish.visible = false;
  pelicanHeadG.add(catchFish);
  [[0, 0, 0, 0.3], [0.14, -0.08, 0.1, -0.4], [-0.12, -0.06, -0.1, 0.5]].forEach(([x, y, z, ry]) => {
    const fg = new THREE.Group();
    fg.position.set(x, y, z);
    fg.rotation.y = ry;
    catchFish.add(fg);
    sph(fg, "#e8f6ff", 0.14, [0, 0, 0], [1.7, 0.65, 0.45], 0.35);
    cone(fg, FISH_BLUE, 0.08, 0.16, [-0.2, 0, 0], [0, 0, Math.PI / 2]);
  });

  // wings: flat white ellipsoids tucked at the sides, pivot at the shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.22, z);
    pelicanBodyG.add(g);
    sph(g, WHITE, 0.42, [-0.08, -0.28, z > 0 ? 0.05 : -0.05], [1.0, 1.25, 0.2]);
    sph(g, WHITE_SOFT, 0.24, [-0.26, -0.55, z > 0 ? 0.04 : -0.04], [1.2, 1.1, 0.18]);
    return g;
  };
  const pelicanWingL = mkWing(0.58);
  const pelicanWingR = mkWing(-0.58);

  // legs: thin orange columns + webbed feet, pivot at the ankle
  const mkFoot = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, -0.78, z);
    pelicanBodyG.add(g);
    cyl(g, ORANGE, 0.05, 0.06, 0.3, [0, -0.08, 0]);
    sph(g, ORANGE, 0.16, [0.1, -0.24, 0], [1.6, 0.3, 1.1]);
    return g;
  };
  const pelicanFootL = mkFoot(0.28);
  const pelicanFootR = mkFoot(-0.28);

  // tail: short white wedge at the back
  const pelicanTailG = new THREE.Group();
  pelicanTailG.position.set(-0.8, 0.12, 0);
  pelicanBodyG.add(pelicanTailG);
  cone(pelicanTailG, WHITE, 0.18, 0.5, [-0.2, 0, 0], [0, 0, Math.PI / 2 + 0.4]);

  return {
    root: pelican,
    refs: {
      pelicanBodyG, pelicanNeckG, pelicanHeadG, pelicanPouchG,
      pelicanWingL, pelicanWingR, pelicanFootL, pelicanFootR,
      pelicanTailG, pelicanEyeL: eyeL, pelicanEyeR: eyeR, catchFish,
    },
  };
}

// ---------------------------------------------------------------- crow
function buildCrow(): {
  root: THREE.Group;
  refs: Pick<PelikanRefs, "crowBodyG" | "crowHeadG" | "crowBeakLowG"
    | "crowWingL" | "crowWingR" | "crowTailG" | "crowFootL" | "crowFootR"
    | "crowEyeL" | "crowEyeR">;
} {
  const crow = new THREE.Group();
  const crowBodyG = new THREE.Group();
  crowBodyG.position.set(0, 0.55, 0);
  crow.add(crowBodyG);

  // body: black ellipsoid + blue-black sheen on the chest
  sph(crowBodyG, CROW_BLACK, 0.5, [0, 0, 0], [1, 1.1, 0.85]);
  sph(crowBodyG, CROW_SHEEN, 0.35, [0.2, -0.05, 0], [0.9, 1, 0.8]);

  // head: big black ball, clearly separated from the body; long pointed beak
  const crowHeadG = new THREE.Group();
  crowHeadG.position.set(0.26, 0.6, 0);
  crowBodyG.add(crowHeadG);
  sph(crowHeadG, CROW_BLACK, 0.38, [0, 0, 0]);
  sph(crowHeadG, CROW_SHEEN, 0.22, [-0.12, 0.16, 0], [1, 0.8, 0.9]);
  const { eyeL, eyeR } = makeEyes(crowHeadG, 0.16, 0.09, 0.18, 0.055);
  cone(crowHeadG, "#14161a", 0.08, 0.45, [0.42, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = crowHeadG.children[crowHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.55);
  // lower beak (pivot at the beak base, rotates down to speak/caw)
  const crowBeakLowG = new THREE.Group();
  crowBeakLowG.position.set(0.16, -0.08, 0);
  crowHeadG.add(crowBeakLowG);
  cone(crowBeakLowG, "#14161a", 0.05, 0.26, [0.12, 0, 0], [0, 0, -Math.PI / 2]);
  const low = crowBeakLowG.children[crowBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // wings: flat black ellipsoids, pivot at the shoulder (flap while flying)
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.15, z);
    crowBodyG.add(g);
    sph(g, CROW_BLACK, 0.38, [-0.02, -0.2, z > 0 ? 0.06 : -0.06], [1.15, 1.4, 0.2]);
    return g;
  };
  const crowWingL = mkWing(0.42);
  const crowWingR = mkWing(-0.42);

  // tail: long flat black wedge, slightly fanned
  const crowTailG = new THREE.Group();
  crowTailG.position.set(-0.45, -0.05, 0);
  crowBodyG.add(crowTailG);
  cone(crowTailG, CROW_BLACK, 0.16, 0.7, [-0.3, -0.05, 0], [0, 0, Math.PI / 2 + 0.35]);
  const tail = crowTailG.children[crowTailG.children.length - 1] as THREE.Mesh;
  tail.scale.set(1, 1, 0.45);

  // legs: thin dark columns + small feet
  const mkFoot = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, -0.48, z);
    crowBodyG.add(g);
    cyl(g, "#23252b", 0.035, 0.04, 0.24, [0, -0.08, 0]);
    sph(g, "#23252b", 0.09, [0.06, -0.2, 0], [1.5, 0.3, 1]);
    return g;
  };
  const crowFootL = mkFoot(0.15);
  const crowFootR = mkFoot(-0.15);

  return {
    root: crow,
    refs: {
      crowBodyG, crowHeadG, crowBeakLowG,
      crowWingL, crowWingR, crowTailG, crowFootL, crowFootR,
      crowEyeL: eyeL, crowEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): PelikanRefs {
  const g = scene as unknown as THREE.Group;

  // lake: deep blue bed (y=-0.35) + clear shimmering surface (y=0)
  const waterG = new THREE.Group();
  waterG.position.y = -0.35;
  g.add(waterG);
  groundDisc(waterG, "#2f8fc9");
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    smatT("#35a3c2", 0.45, 0.3),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.02;
  water.receiveShadow = true;
  g.add(water);

  // sandy shore on the left where the pelican stands (extends right so the
  // crow can land beside him at the close)
  const shoreG = new THREE.Group();
  g.add(shoreG);
  sph(shoreG, "#d9c08a", 3.2, [-3.6, -0.28, 1.0], [1.5, 0.12, 1.1], 1);
  sph(shoreG, "#e8d5a4", 2.2, [-2.8, -0.18, 1.1], [1.3, 0.1, 0.9], 1);
  makeGrassTufts(g, 26, 7, -6.4, -1.6, -1.2, 2.6);
  makeBush(g, -5.8, -1.6, 1.1);
  makeBush(g, -5.2, 2.4, 0.9);
  // reeds at the water's edge, short and tucked to the side
  const reedSpots: [number, number][] = [[-2.8, 2.5], [-2.2, 2.9], [-3.3, 2.3], [3.6, 3.6], [4.2, 3.2]];
  reedSpots.forEach(([x, z], i) => {
    const rg = new THREE.Group();
    rg.position.set(x, 0, z);
    rg.userData.phase = i * 1.3;
    g.add(rg);
    cyl(rg, "#3f9e4d", 0.03, 0.045, 0.75, [0, 0.38, 0]);
    cyl(rg, "#57a83e", 0.025, 0.04, 0.6, [0.12, 0.3, 0.05]);
    sph(rg, "#8a5a36", 0.07, [0, 0.8, 0], [1, 1.6, 1], 0.9);
  });

  // branch on the right: thick limb jutting in from the right edge,
  // the crow's perch (perch point ≈ (3.9, 3.3, -0.5))
  const branchG = new THREE.Group();
  g.add(branchG);
  cyl(branchG, "#6e4526", 0.13, 0.18, 3.6, [4.7, 3.05, -0.7], [0, 0, 1.35]);
  cyl(branchG, "#6e4526", 0.07, 0.1, 1.2, [5.9, 3.5, -0.9], [0, 0, 0.9]);
  sph(branchG, "#3f9e4d", 1.0, [6.3, 3.9, -0.9], [1.2, 0.8, 1]);
  sph(branchG, "#49ac57", 0.75, [5.8, 4.3, -1.1], [1.1, 0.75, 0.9]);
  sph(branchG, "#359046", 0.6, [6.7, 3.4, -0.6], [1.1, 0.8, 1]);

  // school of small fish under the surface, around (0.9, -0.12, 2.0)
  const fish: THREE.Group[] = [];
  const fishTailGs: THREE.Group[] = [];
  const fr = rng(23);
  const SCHOOL: [number, number, number] = [0.9, -0.12, 2.0];
  for (let i = 0; i < 10; i++) {
    const fg = new THREE.Group();
    const ox = (fr() - 0.5) * 1.9;
    const oz = (fr() - 0.5) * 1.1;
    fg.position.set(SCHOOL[0] + ox, SCHOOL[1] + (fr() - 0.5) * 0.08, SCHOOL[2] + oz);
    fg.userData.bx = SCHOOL[0] + ox;
    fg.userData.bz = SCHOOL[2] + oz;
    fg.userData.by = fg.position.y;
    fg.userData.phase = fr() * Math.PI * 2;
    fg.userData.ry = (fr() - 0.5) * 1.2 + (fr() > 0.5 ? 0 : Math.PI);
    g.add(fg);
    sph(fg, "#a8d8ea", 0.18, [0, 0, 0], [1.6, 0.7, 0.5], 0.35);
    sph(fg, FISH_BLUE, 0.11, [0.05, 0.06, 0], [1.5, 0.5, 0.4], 0.35);
    const tailG = new THREE.Group();
    tailG.position.set(-0.26, 0, 0);
    fg.add(tailG);
    cone(tailG, FISH_BLUE, 0.09, 0.18, [-0.06, 0, 0], [0, 0, Math.PI / 2]);
    const t = tailG.children[tailG.children.length - 1] as THREE.Mesh;
    t.scale.set(1, 1, 0.35);
    fish.push(fg);
    fishTailGs.push(tailG);
  }

  // splash at the dive point (-0.6, 0, 1.6): expanding ring + droplets
  const splashG = new THREE.Group();
  splashG.position.set(-0.6, 0, 1.6);
  splashG.visible = false;
  g.add(splashG);
  const splashRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.06, 10, 32),
    smatT("#ffffff", 0.85, 0.4),
  );
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.position.y = 0.06;
  splashRing.castShadow = false;
  splashG.add(splashRing);
  const splashDrops: THREE.Mesh[] = [];
  const dr = rng(31);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const d = sphT(splashG, "#eaf6fb", 0.09 + dr() * 0.05, 0.9,
      [Math.cos(a) * 0.45, 0.25 + dr() * 0.3, Math.sin(a) * 0.45]);
    d.castShadow = false;
    d.userData.a = a;
    d.userData.h = 0.25 + dr() * 0.35;
    splashDrops.push(d);
  }

  // morning sky props (kept high so no cloud sits on the crow's branch)
  const clouds = makeClouds(g, [
    [-11, 8.5, -16, 1.4], [10, 9.5, -20, 1.4], [15, 8.5, -16, 1.0], [-19, 8.5, -18, 1.3],
  ]);
  makeSun(g, -13.5, 7.5, -22, 1.9, "#fff3c4");

  // sparkles: closing moment (line 5), around the two friends at the shore
  const sparkles = makeSparkles(g, [
    [-2.6, 3.4, 0.8], [-1.4, 3.0, 1.0], [-3.2, 2.2, 0.4],
    [-0.8, 2.4, 1.4], [-2.0, 4.0, 0.6], [-3.6, 3.0, 1.2],
  ], 1.6);

  const pelican = buildPelican();
  pelican.root.scale.setScalar(1.6); // tokoh utama harus besar di bingkai
  g.add(pelican.root);
  const crow = buildCrow();
  crow.root.scale.setScalar(1.15); // gagak lebih kecil dari pelikan
  g.add(crow.root);

  return {
    pelican: pelican.root, ...pelican.refs,
    crow: crow.root, ...crow.refs,
    branchG,
    fish, fishTailGs,
    splashG, splashDrops, splashRing,
    water,
    clouds, sparkles,
  };
}
