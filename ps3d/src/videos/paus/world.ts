import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface PausRefs {
  whale: THREE.Group; whaleBodyG: THREE.Group; whaleHeadG: THREE.Group;
  whaleJawG: THREE.Group; whaleFinL: THREE.Group; whaleFinR: THREE.Group;
  whaleTailG: THREE.Group; spoutG: THREE.Group;
  whaleEyeL: THREE.Mesh; whaleEyeR: THREE.Mesh;
  crab: THREE.Group; crabBodyG: THREE.Group;
  crabJawG: THREE.Group; crabClawL: THREE.Group; crabClawR: THREE.Group;
  crabLegL: THREE.Group; crabLegR: THREE.Group;
  crabEyeL: THREE.Mesh; crabEyeR: THREE.Mesh;
  bubblesG: THREE.Group; columnG: THREE.Group;
  seaweed: THREE.Group[]; markerG: THREE.Group; rays: THREE.Mesh[];
  sparkles: THREE.Group;
}

const WHALE_BLUE = "#4f9fd8";
const WHALE_DARK = "#2f6fb2";
const WHALE_BELLY = "#d8ecf7";
const CRAB_RED = "#e0533d";
const CRAB_DARK = "#b23a2c";

// ---------------------------------------------------------------- whale
function buildWhale(): {
  root: THREE.Group;
  refs: Pick<PausRefs, "whaleBodyG" | "whaleHeadG" | "whaleJawG" | "whaleFinL" | "whaleFinR" | "whaleTailG" | "spoutG" | "whaleEyeL" | "whaleEyeR">;
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

  // spout: bubbles jetting from the blowhole (lines 0/2/5)
  const spoutG = new THREE.Group();
  spoutG.position.set(-0.35, 0.5, 0);
  whaleHeadG.add(spoutG);
  for (let i = 0; i < 10; i++) {
    sphT(spoutG, "#dff2ff", 0.12, 0.85, [0, 0, 0]);
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

// ---------------------------------------------------------------- crab
function buildCrab(): {
  root: THREE.Group;
  refs: Pick<PausRefs, "crabBodyG" | "crabJawG" | "crabClawL" | "crabClawR" | "crabLegL" | "crabLegR" | "crabEyeL" | "crabEyeR">;
} {
  const crab = new THREE.Group();
  const crabBodyG = new THREE.Group();
  crab.add(crabBodyG);

  // body: flattened dome, faces +x (front = claws/eyes at +x)
  sph(crabBodyG, CRAB_RED, 0.35, [0, 0, 0], [1.3, 0.65, 1]);
  sph(crabBodyG, CRAB_DARK, 0.28, [-0.05, 0.14, 0], [1.2, 0.6, 0.95]);
  // eye stalks + glossy eyes at the front-top
  cyl(crabBodyG, CRAB_RED, 0.03, 0.035, 0.22, [0.32, 0.28, 0.16], [0, 0, -0.25]);
  cyl(crabBodyG, CRAB_RED, 0.03, 0.035, 0.22, [0.32, 0.28, -0.16], [0, 0, -0.25]);
  const { eyeL, eyeR } = makeEyes(crabBodyG, 0.38, 0.4, 0.16, 0.07);
  // lower jaw (speaking) under the front
  const crabJawG = new THREE.Group();
  crabJawG.position.set(0.3, -0.18, 0);
  crabBodyG.add(crabJawG);
  sph(crabJawG, CRAB_DARK, 0.12, [0.05, -0.02, 0], [1.4, 0.5, 0.9]);

  // claws: arm + pincer ball + two pincer tips; near claw (z+) bigger
  const mkClaw = (z: number, s: number) => {
    const g = new THREE.Group();
    g.position.set(0.42, -0.02, z);
    crabBodyG.add(g);
    cyl(g, CRAB_RED, 0.05, 0.06, 0.3, [0.08, 0, 0], [0, 0, -Math.PI / 2 + 0.35]);
    sph(g, CRAB_RED, 0.16 * s, [0.3, 0.05, 0], [1.25, 0.95, 0.85]);
    cone(g, CRAB_DARK, 0.05, 0.16, [0.48, 0.14, 0], [0, 0, -Math.PI / 2 - 0.3]);
    cone(g, CRAB_DARK, 0.05, 0.16, [0.48, -0.04, 0], [0, 0, -Math.PI / 2 + 0.35]);
    return g;
  };
  const crabClawL = mkClaw(0.32, 1.15);
  const crabClawR = mkClaw(-0.32, 1.0);

  // walking legs: three thin legs per side, angled down-out
  const mkLegs = (zSign: number) => {
    const g = new THREE.Group();
    crabBodyG.add(g);
    [-0.18, 0.02, 0.2].forEach((x, i) => {
      const ang = (i - 1) * 0.45;
      cyl(g, CRAB_DARK, 0.025, 0.02, 0.42, [x, -0.22, zSign * 0.32], [zSign * 0.9, 0, ang * 0.4]);
    });
    return g;
  };
  const crabLegL = mkLegs(1);
  const crabLegR = mkLegs(-1);

  return { root: crab, refs: { crabBodyG, crabJawG, crabClawL, crabClawR, crabLegL, crabLegR, crabEyeL: eyeL, crabEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): PausRefs {
  const g = scene as unknown as THREE.Group;

  // sandy floor
  const sandG = new THREE.Group();
  sandG.position.y = -2.2;
  g.add(sandG);
  groundDisc(sandG, "#d9c08a");
  // coral reef: purple-orange mounds + grey rocks on the sand
  const coralCols = ["#a86fd6", "#ff9a5c", "#f28ba8", "#c98af2"];
  [[-4.2, -1.2], [-2.6, -2.4], [1.4, -2.6], [3.6, -1.6], [5.2, -2.4], [-5.4, -2.0]].forEach(([x, z], i) => {
    sph(sandG, coralCols[i % coralCols.length], 0.5, [x, 0.2, z], [1, 0.7, 1]);
    sph(sandG, coralCols[(i + 1) % coralCols.length], 0.35, [x + 0.5, 0.15, z + 0.3], [1, 0.7, 1]);
  });
  [[-3.4, -0.9], [0.6, -1.6], [4.8, -1.0]].forEach(([x, z]) => {
    sph(sandG, "#9a9a92", 0.55, [x, 0.15, z], [1.3, 0.6, 1]);
  });
  // the crab's perch: a flat coral rock on the right
  sph(sandG, "#a86fd6", 0.7, [2.5, 0.28, 0], [1.4, 0.55, 1.1]);
  sph(sandG, "#ff9a5c", 0.4, [2.9, 0.3, 0.5], [1, 0.6, 1]);

  // seaweed cluster on the right (near the crab) + a pair on the left
  const seaweed: THREE.Group[] = [];
  const mkBlade = (x: number, z: number, h: number, color: string, phase: number) => {
    const blade = new THREE.Group();
    blade.position.set(x, -2.2, z);
    blade.userData.phase = phase;
    g.add(blade);
    for (let s = 0; s < 4; s++) {
      sph(blade, color, 0.22 - s * 0.03, [0.05 * s, 0.25 + s * (h / 4), 0], [0.7, 1.3, 0.5]);
    }
    return blade;
  };
  for (let b = 0; b < 5; b++) {
    seaweed.push(mkBlade(3.4 + (b % 3) * 0.45, -1.4 + Math.floor(b / 3) * 0.8, 1.6 + (b % 3) * 0.5, b % 2 === 0 ? "#2e8b57" : "#3aa76d", b * 0.9));
  }
  seaweed.push(mkBlade(-4.6, -1.6, 1.8, "#2e8b57", 4.2));
  seaweed.push(mkBlade(-4.1, -0.9, 1.4, "#3aa76d", 5.1));

  // MARKER seaweed: tall, bright — the crab grips it in line 5; the straight
  // bubble column rises from its tip. Stands between whale and crab.
  const markerG = new THREE.Group();
  markerG.position.set(2.05, -2.2, 0.3);
  markerG.userData.phase = 0.4;
  g.add(markerG);
  for (let s = 0; s < 5; s++) {
    sph(markerG, s % 2 === 0 ? "#37c978" : "#2fb96a", 0.24 - s * 0.03, [0.04 * s, 0.25 + s * 0.5, 0], [0.7, 1.3, 0.5]);
  }
  sph(markerG, "#8dffb0", 0.14, [0.2, 2.55, 0], [1, 1, 1], 0.5);

  // light rays from the surface (opacity animated in story: dim in line 4)
  const rays: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(-4 + i * 4, 3.5, -4);
    ray.rotation.z = 0.25;
    g.add(ray);
    rays.push(ray);
  }

  // ambient bubbles rising (loop)
  const bubblesG = new THREE.Group();
  g.add(bubblesG);
  for (let i = 0; i < 12; i++) {
    sphT(bubblesG, "#dff2ff", 0.09, 0.6, [0, 0, 0]);
  }

  // straight bubble column above the marker (line 5 only)
  const columnG = new THREE.Group();
  g.add(columnG);
  for (let i = 0; i < 9; i++) {
    sphT(columnG, "#e8f7ff", 0.11, 0.75, [0, 0, 0]);
  }
  columnG.visible = false;

  const sparkles = makeSparkles(g, [
    [2.05, 0.9, 0.9], [2.5, 0.4, 0.6], [1.6, 1.2, 0.5], [2.3, 1.6, 0.7], [1.2, 0.2, 0.9],
    [0.4, -0.2, 0.8], [2.8, -0.6, 0.7],
  ], 1.2);

  const whale = buildWhale();
  whale.root.scale.setScalar(0.95);
  g.add(whale.root);
  const crab = buildCrab();
  g.add(crab.root);

  return {
    whale: whale.root, ...whale.refs,
    crab: crab.root, ...crab.refs,
    bubblesG, columnG, seaweed, markerG, rays, sparkles,
  };
}
