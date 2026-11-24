import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface LumbaRefs {
  lumo: THREE.Group; lumoBodyG: THREE.Group; lumoHeadG: THREE.Group;
  lumoJawG: THREE.Group; lumoTailG: THREE.Group; lumoFinL: THREE.Group; lumoFinR: THREE.Group;
  lumoDorsalG: THREE.Group; lumoEyeL: THREE.Mesh; lumoEyeR: THREE.Mesh;
  tara: THREE.Group; taraBodyG: THREE.Group; taraHeadG: THREE.Group;
  taraJawG: THREE.Group; taraFinFL: THREE.Group; taraFinFR: THREE.Group;
  taraFinBL: THREE.Group; taraFinBR: THREE.Group;
  taraEyeL: THREE.Mesh; taraEyeR: THREE.Mesh;
  flock: { root: THREE.Group; finFL: THREE.Group; finFR: THREE.Group; finBL: THREE.Group; finBR: THREE.Group; headG: THREE.Group }[];
  whale: THREE.Group; whaleBodyG: THREE.Group; whaleHeadG: THREE.Group;
  whaleJawG: THREE.Group; whaleFinL: THREE.Group; whaleFinR: THREE.Group;
  whaleTailG: THREE.Group; spoutG: THREE.Group; songG: THREE.Group; songRings: THREE.Mesh[];
  whaleEyeL: THREE.Mesh; whaleEyeR: THREE.Mesh;
  bubblesG: THREE.Group; currentG: THREE.Group;
  seaweed: THREE.Group[]; sparkles: THREE.Group;
  sunG: THREE.Group; sunMesh: THREE.Mesh; sunGlow: THREE.Mesh;
  raysGoldG: THREE.Group; crescentG: THREE.Group;
}

const LUMO_BLUE = "#6fa3c8";
const LUMO_DARK = "#5d8fb5";
const LUMO_BELLY = "#f2e8d5";
const TARA_SHELL = "#7a8c4a";
const TARA_LIGHT = "#93a45e";
const TARA_RIM = "#6b7a3f";
const TARA_BELLY = "#e8d9a8";
const WHALE_BLUE = "#7fa8c9";
const WHALE_DARK = "#5d84a8";
const WHALE_BELLY = "#dbe9f2";

// ---------------------------------------------------------------- dolphin
function buildDolphin(): {
  root: THREE.Group;
  refs: Pick<LumbaRefs, "lumoBodyG" | "lumoHeadG" | "lumoJawG" | "lumoTailG" | "lumoFinL" | "lumoFinR" | "lumoDorsalG" | "lumoEyeL" | "lumoEyeR">;
} {
  const lumo = new THREE.Group();
  const lumoBodyG = new THREE.Group();
  lumo.add(lumoBodyG);

  // streamlined body: ellipsoid, belly cream, darker back
  sph(lumoBodyG, LUMO_BLUE, 0.55, [0, 0, 0], [2.4, 0.8, 0.75]);
  sph(lumoBodyG, LUMO_BELLY, 0.45, [0.05, -0.16, 0], [2.2, 0.6, 0.62]);
  sph(lumoBodyG, LUMO_DARK, 0.5, [-0.1, 0.16, 0], [2.2, 0.55, 0.68]);

  // dorsal fin (curved back fin)
  const lumoDorsalG = new THREE.Group();
  lumoDorsalG.position.set(-0.15, 0.42, 0);
  lumoDorsalG.rotation.z = -0.35;
  lumoBodyG.add(lumoDorsalG);
  sph(lumoDorsalG, LUMO_DARK, 0.3, [0, 0.1, 0], [1.1, 1.2, 0.18]);

  // head: melon forehead + beak, eyes on the sides
  const lumoHeadG = new THREE.Group();
  lumoHeadG.position.set(0.95, 0.05, 0);
  lumoBodyG.add(lumoHeadG);
  sph(lumoHeadG, LUMO_BLUE, 0.42, [0, 0, 0], [1.2, 0.9, 0.85]);
  sph(lumoHeadG, "#7fb0d0", 0.28, [0.15, 0.18, 0], [1, 0.8, 0.9]);
  sph(lumoHeadG, LUMO_BLUE, 0.22, [0.55, -0.05, 0], [1.8, 0.5, 0.65]);
  sph(lumoHeadG, "#8fb8d4", 0.1, [0.88, -0.08, 0], [1.2, 0.5, 0.6]);
  const { eyeL, eyeR } = makeEyes(lumoHeadG, 0.28, 0.16, 0.3, 0.06);
  // lower jaw (speaking)
  const lumoJawG = new THREE.Group();
  lumoJawG.position.set(0.42, -0.3, 0);
  lumoHeadG.add(lumoJawG);
  sph(lumoJawG, LUMO_BELLY, 0.16, [0.08, -0.02, 0], [1.8, 0.45, 0.7]);

  // pectoral fins (pivot at the body so they can flap)
  const mkFin = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.35, -0.35, z);
    lumoBodyG.add(g);
    sph(g, LUMO_DARK, 0.28, [0, -0.12, z > 0 ? 0.12 : -0.12], [1.4, 0.25, 0.7]);
    return g;
  };
  const lumoFinL = mkFin(0.38);
  const lumoFinR = mkFin(-0.38);

  // tail: stock + two fluke lobes
  const lumoTailG = new THREE.Group();
  lumoTailG.position.set(-1.15, 0, 0);
  lumoBodyG.add(lumoTailG);
  cyl(lumoTailG, LUMO_BLUE, 0.16, 0.1, 0.5, [-0.2, 0, 0], [0, 0, Math.PI / 2]);
  sph(lumoTailG, LUMO_DARK, 0.3, [-0.5, 0, 0.3], [1.2, 0.22, 0.8]);
  sph(lumoTailG, LUMO_DARK, 0.3, [-0.5, 0, -0.3], [1.2, 0.22, 0.8]);

  return { root: lumo, refs: { lumoBodyG, lumoHeadG, lumoJawG, lumoTailG, lumoFinL, lumoFinR, lumoDorsalG, lumoEyeL: eyeL, lumoEyeR: eyeR } };
}

// ---------------------------------------------------------------- turtle
function buildTurtle(shell = TARA_SHELL, light = TARA_LIGHT): {
  root: THREE.Group;
  refs: Pick<LumbaRefs, "taraBodyG" | "taraHeadG" | "taraJawG" | "taraFinFL" | "taraFinFR" | "taraFinBL" | "taraFinBR" | "taraEyeL" | "taraEyeR">;
} {
  const tara = new THREE.Group();
  const taraBodyG = new THREE.Group();
  tara.add(taraBodyG);

  // smooth dome shell + rim + cream belly
  sph(taraBodyG, shell, 0.55, [0, 0.18, 0], [1.45, 0.6, 1.15]);
  sph(taraBodyG, light, 0.4, [0, 0.38, 0], [1.3, 0.55, 1.0]);
  sph(taraBodyG, TARA_RIM, 0.5, [0, 0.02, 0], [1.5, 0.35, 1.2]);
  sph(taraBodyG, TARA_BELLY, 0.45, [0, -0.14, 0], [1.3, 0.45, 0.95]);

  // head + snout + lower jaw (speaking)
  const taraHeadG = new THREE.Group();
  taraHeadG.position.set(0.78, 0.08, 0);
  taraBodyG.add(taraHeadG);
  sph(taraHeadG, light, 0.22, [0, 0, 0], [1.15, 0.95, 0.9]);
  sph(taraHeadG, light, 0.12, [0.18, -0.02, 0], [1.2, 0.8, 0.8]);
  const { eyeL, eyeR } = makeEyes(taraHeadG, 0.12, 0.08, 0.15, 0.05);
  const taraJawG = new THREE.Group();
  taraJawG.position.set(0.12, -0.16, 0);
  taraHeadG.add(taraJawG);
  sph(taraJawG, TARA_BELLY, 0.1, [0.05, -0.02, 0], [1.3, 0.4, 0.8]);

  // four flippers (pivot at the shell edge so they can row)
  const mkFlipper = (x: number, z: number, r: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.08, z);
    taraBodyG.add(g);
    sph(g, shell, r, [0.1, 0, z > 0 ? 0.1 : -0.1], [1.5, 0.22, 0.8]);
    return g;
  };
  const taraFinFL = mkFlipper(0.35, 0.5, 0.3);
  const taraFinFR = mkFlipper(0.35, -0.5, 0.3);
  const taraFinBL = mkFlipper(-0.45, 0.45, 0.24);
  const taraFinBR = mkFlipper(-0.45, -0.45, 0.24);

  cone(taraBodyG, shell, 0.08, 0.25, [-0.8, 0, 0], [0, 0, Math.PI / 2]);

  return { root: tara, refs: { taraBodyG, taraHeadG, taraJawG, taraFinFL, taraFinFR, taraFinBL, taraFinBR, taraEyeL: eyeL, taraEyeR: eyeR } };
}

// ---------------------------------------------------------------- whale (adaptasi buildWhale kudalaut)
function buildWhale(): {
  root: THREE.Group;
  refs: Pick<LumbaRefs, "whaleBodyG" | "whaleHeadG" | "whaleJawG" | "whaleFinL" | "whaleFinR" | "whaleTailG" | "spoutG" | "songG" | "songRings" | "whaleEyeL" | "whaleEyeR">;
} {
  const whale = new THREE.Group();
  const whaleBodyG = new THREE.Group();
  whale.add(whaleBodyG);

  sph(whaleBodyG, WHALE_BLUE, 1.05, [0, 0, 0], [1.8, 1, 0.95]);
  sph(whaleBodyG, WHALE_BELLY, 0.85, [0.15, -0.42, 0], [1.7, 0.7, 0.85]);
  sph(whaleBodyG, WHALE_DARK, 0.7, [-0.9, 0.25, 0], [1.3, 0.9, 0.9]);

  const whaleHeadG = new THREE.Group();
  whaleHeadG.position.set(1.55, 0.2, 0);
  whaleBodyG.add(whaleHeadG);
  sph(whaleHeadG, WHALE_BLUE, 0.5, [0, 0, 0], [1.15, 0.95, 0.95]);
  const { eyeL, eyeR } = makeEyes(whaleHeadG, 0.28, 0.16, 0.42, 0.12); // mata diperbesar 01.30 WIB (0,085 -> 0,12) agar terbaca dari jauh
  sph(whaleHeadG, WHALE_DARK, 0.09, [-0.35, 0.48, 0], [1.4, 0.5, 1]);
  const whaleJawG = new THREE.Group();
  whaleJawG.position.set(0.1, -0.38, 0);
  whaleHeadG.add(whaleJawG);
  sph(whaleJawG, WHALE_BELLY, 0.42, [0.15, -0.08, 0], [1.5, 0.5, 0.9]);

  // spout: white droplets jetting from the blowhole
  const spoutG = new THREE.Group();
  spoutG.position.set(-0.35, 0.5, 0);
  whaleHeadG.add(spoutG);
  for (let i = 0; i < 6; i++) {
    sphT(spoutG, "#ffffff", 0.12, 0.85, [0, 0, 0]);
  }
  spoutG.visible = false;

  // song rings: transparent rings expanding from the whale (nyanyian Boma)
  const songG = new THREE.Group();
  songG.position.set(1.9, 0.2, 0);
  whaleBodyG.add(songG);
  const songRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: "#cfeeff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 12, 48), mat);
    ring.castShadow = false;
    songG.add(ring);
    songRings.push(ring);
  }
  songG.visible = false;

  // pectoral fins
  const mkFin = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.7, -0.45, z);
    whaleBodyG.add(g);
    sph(g, WHALE_DARK, 0.5, [0.1, -0.15, z > 0 ? 0.25 : -0.25], [1.5, 0.28, 0.7]);
    return g;
  };
  const whaleFinL = mkFin(0.8);
  const whaleFinR = mkFin(-0.8);

  // tail: stock + fluke lobes
  const whaleTailG = new THREE.Group();
  whaleTailG.position.set(-1.8, 0, 0);
  whaleBodyG.add(whaleTailG);
  cyl(whaleTailG, WHALE_BLUE, 0.28, 0.2, 0.8, [-0.3, 0, 0], [0, 0, Math.PI / 2]);
  sph(whaleTailG, WHALE_DARK, 0.55, [-0.75, 0, 0.35], [1.3, 0.28, 0.8]);
  sph(whaleTailG, WHALE_DARK, 0.55, [-0.75, 0, -0.35], [1.3, 0.28, 0.8]);

  return { root: whale, refs: { whaleBodyG, whaleHeadG, whaleJawG, whaleFinL, whaleFinR, whaleTailG, spoutG, songG, songRings, whaleEyeL: eyeL, whaleEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): LumbaRefs {
  const g = scene as unknown as THREE.Group;

  // sandy floor
  const sandG = new THREE.Group();
  sandG.position.y = -2.6;
  g.add(sandG);
  groundDisc(sandG, "#d9c08a");
  // rocks + corals on the sand
  const coralCols = ["#f28ba8", "#ff9a5c", "#b388e6", "#f2c14e"];
  [[-4.5, -1.5], [-1.2, -2.8], [1.0, -3.0], [5.6, -2.2], [-6.5, -2.2], [7.5, -1.8]].forEach(([x, z], i) => {
    sph(sandG, coralCols[i % coralCols.length], 0.5, [x, 0.2, z], [1, 0.7, 1]);
    sph(sandG, coralCols[(i + 1) % coralCols.length], 0.35, [x + 0.5, 0.15, z + 0.3], [1, 0.7, 1]);
  });
  [[-5.5, -1], [0.5, -1.8], [6.5, -1.2], [-2.5, -2.2]].forEach(([x, z]) => {
    sph(sandG, "#9a9a92", 0.55, [x, 0.15, z], [1.3, 0.6, 1]);
  });

  // crescent coral — landmark "karang bulan sabit" (s4, line 31)
  const crescentG = new THREE.Group();
  crescentG.position.set(4.3, -2.1, -2.2);
  g.add(crescentG);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.15 + i * 0.175);
    sph(crescentG, "#ff9a5c", 0.3, [Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0], [1, 1, 0.6]);
  }
  sph(crescentG, "#f28ba8", 0.25, [-1.1, 0.15, 0.3], [1, 0.8, 1]);

  // seaweed clusters left + right
  const seaweed: THREE.Group[] = [];
  const clusters: [number, number][] = [[-5.2, -1.6], [5.4, -1.8]];
  clusters.forEach(([cx, cz], ci) => {
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Group();
      blade.position.set(cx + (b % 3) * 0.45, -2.6, cz + Math.floor(b / 3) * 0.7);
      blade.userData.phase = (ci * 5 + b) * 0.9;
      g.add(blade);
      const h = 1.6 + (b % 3) * 0.5;
      for (let s = 0; s < 4; s++) {
        sph(blade, b % 2 === 0 ? "#2e8b57" : "#3aa76d", 0.22 - s * 0.03, [0.05 * s, 0.25 + s * (h / 4), 0], [0.7, 1.3, 0.5]);
      }
      seaweed.push(blade);
    }
  });

  // light rays from the surface (cool blue)
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(-4 + i * 4, 3.5, -4);
    ray.rotation.z = 0.25;
    g.add(ray);
  }

  // golden rays for the sunrise (opacity animated in story)
  const raysGoldG = new THREE.Group();
  g.add(raysGoldG);
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.0, 10, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: "#ffd97a", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(3 + i * 3.5, 3.0, -5);
    ray.rotation.z = -0.2;
    raysGoldG.add(ray);
  }

  // bubbles rising (loop)
  const bubblesG = new THREE.Group();
  g.add(bubblesG);
  for (let i = 0; i < 14; i++) {
    sphT(bubblesG, "#dff2ff", 0.09, 0.6, [0, 0, 0]);
  }

  // current streaks (thin, faint — they must not read as solid bars)
  const currentG = new THREE.Group();
  g.add(currentG);
  for (let i = 0; i < 6; i++) {
    const c = cyl(currentG, "#ffffff", 0.02, 0.02, 1.6, [0, -1 + i * 0.9, -0.5], [0, 0, Math.PI / 2]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#cfeeff", transparent: true, opacity: 0.2 });
    (c as THREE.Mesh).castShadow = false;
  }

  // sunrise sun: golden ball + glow halo at the horizon (s5 only)
  const sunG = new THREE.Group();
  sunG.position.set(9.5, -1.2, -10);
  g.add(sunG);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 18),
    new THREE.MeshBasicMaterial({ color: "#ffcf4d" }));
  sunG.add(sunMesh);
  const sunGlow = sphT(sunG, "#ffdf8a", 2.6, 0.35, [0, 0, 0]);
  sunGlow.castShadow = false;
  sunG.visible = false;

  const sparkles = makeSparkles(g, [
    [2.4, 0.6, 0.6], [3.4, 0.4, 0.4], [2.9, 1.0, 0.2], [2.2, 0.0, 0.8], [3.8, 0.9, 0.5],
    [4.6, 0.8, 0.3], [5.2, 0.3, 0.6], [4.0, 1.3, 0.2],
  ], 1.2);

  const lumo = buildDolphin();
  g.add(lumo.root);
  const tara = buildTurtle();
  g.add(tara.root);

  // flock: 3 small turtles, same style, no speaking jaw
  const flock: LumbaRefs["flock"] = [];
  const flockCols: [string, string][] = [["#7a8c4a", "#93a45e"], ["#8a7a3f", "#a3945a"], ["#6b8c5a", "#84a86e"]];
  flockCols.forEach(([sh, li]) => {
    const t = buildTurtle(sh, li);
    t.root.scale.setScalar(0.55);
    g.add(t.root);
    flock.push({ root: t.root, finFL: t.refs.taraFinFL, finFR: t.refs.taraFinFR, finBL: t.refs.taraFinBL, finBR: t.refs.taraFinBR, headG: t.refs.taraHeadG });
  });

  const whale = buildWhale();
  whale.root.scale.setScalar(1.35);
  g.add(whale.root);

  return {
    lumo: lumo.root, ...lumo.refs,
    tara: tara.root, ...tara.refs,
    flock,
    whale: whale.root, ...whale.refs,
    bubblesG, currentG, seaweed, sparkles,
    sunG, sunMesh, sunGlow, raysGoldG, crescentG,
  };
}
