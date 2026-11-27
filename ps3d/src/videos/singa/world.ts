import * as THREE from "three";
import {
  smat, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeTree, makeBush,
  makeFlowers, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface SingaRefs {
  lion: THREE.Group; lionBodyG: THREE.Group; lionHeadG: THREE.Group;
  lionJawG: THREE.Group; lionLegFL: THREE.Group; lionLegFR: THREE.Group;
  lionLegBL: THREE.Group; lionLegBR: THREE.Group; lionTailG: THREE.Group;
  lionEyeL: THREE.Mesh; lionEyeR: THREE.Mesh;
  monkey: THREE.Group; monBodyG: THREE.Group; monHeadG: THREE.Group;
  monJawG: THREE.Group; monArmL: THREE.Group; monArmR: THREE.Group;
  monLegBL: THREE.Group; monLegBR: THREE.Group; monTailG: THREE.Group;
  monEarL: THREE.Group; monEarR: THREE.Group;
  monEyeL: THREE.Mesh; monEyeR: THREE.Mesh;
  treeG: THREE.Group; canopyG: THREE.Group; branchG: THREE.Group;
  riverMat: THREE.MeshStandardMaterial; ripples: THREE.Group[]; murkG: THREE.Group;
  stones: THREE.Group[]; safeStone: THREE.Group; shiftStone: THREE.Group;
  leafG: THREE.Group;
  waiters: THREE.Group[]; waiterHeadGs: THREE.Group[];
  clouds: THREE.Group[]; flowers: THREE.Group[]; sparkles: THREE.Group;
}

const ORANGE = "#e08a2e";
const ORANGE_DARK = "#c96f1d";
const MANE = "#b45a1a";
const MON_BROWN = "#7a5230";
const MON_BROWN_DARK = "#5e3d22";
const MON_TAN = "#d9a05e";
const MON_CREAM = "#f0d0a0";

// ---------------------------------------------------------------- lion
// (build terbukti dari proyek kelinci — singa jantan bersurai)
function buildLion(): {
  root: THREE.Group;
  refs: Pick<SingaRefs, "lionBodyG" | "lionHeadG" | "lionJawG" | "lionLegFL" | "lionLegFR" | "lionLegBL" | "lionLegBR" | "lionTailG" | "lionEyeL" | "lionEyeR">;
} {
  const lion = new THREE.Group();
  const lionBodyG = new THREE.Group();
  lionBodyG.position.set(0, 1.0, 0);
  lion.add(lionBodyG);

  sph(lionBodyG, ORANGE, 0.75, [0, 0, 0], [1.5, 0.95, 0.9]);
  sph(lionBodyG, "#f2c078", 0.6, [0.2, -0.28, 0], [1.35, 0.75, 0.8]);

  const lionHeadG = new THREE.Group();
  lionHeadG.position.set(1.05, 0.5, 0);
  lionBodyG.add(lionHeadG);
  // surai: cakram pipih membingkai wajah + bola-bola rim
  sph(lionHeadG, MANE, 0.62, [-0.24, -0.03, 0], [0.5, 1.0, 1.0]);
  for (let i = 0; i < 7; i++) {
    const a = (-0.6 + i * 0.2) * Math.PI;
    sph(lionHeadG, MANE, 0.23, [-0.26, Math.sin(a) * 0.62, Math.cos(a) * 0.62]);
  }
  sph(lionHeadG, ORANGE, 0.5, [0.18, 0, 0]);
  sph(lionHeadG, "#f2c078", 0.28, [0.48, -0.12, 0], [1.2, 0.85, 0.9]);
  sph(lionHeadG, "#5a3a22", 0.075, [0.72, -0.06, 0], [1, 0.85, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(lionHeadG, 0.52, 0.16, 0.32, 0.06);
  // telinga menyembul dari surai
  sph(lionHeadG, ORANGE_DARK, 0.1, [-0.05, 0.42, 0.3], [1, 0.8, 0.6]);
  sph(lionHeadG, ORANGE_DARK, 0.1, [-0.05, 0.42, -0.3], [1, 0.8, 0.6]);
  // rahang bawah (bicara)
  const lionJawG = new THREE.Group();
  lionJawG.position.set(0.3, -0.28, 0);
  lionHeadG.add(lionJawG);
  sph(lionJawG, ORANGE_DARK, 0.2, [0.1, -0.06, 0], [1.3, 0.55, 0.9]);

  // kaki: kolom tebal + telapak besar
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.5, z);
    lionBodyG.add(g);
    cyl(g, ORANGE_DARK, 0.16, 0.13, 0.55, [0, -0.27, 0]);
    sph(g, ORANGE_DARK, 0.18, [0.05, -0.56, 0], [1.3, 0.7, 1]);
    return g;
  };
  const lionLegFL = mkLeg(0.55, 0.32);
  const lionLegFR = mkLeg(0.55, -0.32);
  const lionLegBL = mkLeg(-0.55, 0.32);
  const lionLegBR = mkLeg(-0.55, -0.32);

  // ekor + jambul
  const lionTailG = new THREE.Group();
  lionTailG.position.set(-1.05, 0.15, 0);
  lionBodyG.add(lionTailG);
  cyl(lionTailG, ORANGE, 0.07, 0.07, 0.7, [-0.3, 0.05, 0], [0, 0, 1.1]);
  sph(lionTailG, MANE, 0.16, [-0.62, 0.22, 0]);

  return { root: lion, refs: { lionBodyG, lionHeadG, lionJawG, lionLegFL, lionLegFR, lionLegBL, lionLegBR, lionTailG, lionEyeL: eyeL, lionEyeR: eyeR } };
}

// ---------------------------------------------------------------- monkey
function buildMonkey(): {
  root: THREE.Group;
  refs: Pick<SingaRefs, "monBodyG" | "monHeadG" | "monJawG" | "monArmL" | "monArmR" | "monLegBL" | "monLegBR" | "monTailG" | "monEarL" | "monEarR" | "monEyeL" | "monEyeR">;
} {
  const monkey = new THREE.Group();
  const monBodyG = new THREE.Group();
  monBodyG.position.set(0, 0.62, 0);
  monkey.add(monBodyG);

  // badan cokelat membulat + perut krem
  sph(monBodyG, MON_BROWN, 0.42, [0, 0, 0], [1.15, 1.05, 0.95]);
  sph(monBodyG, MON_CREAM, 0.3, [0.14, -0.12, 0], [1.1, 0.8, 0.85]);

  // kepala
  const monHeadG = new THREE.Group();
  monHeadG.position.set(0.42, 0.38, 0);
  monBodyG.add(monHeadG);
  sph(monHeadG, MON_BROWN, 0.32, [0, 0, 0]);
  // jambul kecil di atas kepala
  sph(monHeadG, MON_BROWN_DARK, 0.1, [-0.08, 0.3, 0], [1, 0.7, 1]);
  // wajah krem membingkai mata + moncong
  sph(monHeadG, MON_CREAM, 0.2, [0.2, 0.04, 0], [1.1, 1.05, 0.9]);
  sph(monHeadG, MON_TAN, 0.13, [0.3, -0.1, 0], [1.25, 0.75, 0.9]);
  sph(monHeadG, "#5a3a22", 0.05, [0.42, -0.07, 0], [1, 0.8, 0.9], 0.5);
  const { eyeL, eyeR } = makeEyes(monHeadG, 0.26, 0.1, 0.17, 0.05);
  // rahang bawah (bicara)
  const monJawG = new THREE.Group();
  monJawG.position.set(0.24, -0.2, 0);
  monHeadG.add(monJawG);
  sph(monJawG, MON_BROWN_DARK, 0.1, [0.05, -0.03, 0], [1.3, 0.5, 0.9]);

  // telinga bundar, pivot di pangkal
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.08, 0.22, z);
    monHeadG.add(g);
    sph(g, MON_BROWN, 0.11, [0, 0.03, z > 0 ? 0.03 : -0.03]);
    sph(g, MON_TAN, 0.06, [0.02, 0.03, z > 0 ? 0.07 : -0.07], [0.6, 1, 1]);
    return g;
  };
  const monEarL = mkEar(0.26);
  const monEarR = mkEar(-0.26);

  // lengan panjang (juga kaki depan): pivot di bahu, bisa menunjuk / tenang
  const mkArm = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.3, -0.18, z);
    monBodyG.add(g);
    cyl(g, MON_BROWN, 0.07, 0.06, 0.42, [0, -0.21, 0]);
    sph(g, MON_TAN, 0.08, [0.02, -0.44, 0], [1.2, 0.7, 1]);
    return g;
  };
  const monArmL = mkArm(0.28);
  const monArmR = mkArm(-0.28);

  // kaki belakang pendek
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.22, -0.3, z);
    monBodyG.add(g);
    cyl(g, MON_BROWN_DARK, 0.07, 0.06, 0.3, [0, -0.15, 0]);
    sph(g, MON_TAN, 0.08, [0.03, -0.3, 0], [1.3, 0.6, 1]);
    return g;
  };
  const monLegBL = mkLeg(0.24);
  const monLegBR = mkLeg(-0.24);

  // ekor panjang melengkung ke atas, pivot di pangkal
  const monTailG = new THREE.Group();
  monTailG.position.set(-0.42, 0.1, 0);
  monBodyG.add(monTailG);
  cyl(monTailG, MON_BROWN, 0.05, 0.045, 0.55, [-0.22, 0.18, 0], [0, 0, 1.0]);
  cyl(monTailG, MON_BROWN, 0.045, 0.04, 0.4, [-0.48, 0.48, 0], [0, 0, 0.35]);
  sph(monTailG, MON_BROWN_DARK, 0.06, [-0.58, 0.66, 0]);

  return { root: monkey, refs: { monBodyG, monHeadG, monJawG, monArmL, monArmR, monLegBL, monLegBR, monTailG, monEarL, monEarR, monEyeL: eyeL, monEyeR: eyeR } };
}

// ---------------------------------------------------------------- hewan kecil menunggu
function buildWaiter(kind: "deer" | "rabbit" | "bird"): { root: THREE.Group; headG: THREE.Group } {
  const root = new THREE.Group();
  const bodyG = new THREE.Group();
  bodyG.position.set(0, 0.3, 0);
  root.add(bodyG);
  const headG = new THREE.Group();
  if (kind === "deer") {
    sph(bodyG, "#c98f4e", 0.26, [0, 0, 0], [1.4, 0.9, 0.85]);
    sph(bodyG, "#ecd3a8", 0.18, [0.1, -0.1, 0], [1.2, 0.7, 0.8]);
    headG.position.set(0.38, 0.18, 0);
    bodyG.add(headG);
    sph(headG, "#c98f4e", 0.18, [0, 0, 0]);
    sph(headG, "#ecd3a8", 0.1, [0.14, -0.05, 0], [1.2, 0.75, 0.9]);
    sph(headG, "#5a3a22", 0.04, [0.24, -0.03, 0], [1, 0.8, 0.9], 0.5);
    makeEyes(headG, 0.1, 0.06, 0.11, 0.035);
    // tanduk kecil
    cone(headG, "#8a5a36", 0.03, 0.22, [-0.06, 0.22, 0.08], [0, 0, -0.25]);
    cone(headG, "#8a5a36", 0.03, 0.22, [-0.06, 0.22, -0.08], [0, 0, -0.25]);
    // kaki ramping
    [[0.2, 0.12], [0.2, -0.12], [-0.22, 0.12], [-0.22, -0.12]].forEach(([x, z]) => {
      cyl(bodyG, "#a8763a", 0.035, 0.03, 0.3, [x, -0.3, z]);
    });
  } else if (kind === "rabbit") {
    sph(bodyG, "#e8dcc8", 0.24, [0, 0, 0], [1.3, 0.95, 0.9]);
    headG.position.set(0.3, 0.16, 0);
    bodyG.add(headG);
    sph(headG, "#e8dcc8", 0.17, [0, 0, 0]);
    sph(headG, "#fff8ea", 0.09, [0.1, -0.05, 0], [1.2, 0.8, 0.9]);
    sph(headG, "#d98a94", 0.03, [0.18, -0.03, 0], [1, 0.8, 0.9], 0.5);
    makeEyes(headG, 0.08, 0.05, 0.1, 0.03);
    // telinga panjang
    sph(headG, "#e8dcc8", 0.07, [-0.04, 0.26, 0.07], [0.55, 1.9, 0.4]);
    sph(headG, "#e8dcc8", 0.07, [-0.04, 0.26, -0.07], [0.55, 1.9, 0.4]);
    sph(bodyG, "#ffffff", 0.08, [-0.3, 0.05, 0]);
  } else {
    // burung kecil biru
    sph(bodyG, "#4a90d9", 0.2, [0, 0, 0], [1.2, 1, 0.95]);
    sph(bodyG, "#7db8e8", 0.14, [0.08, -0.08, 0], [1.1, 0.8, 0.9]);
    headG.position.set(0.22, 0.14, 0);
    bodyG.add(headG);
    sph(headG, "#4a90d9", 0.13, [0, 0, 0]);
    cone(headG, "#f2a541", 0.04, 0.12, [0.16, -0.02, 0], [0, 0, -Math.PI / 2]);
    makeEyes(headG, 0.07, 0.04, 0.08, 0.028);
    // sayap
    sph(bodyG, "#3570b0", 0.12, [-0.05, 0.02, 0.16], [1.1, 0.8, 0.4]);
    sph(bodyG, "#3570b0", 0.12, [-0.05, 0.02, -0.16], [1.1, 0.8, 0.4]);
    cyl(bodyG, "#f2a541", 0.02, 0.02, 0.14, [0.05, -0.26, 0.04]);
    cyl(bodyG, "#f2a541", 0.02, 0.02, 0.14, [0.05, -0.26, -0.04]);
  }
  return { root, headG };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): SingaRefs {
  const g = scene as unknown as THREE.Group;

  // padang rumput hijau cerah + bukit lembut di horizon
  groundDisc(g, "#58b368");
  const hills: [number, number, number, string][] = [
    [-24, -22, 22, "#4d9e3f"], [8, -25, 26, "#57a83e"], [30, -21, 19, "#63b84a"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.82, z], [1, 0.55, 1], 1);
    h.castShadow = false;
  });

  // ---- sungai: pita biru membentang sepanjang sumbu x (z -3.9..-0.7)
  const riverMat = smat("#4aa8d8", 0.35);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(34, 3.2, 1, 1), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.03, -2.3);
  river.receiveShadow = true;
  g.add(river);
  // tepian berpasir di kedua sisi sungai
  const bankMat = smat("#d9b078", 1);
  [[-0.55], [-3.95]].forEach(([z]) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(34, 0.55, 1, 1), bankMat);
    b.rotation.x = -Math.PI / 2;
    b.position.set(0, 0.025, z);
    b.receiveShadow = true;
    g.add(b);
  });
  // riak: cincin pipih transparan di atas air (skala digerakkan story.ts)
  const ripples: THREE.Group[] = [];
  const r = rng(71);
  const rippleSpots: [number, number][] = [
    [-3.5, -2.0], [-0.5, -3.0], [1.5, -1.8], [3.8, -3.1], [-5.5, -2.8], [5.5, -2.2],
  ];
  rippleSpots.forEach(([x, z]) => {
    const rg = new THREE.Group();
    rg.position.set(x, 0.05, z);
    g.add(rg);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 28),
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#dff3ff"), roughness: 0.4, transparent: true, opacity: 0.55, flatShading: false }));
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    rg.add(ring);
    rg.userData.phase = r() * Math.PI * 2;
    rg.userData.base = 0.7 + r() * 0.6;
    ripples.push(rg);
  });

  // ---- batu pijakan di sungai (z -2.4): bergeser, aman, kanan
  const stones: THREE.Group[] = [];
  const stoneSpots: [number, number][] = [[-1.3, 0.62], [0.7, 0.55], [2.6, 0.6]];
  stoneSpots.forEach(([x, s], i) => {
    const sg = new THREE.Group();
    sg.position.set(x, 0, -2.4);
    g.add(sg);
    const st = sph(sg, i === 1 ? "#9a9aa2" : "#8d8d94", 0.55 * s, [0, 0.12, 0], [1.25, 0.45, 1], 0.85);
    st.castShadow = true;
    // batu kecil penyeimbang di samping
    sph(sg, "#7d7d84", 0.22, [0.55 * s, 0.05, 0.25], [1.2, 0.4, 1], 0.9).castShadow = false;
    sg.userData.baseX = x;
    stones.push(sg);
  });
  const shiftStone = stones[0];
  const safeStone = stones[1];

  // gumpalan keruh di atas air (muncul saat air keruh, story.ts)
  const murkG = new THREE.Group();
  g.add(murkG);
  const murkSpots: [number, number, number][] = [
    [-2.5, -2.0, 1.2], [0.2, -3.0, 1.5], [2.8, -1.9, 1.1], [4.5, -2.8, 1.3],
    [-4.2, -2.9, 1.1], [1.6, -2.6, 0.9],
  ];
  murkSpots.forEach(([x, z, s]) => {
    sph(murkG, "#8a9a6a", 0.5 * s, [x, 0.06, z], [1.4, 0.25, 1], 1).castShadow = false;
  });
  murkG.scale.setScalar(0.001);

  // ---- daun penanda di batu aman (muncul giliran 5) — di tepi depan batu
  // supaya tidak tertutup kaki Monyet yang berdiri di batu
  const leafG = new THREE.Group();
  leafG.position.set(1.08, 0.34, -2.12);
  g.add(leafG);
  sph(leafG, "#3f9e4d", 0.26, [0, 0, 0], [1.7, 0.22, 0.9], 0.6);
  sph(leafG, "#57b368", 0.17, [0.05, 0.03, 0], [1.5, 0.2, 0.8], 0.6);
  cyl(leafG, "#2e7d32", 0.025, 0.025, 0.26, [-0.36, 0.01, 0], [0, 0, Math.PI / 2 - 0.3]);
  leafG.scale.setScalar(0.001);

  // ---- batu-batu tepi sungai + semak
  const br = rng(91);
  const bankStones: [number, number, number][] = [
    [-4.2, -0.6, 0.5], [-3.4, -3.9, 0.4], [3.9, -0.7, 0.45], [5.2, -4.0, 0.55],
    [-5.8, -1.2, 0.6], [1.8, -4.1, 0.4], [-1.9, -4.0, 0.5],
  ];
  bankStones.forEach(([x, z, s]) => {
    sph(g, "#9a9aa2", 0.5 * s, [x, 0.08, z], [1.3, 0.5, 1], 0.95);
  });
  makeBush(g, -6.8, -3.4, 1.1);
  makeBush(g, 7.2, -0.6, 1.0);

  // ---- pohon rindang kanan + dahan tempat Monyet duduk
  const treeG = makeTree(g, 4.2, -1.2, 1.2, "#8a5a36", ["#3f9e4d", "#359046", "#49ac57"]);
  // kanopi terpisah untuk goyangan daun — gugus daun tambahan di sisi
  // kanopi makeTree (posisi sengaja mengimbangi, tidak berimpit)
  const canopyG = new THREE.Group();
  canopyG.position.set(4.2, 0, -1.2);
  g.add(canopyG);
  sph(canopyG, "#49ac57", 1.1, [1.7, 3.6, 0.7]);
  sph(canopyG, "#3f9e4d", 1.0, [-1.7, 4.2, 0.5]);
  sph(canopyG, "#4fb35a", 0.9, [0.4, 4.6, 0.9]);
  sph(canopyG, "#359046", 0.85, [-0.9, 3.4, -0.9]);
  // dahan menjulur ke kiri (ke arah sungai) — tempat Monyet duduk;
  // dipanjangkan sampai ujung x 1.5 supaya Monyet duduk DI LUAR kanopi,
  // berlatar langit, bukan menyatu dengan daun
  const branchG = new THREE.Group();
  branchG.position.set(4.2, 2.6, -1.2);
  g.add(branchG);
  cyl(branchG, "#8a5a36", 0.14, 0.18, 2.8, [-1.3, 0.1, 0], [0, 0, Math.PI / 2 - 0.12]);
  sph(branchG, "#49ac57", 0.35, [-2.5, 0.35, 0.2], [1.2, 0.7, 1]);
  sph(branchG, "#3f9e4d", 0.3, [-2.2, 0.3, -0.25], [1.2, 0.7, 1]);

  // pohon kecil kiri jauh + semak bunga
  makeTree(g, -9.5, -6, 1.1, "#8a5a36", ["#3f9e4d", "#359046", "#49ac57"]);
  makeTree(g, -13, -3, 0.9, "#8a5a36", ["#3f9e4d", "#359046", "#49ac57"]);

  // rumput + bunga di luar pita sungai (hindari z -4.2..-0.4);
  // petak depan lebih rapat supaya latar depan tidak kosong
  makeGrassTufts(g, 40, 31, -7, 7.5, -0.3, 4);
  makeGrassTufts(g, 30, 33, -7, 7.5, -6, -4.4);
  makeGrassTufts(g, 38, 41, -6, 7, 1.8, 4.8);
  const flowers = makeFlowers(g, 30, 32, -6.5, 7, -0.2, 3.5,
    (x, z) => z > -0.3);
  const fgFlowers = makeFlowers(g, 14, 43, -5, 6, 2.6, 4.8);

  const clouds = makeClouds(g, [
    [-6, 7.5, -16, 1.5], [4, 8.5, -18, 1.8], [7, 6.8, -14, 1.1], [-12, 8.0, -18, 1.4],
  ]);
  makeSun(g, -6.5, 7.0, -20, 2.4, "#ffcf5e");

  // kilau penutup di sekitar pasangan
  const sparkles = makeSparkles(g, [
    [-1.2, 1.8, 0.6], [-0.4, 2.2, 0.4], [0.4, 1.6, 0.6], [1.2, 2.0, 0.4],
    [-1.8, 1.2, 0.8], [0.8, 2.6, 0.2],
  ], 1.2);

  // ---- hewan-hewan kecil menunggu di kejauhan kanan
  const waiters: THREE.Group[] = [];
  const waiterHeadGs: THREE.Group[] = [];
  const waiterSpots: ["deer" | "rabbit" | "bird", number, number][] = [
    ["deer", 4.5, -0.8], ["rabbit", 4.7, -1.2], ["bird", 4.1, -0.5],
  ];
  waiterSpots.forEach(([kind, x, z]) => {
    const w = buildWaiter(kind);
    w.root.position.set(x, 0, z);
    w.root.scale.setScalar(0.75);
    w.root.rotation.y = Math.PI * 1.15; // menghadap kiri-depan (ke sungai)
    g.add(w.root);
    waiters.push(w.root);
    waiterHeadGs.push(w.headG);
  });

  // ---- tokoh
  const lion = buildLion();
  lion.root.scale.setScalar(1.0);
  g.add(lion.root);
  const monkey = buildMonkey();
  monkey.root.scale.setScalar(0.9);
  g.add(monkey.root);

  return {
    lion: lion.root, ...lion.refs,
    monkey: monkey.root, ...monkey.refs,
    treeG, canopyG, branchG,
    riverMat, ripples, murkG,
    stones, safeStone, shiftStone,
    leafG,
    waiters, waiterHeadGs,
    clouds, flowers: [...flowers, ...fgFlowers], sparkles,
  };
}
