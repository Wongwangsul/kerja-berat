import * as THREE from "three";
import {
  smat, smatT, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface BangauRefs {
  heron: THREE.Group; heronBodyG: THREE.Group; heronNeckG: THREE.Group;
  heronHeadG: THREE.Group; heronBeakLowG: THREE.Group; heronBeakTip: THREE.Group;
  heronWingL: THREE.Group; heronWingR: THREE.Group;
  heronLegL: THREE.Group; heronLegR: THREE.Group;
  heronEyeL: THREE.Mesh; heronEyeR: THREE.Mesh;
  gull: THREE.Group; gullBodyG: THREE.Group; gullHeadG: THREE.Group;
  gullBeakLowG: THREE.Group; gullWingL: THREE.Group; gullWingR: THREE.Group;
  gullLegL: THREE.Group; gullLegR: THREE.Group;
  gullEyeL: THREE.Mesh; gullEyeR: THREE.Mesh;
  fish: THREE.Group; fishBodyG: THREE.Group;
  clouds: THREE.Group[]; reeds: THREE.Group[];
  rippleHeron: THREE.Mesh; rippleRock: THREE.Mesh; rippleFish: THREE.Mesh;
  rippleGull: THREE.Mesh; splash: THREE.Group; splashDrops: THREE.Mesh[];
  sparkles: THREE.Group; water: THREE.Mesh;
}

const WHITE = "#ffffff";
const WHITE_SOFT = "#f2ede2";
const GREY = "#9aa5ad";
const YELLOW_BEAK = "#f2b705";
const DARK = "#3a3a3a";

// ---------------------------------------------------------------- heron
function buildHeron(): {
  root: THREE.Group;
  refs: Pick<BangauRefs, "heronBodyG" | "heronNeckG" | "heronHeadG" | "heronBeakLowG"
    | "heronBeakTip" | "heronWingL" | "heronWingR" | "heronLegL" | "heronLegR"
    | "heronEyeL" | "heronEyeR">;
} {
  const heron = new THREE.Group();
  const heronBodyG = new THREE.Group();
  heronBodyG.position.set(0, 2.05, 0);
  heron.add(heronBodyG);

  // body: big white ellipsoid + soft belly + tail
  sph(heronBodyG, WHITE, 0.55, [0, 0, 0], [1.5, 0.9, 0.8]);
  sph(heronBodyG, WHITE_SOFT, 0.45, [0.1, -0.18, 0], [1.3, 0.7, 0.75]);
  sph(heronBodyG, WHITE, 0.3, [-0.78, 0.15, 0], [1.25, 0.5, 0.7]);

  // neck: long, pivoted at the front-top of the body so it can bow / strike
  const heronNeckG = new THREE.Group();
  heronNeckG.position.set(0.55, 0.3, 0);
  heronBodyG.add(heronNeckG);
  cyl(heronNeckG, WHITE, 0.15, 0.19, 1.7, [0, 0.85, 0]);
  // slight S-curve hint: a soft bulge at the base of the neck
  sph(heronNeckG, WHITE, 0.2, [0.02, 0.15, 0], [1, 1.2, 0.9]);

  // head at the top of the neck
  const heronHeadG = new THREE.Group();
  heronHeadG.position.set(0.05, 1.72, 0);
  heronNeckG.add(heronHeadG);
  sph(heronHeadG, WHITE, 0.3, [0, 0, 0]);
  sph(heronHeadG, WHITE, 0.2, [-0.2, -0.05, 0], [1.1, 0.9, 0.95]);
  // black crest plume swept back
  cone(heronHeadG, "#2b2b2b", 0.045, 0.4, [-0.32, 0.22, 0], [0, 0, 1.1]);
  const { eyeL, eyeR } = makeEyes(heronHeadG, 0.16, 0.1, 0.17, 0.05);
  // upper beak: long pointed yellow cone along +x, flattened
  cone(heronHeadG, YELLOW_BEAK, 0.09, 1.3, [0.85, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = heronHeadG.children[heronHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.45);
  sph(heronHeadG, "#d18f0e", 0.035, [1.48, -0.02, 0], [1, 0.8, 0.8], 0.5);
  // invisible marker at the beak tip (world pos = where the caught fish hangs)
  const heronBeakTip = new THREE.Group();
  heronBeakTip.position.set(1.5, -0.02, 0);
  heronHeadG.add(heronBeakTip);
  // lower beak (pivot at beak base, rotates down to speak)
  const heronBeakLowG = new THREE.Group();
  heronBeakLowG.position.set(0.3, -0.14, 0);
  heronHeadG.add(heronBeakLowG);
  cone(heronBeakLowG, "#e8a91c", 0.07, 1.15, [0.55, 0, 0], [0, 0, -Math.PI / 2]);
  const low = heronBeakLowG.children[heronBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.4);

  // wings: folded white ellipsoids with grey tips, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.05, 0.22, z);
    heronBodyG.add(g);
    sph(g, WHITE, 0.48, [-0.05, 0, z > 0 ? 0.1 : -0.1], [1.55, 0.28, 0.5]);
    sph(g, "#dfe3e6", 0.3, [-0.6, -0.02, z > 0 ? 0.12 : -0.12], [1.1, 0.26, 0.45]);
    return g;
  };
  const heronWingL = mkWing(0.42);
  const heronWingR = mkWing(-0.42);

  // legs: long thin dark stilts, pivot at the hip (fold up for one-leg stand)
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.25, -0.3, z);
    heronBodyG.add(g);
    cyl(g, DARK, 0.045, 0.04, 1.75, [0, -0.85, 0]);
    sph(g, DARK, 0.07, [0.06, -1.72, 0], [1.5, 0.4, 1.2]);
    return g;
  };
  const heronLegL = mkLeg(0.22);
  const heronLegR = mkLeg(-0.22);

  return {
    root: heron,
    refs: {
      heronBodyG, heronNeckG, heronHeadG, heronBeakLowG, heronBeakTip,
      heronWingL, heronWingR, heronLegL, heronLegR,
      heronEyeL: eyeL, heronEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- gull
function buildGull(): {
  root: THREE.Group;
  refs: Pick<BangauRefs, "gullBodyG" | "gullHeadG" | "gullBeakLowG" | "gullWingL"
    | "gullWingR" | "gullLegL" | "gullLegR" | "gullEyeL" | "gullEyeR">;
} {
  const gull = new THREE.Group();
  const gullBodyG = new THREE.Group();
  gullBodyG.position.set(0, 0, 0);
  gull.add(gullBodyG);

  // body: white-grey ellipsoid + white belly
  sph(gullBodyG, "#f4f6f7", 0.5, [0, 0, 0], [1.4, 0.85, 0.8]);
  sph(gullBodyG, WHITE, 0.4, [0.05, -0.15, 0], [1.2, 0.7, 0.75]);
  // tail fan
  sph(gullBodyG, "#c8ced3", 0.25, [-0.65, 0.05, 0], [1.3, 0.25, 0.8]);

  // head
  const gullHeadG = new THREE.Group();
  gullHeadG.position.set(0.55, 0.28, 0);
  gullBodyG.add(gullHeadG);
  sph(gullHeadG, "#f4f6f7", 0.28, [0, 0, 0]);
  const { eyeL, eyeR } = makeEyes(gullHeadG, 0.16, 0.1, 0.16, 0.05);
  // short yellow beak
  cone(gullHeadG, YELLOW_BEAK, 0.08, 0.5, [0.38, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = gullHeadG.children[gullHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.5);
  const gullBeakLowG = new THREE.Group();
  gullBeakLowG.position.set(0.12, -0.1, 0);
  gullHeadG.add(gullBeakLowG);
  cone(gullBeakLowG, "#e8a91c", 0.06, 0.42, [0.2, 0, 0], [0, 0, -Math.PI / 2]);
  const low = gullBeakLowG.children[gullBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // wings: wide, grey-white with darker tips, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.18, z);
    gullBodyG.add(g);
    sph(g, "#e8ecef", 0.5, [-0.1, 0, z > 0 ? 0.25 : -0.25], [1.7, 0.16, 0.55]);
    sph(g, GREY, 0.3, [-0.78, 0, z > 0 ? 0.3 : -0.3], [1.2, 0.14, 0.5]);
    return g;
  };
  const gullWingL = mkWing(0.3);
  const gullWingR = mkWing(-0.3);

  // legs: short orange (visible when perched / standing in water)
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.1, -0.3, z);
    gullBodyG.add(g);
    cyl(g, "#f08a1d", 0.04, 0.035, 0.3, [0, -0.15, 0]);
    sph(g, "#f08a1d", 0.05, [0.03, -0.3, 0], [1.4, 0.4, 1.2]);
    return g;
  };
  const gullLegL = mkLeg(0.15);
  const gullLegR = mkLeg(-0.15);

  return {
    root: gull,
    refs: {
      gullBodyG, gullHeadG, gullBeakLowG, gullWingL, gullWingR,
      gullLegL, gullLegR, gullEyeL: eyeL, gullEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- fish
function buildFish(): { root: THREE.Group; refs: Pick<BangauRefs, "fishBodyG"> } {
  const fish = new THREE.Group();
  const fishBodyG = new THREE.Group();
  fish.add(fishBodyG);
  sph(fishBodyG, "#ff8a3c", 0.22, [0, 0, 0], [1.6, 0.8, 0.6]);
  sph(fishBodyG, "#ffd9a0", 0.15, [0.05, -0.08, 0], [1.4, 0.6, 0.5]);
  // tail + dorsal fin
  cone(fishBodyG, "#ff6a2c", 0.16, 0.3, [-0.42, 0, 0], [0, 0, Math.PI / 2]);
  cone(fishBodyG, "#ff6a2c", 0.08, 0.2, [-0.05, 0.18, 0], [0, 0, 0.4]);
  // eyes both sides
  sph(fishBodyG, "#241d1a", 0.035, [0.22, 0.05, 0.12], [1, 1, 1], 0.25);
  sph(fishBodyG, "#241d1a", 0.035, [0.22, 0.05, -0.12], [1, 1, 1], 0.25);
  fish.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = false; } });
  return { root: fish, refs: { fishBodyG } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): BangauRefs {
  const g = scene as unknown as THREE.Group;

  // sand bottom (y = -0.7) + shallow water surface (y = 0, translucent teal)
  const sandG = new THREE.Group();
  sandG.position.y = -0.7;
  g.add(sandG);
  groundDisc(sandG, "#e8d29a");
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    smatT("#35a3c2", 0.5, 0.3),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.receiveShadow = true;
  g.add(water);
  // a few sand ripples / shells on the bottom (visible through the water)
  const sr = rng(41);
  for (let i = 0; i < 9; i++) {
    const x = -5 + sr() * 10, z = -2.5 + sr() * 4.5;
    sph(sandG, i % 2 ? "#d9c48d" : "#f2e3b0", 0.12 + sr() * 0.1, [x, 0.05, z], [1, 0.35, 1], 1);
  }

  // rock in the middle (the fish's hiding place) + a smaller rock right
  const rockG = new THREE.Group();
  rockG.position.set(0.5, 0.05, -0.3);
  g.add(rockG);
  sph(rockG, "#8d8578", 0.9, [0, 0, 0], [1.3, 0.7, 0.9]);
  sph(rockG, "#a39a8a", 0.5, [0.35, 0.25, 0.25], [1.2, 0.6, 0.9]);
  sph(rockG, "#7a7268", 0.35, [-0.55, 0.1, -0.3], [1.1, 0.6, 0.9]);
  const rock2G = new THREE.Group();
  rock2G.position.set(2.9, -0.1, -1.1);
  g.add(rock2G);
  sph(rock2G, "#8d8578", 0.55, [0, 0, 0], [1.3, 0.6, 0.9]);

  // distant shore: low muted hills on the horizon (behind the water)
  const hills: [number, number, number, string][] = [
    [-22, -26, 20, "#8a6f6a"], [8, -28, 24, "#7d6560"], [30, -24, 18, "#96755f"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.86, z], [1, 0.5, 1], 1);
    h.castShadow = false;
  });

  // water reeds at the edges (sway in story.ts)
  const reeds: THREE.Group[] = [];
  const reedSpots: [number, number, number][] = [
    [-4.4, -1.4, 1.5], [-3.6, -1.9, 1.2], [3.9, -1.6, 1.4], [4.6, -1.2, 1.1], [-5.2, -0.6, 1.3],
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

  // sunset sky props
  const clouds = makeClouds(g, [
    [-10, 7.0, -15, 1.5], [5, 8.0, -18, 1.8], [14, 6.5, -13, 1.1], [-19, 7.5, -17, 1.4],
  ]);
  makeSun(g, -13.5, 6.0, -22, 2.4, "#ffcf5e");

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
  const rippleHeron = mkRipple(-1.8, 0.4, 0.55, 0.45);
  const rippleRock = mkRipple(0.5, 0.55, 0.8, 0.35);
  const rippleFish = mkRipple(0.2, 0.15, 0.3, 0.5);
  const rippleGull = mkRipple(-0.7, 0.4, 0.4, 0.5);
  rippleGull.visible = false;

  // splash droplets (hidden until a strike / landing; animated in story.ts)
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

  // sparkles: catch moment (line 6) + warm close (line 7)
  const sparkles = makeSparkles(g, [
    [0.7, 1.0, 0.5], [0.2, 1.4, 0.3], [1.1, 0.7, 0.6],
    [-1.2, 3.0, 0.5], [-0.5, 2.5, 0.6], [-0.2, 1.2, 0.5],
  ], 1.2);

  const heron = buildHeron();
  g.add(heron.root);
  const gull = buildGull();
  g.add(gull.root);
  const fish = buildFish();
  g.add(fish.root);

  return {
    heron: heron.root, ...heron.refs,
    gull: gull.root, ...gull.refs,
    fish: fish.root, ...fish.refs,
    clouds, reeds,
    rippleHeron, rippleRock, rippleFish, rippleGull,
    splash, splashDrops, sparkles, water,
  };
}
