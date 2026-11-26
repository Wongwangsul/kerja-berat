import * as THREE from "three";
import {
  smat, smatT, sph, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeTree, makeBush,
  makeSparkles, makeEyes,
} from "../../shared/kit";

export interface FlamingoRefs {
  flamingo: THREE.Group; flamBodyG: THREE.Group; flamNeckG: THREE.Group;
  flamHeadG: THREE.Group; flamBeakLowG: THREE.Group; flamBeakTip: THREE.Group;
  flamWingL: THREE.Group; flamWingR: THREE.Group;
  flamLegL: THREE.Group; flamLegR: THREE.Group;
  flamEyeL: THREE.Mesh; flamEyeR: THREE.Mesh;
  sparrow: THREE.Group; sparBodyG: THREE.Group; sparHeadG: THREE.Group;
  sparBeakLowG: THREE.Group; sparWingL: THREE.Group; sparWingR: THREE.Group;
  sparLegL: THREE.Group; sparLegR: THREE.Group;
  sparEyeL: THREE.Mesh; sparEyeR: THREE.Mesh;
  foodG: THREE.Group; foodCaught: THREE.Mesh;
  clouds: THREE.Group[]; reeds: THREE.Group[]; bushes: THREE.Group[];
  rippleFlam: THREE.Mesh; rippleFood: THREE.Mesh; rippleRight: THREE.Mesh;
  splash: THREE.Group; splashDrops: THREE.Mesh[];
  sparkles: THREE.Group; water: THREE.Mesh;
}

const PINK = "#f27ba7";
const PINK_LIGHT = "#f9b8cc";
const PINK_DARK = "#e85a8a";
const PINK_DEEP = "#d14f7c";
const BEAK_PINK = "#f2a0b5";
const BLACK = "#2b2b2b";
const BROWN = "#8a5a36";
const BROWN_DARK = "#6b4423";
const CREAM = "#e8d9b0";
const YELLOW_BEAK = "#f2b705";

// ---------------------------------------------------------------- flamingo
function buildFlamingo(): {
  root: THREE.Group;
  refs: Pick<FlamingoRefs, "flamBodyG" | "flamNeckG" | "flamHeadG" | "flamBeakLowG"
    | "flamBeakTip" | "flamWingL" | "flamWingR" | "flamLegL" | "flamLegR"
    | "flamEyeL" | "flamEyeR">;
} {
  const flamingo = new THREE.Group();
  const flamBodyG = new THREE.Group();
  flamBodyG.position.set(0, 2.05, 0);
  flamingo.add(flamBodyG);

  // body: pink ellipsoid + lighter belly + darker tail
  sph(flamBodyG, PINK, 0.55, [0, 0, 0], [1.5, 0.9, 0.8]);
  sph(flamBodyG, PINK_LIGHT, 0.45, [0.1, -0.18, 0], [1.3, 0.7, 0.75]);
  sph(flamBodyG, PINK_DARK, 0.3, [-0.78, 0.15, 0], [1.25, 0.5, 0.7]);

  // neck: long, pivoted at the front-top of the body so it can bow / filter.
  // S-curve hint: a soft bulge at the base + a slightly forward upper bulb.
  const flamNeckG = new THREE.Group();
  flamNeckG.position.set(0.55, 0.3, 0);
  flamBodyG.add(flamNeckG);
  cyl(flamNeckG, PINK, 0.13, 0.18, 1.7, [0, 0.85, 0]);
  sph(flamNeckG, PINK, 0.19, [0.02, 0.15, 0], [1, 1.2, 0.9]);
  sph(flamNeckG, PINK_LIGHT, 0.14, [0.07, 1.15, 0], [1, 1, 0.85]);

  // head at the top of the neck
  const flamHeadG = new THREE.Group();
  flamHeadG.position.set(0.08, 1.75, 0);
  flamNeckG.add(flamHeadG);
  sph(flamHeadG, PINK, 0.3, [0, 0, 0]);
  sph(flamHeadG, PINK_LIGHT, 0.2, [-0.2, -0.05, 0], [1.1, 0.9, 0.95]);
  const { eyeL, eyeR } = makeEyes(flamHeadG, 0.16, 0.1, 0.17, 0.05);
  // upper beak: pink base along +x, then the signature BENT-DOWN black tip
  cone(flamHeadG, BEAK_PINK, 0.09, 0.55, [0.25, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = flamHeadG.children[flamHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.6);
  cone(flamHeadG, BLACK, 0.06, 0.45, [0.55, -0.2, 0], [0, 0, -Math.PI / 2 - 0.85]);
  const tip = flamHeadG.children[flamHeadG.children.length - 1] as THREE.Mesh;
  tip.scale.set(1, 1, 0.55);
  // invisible marker at the beak tip (world pos = where the caught food hangs)
  const flamBeakTip = new THREE.Group();
  flamBeakTip.position.set(0.7, -0.38, 0);
  flamHeadG.add(flamBeakTip);
  // lower beak (pivot at beak base, rotates down to speak)
  const flamBeakLowG = new THREE.Group();
  flamBeakLowG.position.set(0.25, -0.16, 0);
  flamHeadG.add(flamBeakLowG);
  cone(flamBeakLowG, PINK_DEEP, 0.06, 0.5, [0.22, 0, 0], [0, 0, -Math.PI / 2]);
  const low = flamBeakLowG.children[flamBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // wings: folded pink ellipsoids with darker tips, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, 0.22, z);
    flamBodyG.add(g);
    sph(g, PINK, 0.48, [-0.05, 0, z > 0 ? 0.1 : -0.1], [1.55, 0.28, 0.5]);
    sph(g, PINK_DARK, 0.3, [-0.6, -0.02, z > 0 ? 0.12 : -0.12], [1.1, 0.26, 0.45]);
    return g;
  };
  const flamWingL = mkWing(0.42);
  const flamWingR = mkWing(-0.42);

  // legs: long thin pink stilts, pivot at the hip (fold up for one-leg stand)
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.25, -0.3, z);
    flamBodyG.add(g);
    cyl(g, PINK_DEEP, 0.045, 0.04, 1.75, [0, -0.85, 0]);
    sph(g, PINK_DEEP, 0.07, [0.06, -1.72, 0], [1.5, 0.4, 1.2]);
    return g;
  };
  const flamLegL = mkLeg(0.22);
  const flamLegR = mkLeg(-0.22);

  return {
    root: flamingo,
    refs: {
      flamBodyG, flamNeckG, flamHeadG, flamBeakLowG, flamBeakTip,
      flamWingL, flamWingR, flamLegL, flamLegR,
      flamEyeL: eyeL, flamEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- sparrow (pipit)
function buildSparrow(): {
  root: THREE.Group;
  refs: Pick<FlamingoRefs, "sparBodyG" | "sparHeadG" | "sparBeakLowG" | "sparWingL"
    | "sparWingR" | "sparLegL" | "sparLegR" | "sparEyeL" | "sparEyeR">;
} {
  const sparrow = new THREE.Group();
  const sparBodyG = new THREE.Group();
  sparBodyG.position.set(0, 0, 0);
  sparrow.add(sparBodyG);

  // body: small brown ellipsoid + cream belly + darker tail fan
  sph(sparBodyG, BROWN, 0.32, [0, 0, 0], [1.3, 0.85, 0.8]);
  sph(sparBodyG, CREAM, 0.24, [0.05, -0.1, 0], [1.2, 0.7, 0.75]);
  sph(sparBodyG, BROWN_DARK, 0.18, [-0.42, 0.08, 0], [1.4, 0.25, 0.6]);

  // head
  const sparHeadG = new THREE.Group();
  sparHeadG.position.set(0.38, 0.22, 0);
  sparBodyG.add(sparHeadG);
  sph(sparHeadG, BROWN, 0.22, [0, 0, 0]);
  sph(sparHeadG, BROWN_DARK, 0.18, [-0.02, 0.1, 0], [1, 0.6, 1]);
  const { eyeL, eyeR } = makeEyes(sparHeadG, 0.12, 0.08, 0.13, 0.045);
  // short pointed beak
  cone(sparHeadG, YELLOW_BEAK, 0.05, 0.28, [0.28, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = sparHeadG.children[sparHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.5);
  const sparBeakLowG = new THREE.Group();
  sparBeakLowG.position.set(0.1, -0.08, 0);
  sparHeadG.add(sparBeakLowG);
  cone(sparBeakLowG, "#e8a91c", 0.04, 0.22, [0.12, 0, 0], [0, 0, -Math.PI / 2]);
  const low = sparBeakLowG.children[sparBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // wings: small folded brown, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.12, z);
    sparBodyG.add(g);
    sph(g, BROWN_DARK, 0.3, [-0.05, 0, z > 0 ? 0.08 : -0.08], [1.4, 0.22, 0.45]);
    return g;
  };
  const sparWingL = mkWing(0.26);
  const sparWingR = mkWing(-0.26);

  // legs: tiny orange (visible when perched)
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, -0.28, z);
    sparBodyG.add(g);
    cyl(g, "#f08a1d", 0.025, 0.02, 0.18, [0, -0.09, 0]);
    sph(g, "#f08a1d", 0.04, [0.03, -0.18, 0], [1.4, 0.4, 1.2]);
    return g;
  };
  const sparLegL = mkLeg(0.1);
  const sparLegR = mkLeg(-0.1);

  return {
    root: sparrow,
    refs: {
      sparBodyG, sparHeadG, sparBeakLowG, sparWingL, sparWingR,
      sparLegL, sparLegR, sparEyeL: eyeL, sparEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): FlamingoRefs {
  const g = scene as unknown as THREE.Group;

  // sand bottom (y = -0.7) + shallow murky greenish water (y = 0, translucent)
  const sandG = new THREE.Group();
  sandG.position.y = -0.7;
  g.add(sandG);
  groundDisc(sandG, "#cbb27f");
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    smatT("#3f8f7f", 0.55, 0.3),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  g.add(water);
  // murky patches + pebbles on the bottom (visible through the water)
  const sr = rng(41);
  for (let i = 0; i < 9; i++) {
    const x = -5 + sr() * 10, z = -2.5 + sr() * 4.5;
    sph(sandG, i % 2 ? "#c9b078" : "#e8d9a8", 0.12 + sr() * 0.1, [x, 0.05, z], [1, 0.35, 1], 1);
  }
  for (let i = 0; i < 5; i++) {
    const x = -3.5 + sr() * 7, z = -1.5 + sr() * 3;
    sph(sandG, "#4d8a70", 0.3 + sr() * 0.25, [x, 0.03, z], [1, 0.25, 1], 1);
  }

  // distant shore: low muted green hills on the horizon
  const hills: [number, number, number, string][] = [
    [-22, -26, 20, "#7da05c"], [8, -28, 24, "#6b9153"], [30, -24, 18, "#8aa866"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.86, z], [1, 0.5, 1], 1);
    h.castShadow = false;
  });

  // bushes on the LEFT bank (the setting's left edge) + one right for balance
  const bushes: THREE.Group[] = [];
  bushes.push(makeBush(g, -4.8, -1.6, 1.6, ["#2e7d32", "#359046"]));
  bushes.push(makeBush(g, -5.4, 0.6, 1.3, ["#359046", "#3f9e4d"]));
  bushes.push(makeBush(g, 5.2, -2.2, 1.2, ["#2e7d32", "#359046"]));

  // water reeds at the edges (sway in story.ts)
  const reeds: THREE.Group[] = [];
  const reedSpots: [number, number, number][] = [
    [-4.4, -2.2, 1.5], [-3.8, -2.6, 1.2], [4.2, -2.0, 1.4], [4.9, -1.4, 1.1], [-5.6, -1.2, 1.3],
  ];
  const rr = rng(17);
  reedSpots.forEach(([x, z, s]) => {
    const rg = new THREE.Group();
    rg.position.set(x, 0, z);
    rg.scale.setScalar(s);
    g.add(rg);
    for (let i = 0; i < 3; i++) {
      const h = 1.1 + rr() * 0.7;
      cone(rg, i % 2 ? "#3f9e4d" : "#57a83e", 0.07, h, [(i - 1) * 0.22, h / 2, (rr() - 0.5) * 0.3]);
    }
    rg.userData.phase = rr() * Math.PI * 2;
    reeds.push(rg);
  });

  // the sparrow's perch: a branch jutting in from the upper LEFT
  const branchG = new THREE.Group();
  branchG.position.set(-3.9, 3.05, -0.5);
  g.add(branchG);
  cyl(branchG, BROWN_DARK, 0.09, 0.11, 3.2, [0, 0, 0], [0, 0, Math.PI / 2]);
  cyl(branchG, BROWN_DARK, 0.05, 0.06, 0.9, [1.1, 0.35, 0.1], [0, 0, -0.7]);
  sph(branchG, "#3f9e4d", 0.22, [1.5, 0.72, 0.1], [1.2, 0.6, 1]);
  sph(branchG, "#57a83e", 0.18, [1.35, 0.55, -0.15], [1.1, 0.6, 1]);
  sph(branchG, "#3f9e4d", 0.2, [-1.2, 0.15, 0.1], [1.2, 0.6, 1]);

  // morning sky props: warm sun upper LEFT, soft clouds
  const clouds = makeClouds(g, [
    [-10, 7.0, -15, 1.5], [5, 8.0, -18, 1.8], [14, 6.5, -13, 1.1], [-19, 7.5, -17, 1.4],
  ]);
  makeSun(g, -13.5, 7.5, -22, 1.8, "#ffd94d");
  makeTree(g, 8.5, -6.5, 1.2);

  // ripple rings on the water surface (flat white tori, pulse in story.ts)
  const mkRipple = (x: number, z: number, r: number, opacity: number) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.03, 8, 40),
      new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.03, z);
    m.castShadow = false;
    g.add(m);
    return m;
  };
  const rippleFlam = mkRipple(0.2, 0.4, 0.55, 0.45);
  const rippleFood = mkRipple(-1.9, 0.6, 0.45, 0.5);
  rippleFood.visible = false;
  const rippleRight = mkRipple(1.6, 0.5, 0.45, 0.4);
  rippleRight.visible = false;

  // food morsels: tiny golden glints in the shallow water, LEFT of the
  // flamingo (the correct spot). Hidden under the murky water until line 5.
  const foodG = new THREE.Group();
  g.add(foodG);
  const fr = rng(53);
  for (let i = 0; i < 6; i++) {
    const a = fr() * Math.PI * 2;
    const d = 0.15 + fr() * 0.35;
    sph(foodG, "#f2c14e", 0.06 + fr() * 0.04,
      [-1.9 + Math.cos(a) * d, 0.06, 0.6 + Math.sin(a) * d * 0.6], [1, 0.7, 1], 0.3);
  }
  foodG.visible = false;
  // the one morsel the flamingo catches (hangs from the beak tip)
  const foodCaught = sph(g, "#f2c14e", 0.09, [0, 0, 0], [1, 0.8, 1], 0.3);
  foodCaught.visible = false;

  // splash droplets (hidden until a fast filter / the catch; animated in story.ts)
  const splash = new THREE.Group();
  g.add(splash);
  const splashDrops: THREE.Mesh[] = [];
  const dr = rng(23);
  for (let i = 0; i < 10; i++) {
    const d = sph(splash, "#ffffff", 0.05 + dr() * 0.05, [0, 0, 0], [1, 1, 1], 0.4);
    d.castShadow = false;
    (d as THREE.Mesh).userData.a = dr() * Math.PI * 2;
    (d as THREE.Mesh).userData.r = 0.25 + dr() * 0.55;
    (d as THREE.Mesh).userData.h = 0.5 + dr() * 0.9;
    splashDrops.push(d);
  }
  splash.visible = false;

  // sparkles: catch moment (line 5) + warm close, around the food + flamingo
  const sparkles = makeSparkles(g, [
    [-1.9, 1.0, 0.7], [-1.4, 1.4, 0.5], [-2.3, 0.7, 0.8],
    [0.2, 3.2, 0.5], [-0.6, 2.6, 0.6], [0.9, 1.6, 0.5],
  ], 1.2);

  const flam = buildFlamingo();
  g.add(flam.root);
  const spar = buildSparrow();
  g.add(spar.root);

  return {
    flamingo: flam.root, ...flam.refs,
    sparrow: spar.root, ...spar.refs,
    foodG, foodCaught,
    clouds, reeds, bushes,
    rippleFlam, rippleFood, rippleRight,
    splash, splashDrops, sparkles, water,
  };
}
