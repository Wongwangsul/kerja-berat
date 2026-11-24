import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface KudaLautRefs {
  seahorse: THREE.Group; seaBodyG: THREE.Group; seaHeadG: THREE.Group;
  seaJawG: THREE.Group; seaTailG: THREE.Group; seaFinG: THREE.Group;
  seaEyeL: THREE.Mesh; seaEyeR: THREE.Mesh;
  whale: THREE.Group; whaleBodyG: THREE.Group; whaleHeadG: THREE.Group;
  whaleJawG: THREE.Group; whaleFinL: THREE.Group; whaleFinR: THREE.Group;
  whaleTailG: THREE.Group; spoutG: THREE.Group;
  whaleEyeL: THREE.Mesh; whaleEyeR: THREE.Mesh;
  bubblesG: THREE.Group; currentG: THREE.Group;
  seaweed: THREE.Group[]; sparkles: THREE.Group;
}

const SEA_YELLOW = "#f2b93b";
const SEA_ORANGE = "#e08a2e";
const WHALE_BLUE = "#7fa8c9";
const WHALE_DARK = "#5d84a8";
const WHALE_BELLY = "#dbe9f2";

// ---------------------------------------------------------------- seahorse
function buildSeahorse(): {
  root: THREE.Group;
  refs: Pick<KudaLautRefs, "seaBodyG" | "seaHeadG" | "seaJawG" | "seaTailG" | "seaFinG" | "seaEyeL" | "seaEyeR">;
} {
  const seahorse = new THREE.Group();
  const seaBodyG = new THREE.Group();
  seahorse.add(seaBodyG);

  // S-curved upright body: stacked spheres drifting in x with height
  const pts: [number, number, number][] = [
    [0.02, 0.05, 0], [0.1, 0.22, 0], [0.14, 0.4, 0], [0.1, 0.58, 0],
    [0.02, 0.74, 0], [-0.04, 0.88, 0],
  ];
  pts.forEach(([x, y, z], i) => {
    sph(seaBodyG, i % 2 === 0 ? SEA_YELLOW : SEA_ORANGE, 0.17 - i * 0.008, [x, y, z], [1.15, 1, 0.95]);
  });
  // belly ridges
  sph(seaBodyG, "#ffe9a8", 0.12, [0.16, 0.4, 0], [0.7, 1.4, 0.8]);
  // dorsal fin on the back
  const seaFinG = new THREE.Group();
  seaFinG.position.set(-0.16, 0.5, 0);
  seaBodyG.add(seaFinG);
  sph(seaFinG, SEA_ORANGE, 0.14, [-0.08, 0, 0], [1.1, 1.4, 0.25]);

  // head: upright, snout pointing +x, little crown
  const seaHeadG = new THREE.Group();
  seaHeadG.position.set(-0.02, 1.0, 0);
  seaBodyG.add(seaHeadG);
  sph(seaHeadG, SEA_YELLOW, 0.19, [0, 0, 0]);
  cone(seaHeadG, SEA_YELLOW, 0.09, 0.34, [0.26, -0.02, 0], [0, 0, -Math.PI / 2]);
  const snout = seaHeadG.children[seaHeadG.children.length - 1] as THREE.Mesh;
  snout.scale.set(1, 1, 0.7);
  // crown spikes
  cone(seaHeadG, SEA_ORANGE, 0.045, 0.16, [-0.06, 0.2, 0.08], [0.3, 0, 0.2]);
  cone(seaHeadG, SEA_ORANGE, 0.045, 0.16, [-0.06, 0.22, -0.08], [0.3, 0, -0.2]);
  cone(seaHeadG, SEA_ORANGE, 0.05, 0.18, [-0.1, 0.2, 0], [0.5, 0, 0]);
  const { eyeL, eyeR } = makeEyes(seaHeadG, 0.08, 0.07, 0.12, 0.045);
  // lower jaw under the snout
  const seaJawG = new THREE.Group();
  seaJawG.position.set(0.18, -0.12, 0);
  seaHeadG.add(seaJawG);
  sph(seaJawG, SEA_ORANGE, 0.06, [0.05, -0.02, 0], [1.4, 0.5, 0.8]);

  // curled tail: spiral of small spheres, pivot at the body base
  const seaTailG = new THREE.Group();
  seaTailG.position.set(0.02, 0.02, 0);
  seaBodyG.add(seaTailG);
  const tailPts: [number, number][] = [
    [0, -0.08], [-0.06, -0.18], [-0.14, -0.26], [-0.24, -0.28], [-0.32, -0.2], [-0.34, -0.1],
  ];
  tailPts.forEach(([x, y], i) => {
    sph(seaTailG, i % 2 === 0 ? SEA_YELLOW : SEA_ORANGE, 0.1 - i * 0.008, [x, y, 0], [1, 1, 0.9]);
  });

  return { root: seahorse, refs: { seaBodyG, seaHeadG, seaJawG, seaTailG, seaFinG, seaEyeL: eyeL, seaEyeR: eyeR } };
}

// ---------------------------------------------------------------- whale
function buildWhale(): {
  root: THREE.Group;
  refs: Pick<KudaLautRefs, "whaleBodyG" | "whaleHeadG" | "whaleJawG" | "whaleFinL" | "whaleFinR" | "whaleTailG" | "spoutG" | "whaleEyeL" | "whaleEyeR">;
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
  const { eyeL, eyeR } = makeEyes(whaleHeadG, 0.28, 0.16, 0.42, 0.085);
  // blowhole on top
  sph(whaleHeadG, WHALE_DARK, 0.09, [-0.35, 0.48, 0], [1.4, 0.5, 1]);
  // lower jaw (speaking)
  const whaleJawG = new THREE.Group();
  whaleJawG.position.set(0.1, -0.38, 0);
  whaleHeadG.add(whaleJawG);
  sph(whaleJawG, WHALE_BELLY, 0.42, [0.15, -0.08, 0], [1.5, 0.5, 0.9]);

  // spout: white droplets jetting from the blowhole (line 7)
  const spoutG = new THREE.Group();
  spoutG.position.set(-0.35, 0.5, 0);
  whaleHeadG.add(spoutG);
  for (let i = 0; i < 6; i++) {
    sphT(spoutG, "#ffffff", 0.12, 0.85, [0, 0, 0]);
  }
  spoutG.visible = false;

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

  return { root: whale, refs: { whaleBodyG, whaleHeadG, whaleJawG, whaleFinL, whaleFinR, whaleTailG, spoutG, whaleEyeL: eyeL, whaleEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): KudaLautRefs {
  const g = scene as unknown as THREE.Group;

  // sandy floor
  const sandG = new THREE.Group();
  sandG.position.y = -2.2;
  g.add(sandG);
  groundDisc(sandG, "#d9c08a");
  // rocks + corals on the sand
  const coralCols = ["#f28ba8", "#ff9a5c", "#b388e6", "#f2c14e"];
  [[-3.5, -1.5], [-1.2, -2.5], [1.0, -2.8], [4.6, -2.0], [-5.5, -2.2]].forEach(([x, z], i) => {
    sph(sandG, coralCols[i % coralCols.length], 0.5, [x, 0.2, z], [1, 0.7, 1]);
    sph(sandG, coralCols[(i + 1) % coralCols.length], 0.35, [x + 0.5, 0.15, z + 0.3], [1, 0.7, 1]);
  });
  [[-4.5, -1], [0.5, -1.8], [5.5, -1.2]].forEach(([x, z]) => {
    sph(sandG, "#9a9a92", 0.55, [x, 0.15, z], [1.3, 0.6, 1]);
  });

  // seaweed cluster on the right (the goal)
  const seaweed: THREE.Group[] = [];
  for (let b = 0; b < 6; b++) {
    const blade = new THREE.Group();
    blade.position.set(3.0 + (b % 3) * 0.45, -2.2, -1.2 + Math.floor(b / 3) * 0.7);
    blade.userData.phase = b * 0.9;
    g.add(blade);
    const h = 1.6 + (b % 3) * 0.5;
    for (let s = 0; s < 4; s++) {
      sph(blade, b % 2 === 0 ? "#2e8b57" : "#3aa76d", 0.22 - s * 0.03, [0.05 * s, 0.25 + s * (h / 4), 0], [0.7, 1.3, 0.5]);
    }
    seaweed.push(blade);
  }

  // light rays from the surface
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(-4 + i * 4, 3.5, -4);
    ray.rotation.z = 0.25;
    g.add(ray);
  }

  // bubbles rising (loop)
  const bubblesG = new THREE.Group();
  g.add(bubblesG);
  for (let i = 0; i < 12; i++) {
    sphT(bubblesG, "#dff2ff", 0.09, 0.6, [0, 0, 0]);
  }

  // current streaks (thin, faint — they must not read as solid bars)
  const currentG = new THREE.Group();
  g.add(currentG);
  for (let i = 0; i < 5; i++) {
    const c = cyl(currentG, "#ffffff", 0.02, 0.02, 1.6, [0, -1 + i * 0.9, -0.5], [0, 0, Math.PI / 2]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#cfeeff", transparent: true, opacity: 0.2 });
    (c as THREE.Mesh).castShadow = false;
  }

  const sparkles = makeSparkles(g, [
    [2.4, 0.6, 0.6], [3.4, 0.4, 0.4], [2.9, 1.0, 0.2], [2.2, 0.0, 0.8], [3.8, 0.9, 0.5],
  ], 1.2);

  const sea = buildSeahorse();
  g.add(sea.root);
  const whale = buildWhale();
  g.add(whale.root);

  return {
    seahorse: sea.root, ...sea.refs,
    whale: whale.root, ...whale.refs,
    bubblesG, currentG, seaweed, sparkles,
  };
}
