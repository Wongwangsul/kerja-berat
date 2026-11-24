import * as THREE from "three";
import {
  sph, cone, cyl,
  groundDisc, makeTree, makeBush, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface BadakRefs {
  induk: THREE.Group; indBodyG: THREE.Group; indHeadG: THREE.Group;
  indJawG: THREE.Group; indEarL: THREE.Group; indEarR: THREE.Group;
  indLegFL: THREE.Group; indLegFR: THREE.Group;
  indLegBL: THREE.Group; indLegBR: THREE.Group; indTailG: THREE.Group;
  indEyeL: THREE.Mesh; indEyeR: THREE.Mesh;
  anak: THREE.Group; anaBodyG: THREE.Group; anaHeadG: THREE.Group;
  anaJawG: THREE.Group; anaEarL: THREE.Group; anaEarR: THREE.Group;
  anaLegFL: THREE.Group; anaLegFR: THREE.Group;
  anaLegBL: THREE.Group; anaLegBR: THREE.Group; anaTailG: THREE.Group;
  anaEyeL: THREE.Mesh; anaEyeR: THREE.Mesh;
  leavesG: THREE.Group; raysG: THREE.Group; sparkles: THREE.Group;
  ferns: THREE.Group[];
}

const SKIN = "#8d8578";
const SKIN_DARK = "#6e675c";
const SKIN_LIGHT = "#a39a8a";
const HORN = "#cfc8b8";

// ---------------------------------------------------------------- rhino
// AKURASI MUTLAK: badak Jawa bercula SATU. Builder ini memasang TEPAT SATU
// cula kecil di ujung hidung — jangan pernah menambah cula kedua.
function buildRhino(s: number): {
  root: THREE.Group;
  refs: {
    bodyG: THREE.Group; headG: THREE.Group; jawG: THREE.Group;
    earL: THREE.Group; earR: THREE.Group;
    legFL: THREE.Group; legFR: THREE.Group; legBL: THREE.Group; legBR: THREE.Group;
    tailG: THREE.Group; eyeL: THREE.Mesh; eyeR: THREE.Mesh;
  };
} {
  const root = new THREE.Group();
  const bodyG = new THREE.Group();
  bodyG.position.set(0, 0.95 * s, 0);
  root.add(bodyG);

  // massive barrel body + lighter belly
  sph(bodyG, SKIN, 0.8 * s, [0, 0, 0], [1.5, 0.95, 0.95]);
  sph(bodyG, SKIN_LIGHT, 0.62 * s, [0.1 * s, -0.28 * s, 0], [1.4, 0.7, 0.85]);
  // skin folds: flattened darker bands on the flanks
  sph(bodyG, SKIN_DARK, 0.5 * s, [-0.35 * s, 0.1 * s, 0.62 * s], [0.35, 1.0, 0.5]);
  sph(bodyG, SKIN_DARK, 0.5 * s, [0.35 * s, 0.05 * s, 0.62 * s], [0.35, 1.0, 0.5]);
  sph(bodyG, SKIN_DARK, 0.5 * s, [-0.35 * s, 0.1 * s, -0.62 * s], [0.35, 1.0, 0.5]);
  sph(bodyG, SKIN_DARK, 0.5 * s, [0.35 * s, 0.05 * s, -0.62 * s], [0.35, 1.0, 0.5]);

  // head: elongated, low-slung
  const headG = new THREE.Group();
  headG.position.set(1.15 * s, 0.3 * s, 0);
  bodyG.add(headG);
  sph(headG, SKIN, 0.5 * s, [0, 0, 0], [1.3, 0.9, 0.9]);
  sph(headG, SKIN_LIGHT, 0.3 * s, [0.45 * s, -0.12 * s, 0], [1.2, 0.8, 0.9]);
  const { eyeL, eyeR } = makeEyes(headG, 0.32 * s, 0.14 * s, 0.3 * s, 0.05 * s);
  // *** THE single horn: one small cone at the tip of the nose ***
  cone(headG, HORN, 0.09 * s, 0.3 * s, [0.58 * s, 0.3 * s, 0], [0, 0, -0.35]);
  // lower jaw
  const jawG = new THREE.Group();
  jawG.position.set(0.3 * s, -0.32 * s, 0);
  headG.add(jawG);
  sph(jawG, SKIN_DARK, 0.24 * s, [0.12 * s, -0.05 * s, 0], [1.3, 0.5, 0.9]);

  // ears: small flattened pivots on top of the head
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.12 * s, 0.4 * s, z);
    headG.add(g);
    sph(g, SKIN_DARK, 0.14 * s, [0, 0.06 * s, 0], [1, 0.9, 0.45]);
    return g;
  };
  const earL = mkEar(0.28 * s);
  const earR = mkEar(-0.28 * s);

  // legs: thick columns + round feet
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.45 * s, z);
    bodyG.add(g);
    cyl(g, SKIN_DARK, 0.17 * s, 0.15 * s, 0.55 * s, [0, -0.27 * s, 0]);
    sph(g, SKIN_DARK, 0.17 * s, [0.03 * s, -0.55 * s, 0], [1.25, 0.7, 1.1]);
    return g;
  };
  const legFL = mkLeg(0.6 * s, 0.38 * s);
  const legFR = mkLeg(0.6 * s, -0.38 * s);
  const legBL = mkLeg(-0.6 * s, 0.38 * s);
  const legBR = mkLeg(-0.6 * s, -0.38 * s);

  // tail with tuft
  const tailG = new THREE.Group();
  tailG.position.set(-1.15 * s, 0.15 * s, 0);
  bodyG.add(tailG);
  cyl(tailG, SKIN_DARK, 0.05 * s, 0.04 * s, 0.6 * s, [-0.1 * s, -0.25 * s, 0], [0, 0, 0.35]);
  sph(tailG, "#4a443c", 0.1 * s, [-0.22 * s, -0.52 * s, 0]);

  return { root, refs: { bodyG, headG, jawG, earL, earR, legFL, legFR, legBL, legBR, tailG, eyeL, eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): BadakRefs {
  const g = scene as unknown as THREE.Group;

  groundDisc(g, "#4d8a44");
  // layered forest: dark back row, mid row, bushes in front
  makeTree(g, -12, -14, 1.9, "#5a4028", ["#2c5c2e", "#27552a", "#356b34"]);
  makeTree(g, -4, -15, 2.1, "#5a4028", ["#2c5c2e", "#27552a", "#356b34"]);
  makeTree(g, 5, -14, 1.8, "#5a4028", ["#2c5c2e", "#27552a", "#356b34"]);
  makeTree(g, 13, -13, 2.0, "#5a4028", ["#2c5c2e", "#27552a", "#356b34"]);
  makeTree(g, -8, -9, 1.4, "#6b4a2f", ["#3f9e4d", "#359046", "#49ac57"]);
  makeTree(g, 0.5, -9.5, 1.5, "#6b4a2f", ["#3f9e4d", "#359046", "#49ac57"]);
  makeTree(g, 8, -8.5, 1.3, "#6b4a2f", ["#3f9e4d", "#359046", "#49ac57"]);
  makeTree(g, -15, -8, 1.2, "#6b4a2f", ["#3f9e4d", "#359046", "#49ac57"]);
  makeBush(g, -6, -4, 1.2); makeBush(g, 6.5, -4.5, 1.3); makeBush(g, -11, -3.5, 1);
  makeGrassTufts(g, 50, 51, -14, 16, -3, 8, "#3f8a3a", "#4da344");

  // ferns: flattened green fans
  const ferns: THREE.Group[] = [];
  [[-4.5, -2.5], [5.5, -2.8], [-9, -2], [10, -2.2], [1.5, -3.5]].forEach(([x, z], i) => {
    const fg = new THREE.Group();
    fg.position.set(x, 0, z);
    fg.userData.phase = i * 1.1;
    g.add(fg);
    for (let k = 0; k < 5; k++) {
      sph(fg, "#2e7d32", 0.3, [Math.cos(k * 1.26) * 0.35, 0.25, Math.sin(k * 1.26) * 0.35], [1.4, 0.35, 0.7]);
    }
    ferns.push(fg);
  });

  // sun rays piercing the canopy from the upper right
  const raysG = new THREE.Group();
  g.add(raysG);
  for (let i = 0; i < 3; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(1.0, 10, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: "#fff8d6", transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }));
    ray.position.set(2 + i * 2.5, 4.5, -3);
    ray.rotation.z = -0.5;
    raysG.add(ray);
  }

  // falling leaves (loop)
  const leavesG = new THREE.Group();
  g.add(leavesG);
  for (let i = 0; i < 8; i++) {
    sph(leavesG, i % 2 === 0 ? "#6fae4e" : "#8fbf5a", 0.09, [0, 0, 0], [1.5, 0.4, 1]);
  }

  const sparkles = makeSparkles(g, [
    [0.0, 2.0, 0.5], [1.0, 1.9, 0.3], [-1.0, 2.1, 0.4], [0.5, 2.2, -0.2], [-0.5, 1.8, 0.7],
  ], 1.2);

  const induk = buildRhino(1.0);
  g.add(induk.root);
  const anak = buildRhino(0.58);
  g.add(anak.root);

  return {
    induk: induk.root,
    indBodyG: induk.refs.bodyG, indHeadG: induk.refs.headG, indJawG: induk.refs.jawG,
    indEarL: induk.refs.earL, indEarR: induk.refs.earR,
    indLegFL: induk.refs.legFL, indLegFR: induk.refs.legFR,
    indLegBL: induk.refs.legBL, indLegBR: induk.refs.legBR,
    indTailG: induk.refs.tailG, indEyeL: induk.refs.eyeL, indEyeR: induk.refs.eyeR,
    anak: anak.root,
    anaBodyG: anak.refs.bodyG, anaHeadG: anak.refs.headG, anaJawG: anak.refs.jawG,
    anaEarL: anak.refs.earL, anaEarR: anak.refs.earR,
    anaLegFL: anak.refs.legFL, anaLegFR: anak.refs.legFR,
    anaLegBL: anak.refs.legBL, anaLegBR: anak.refs.legBR,
    anaTailG: anak.refs.tailG, anaEyeL: anak.refs.eyeL, anaEyeR: anak.refs.eyeR,
    leavesG, raysG, sparkles, ferns,
  };
}
