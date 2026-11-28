import * as THREE from "three";
import {
  smat, sph, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeBush,
  makeFlowers, makeGrassTufts, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface JerapahRefs {
  giraffe: THREE.Group; girBodyG: THREE.Group; girNeckG: THREE.Group;
  girHeadG: THREE.Group; girJawG: THREE.Group;
  girEarL: THREE.Group; girEarR: THREE.Group;
  girLegFL: THREE.Group; girLegFR: THREE.Group;
  girLegBL: THREE.Group; girLegBR: THREE.Group;
  girTailG: THREE.Group; girEyeL: THREE.Mesh; girEyeR: THREE.Mesh;
  kangaroo: THREE.Group; rooBodyG: THREE.Group; rooHeadG: THREE.Group;
  rooJawG: THREE.Group; rooEarL: THREE.Group; rooEarR: THREE.Group;
  rooArmL: THREE.Group; rooArmR: THREE.Group;
  rooLegL: THREE.Group; rooLegR: THREE.Group;
  rooTailG: THREE.Group; rooEyeL: THREE.Mesh; rooEyeR: THREE.Mesh;
  branchG: THREE.Group; topLeavesG: THREE.Group;
  leafGs: THREE.Group[]; caughtLeafG: THREE.Group;
  sharedLeafGs: THREE.Group[];
  friends: THREE.Group[]; friendHeadGs: THREE.Group[];
  grassSway: THREE.Group[];
  clouds: THREE.Group[]; flowers: THREE.Group[]; sparkles: THREE.Group;
}

const YELLOW = "#f2c14e";
const BROWN = "#8a5a2e";
const BROWN_DARK = "#6b4423";
const ROO = "#c07a3e";
const ROO_DARK = "#8a5a2e";
const ROO_CREAM = "#f2ddba";
const LEAF = "#3f9e4d";
const LEAF_BRIGHT = "#57c465";
const LEAF_DARK = "#2e7d32";

// ---------------------------------------------------------------- giraffe
// (pola KucingJerapah yang terbukti: leher panjang + totol = jerapah terbaca)
function buildGiraffe(): {
  root: THREE.Group;
  refs: Pick<JerapahRefs, "girBodyG" | "girNeckG" | "girHeadG" | "girJawG"
    | "girEarL" | "girEarR" | "girLegFL" | "girLegFR" | "girLegBL" | "girLegBR"
    | "girTailG" | "girEyeL" | "girEyeR">;
} {
  const giraffe = new THREE.Group();
  const girBodyG = new THREE.Group();
  girBodyG.position.set(0, 2.0, 0);
  giraffe.add(girBodyG);

  // body: yellow ellipsoid + cream belly + brown spots (seeded, on surface)
  sph(girBodyG, YELLOW, 0.85, [0, 0, 0], [1.6, 0.95, 0.8]);
  sph(girBodyG, "#fbe3a1", 0.6, [0.1, -0.35, 0], [1.4, 0.7, 0.75]);
  const sr = rng(7);
  for (let i = 0; i < 11; i++) {
    const a = sr() * Math.PI * 2;
    const b = (sr() - 0.5) * 1.1;
    const x = Math.cos(a) * 1.15;
    const y = 0.15 + Math.sin(b) * 0.55;
    const z = Math.sin(a) * 0.62;
    sph(girBodyG, BROWN, 0.13 + sr() * 0.08, [x, y, z], [1, 0.75, 0.35]);
  }

  // neck: long, pivoted at the front-top of the body so it can bow/stretch
  const girNeckG = new THREE.Group();
  girNeckG.position.set(0.95, 0.45, 0);
  girBodyG.add(girNeckG);
  cyl(girNeckG, YELLOW, 0.22, 0.3, 2.0, [0, 1.0, 0]);
  // mane: short dark ridge along the back of the neck
  for (let i = 0; i < 5; i++) {
    sph(girNeckG, BROWN_DARK, 0.11, [-0.24, 0.35 + i * 0.36, 0], [0.6, 1, 0.5]);
  }
  // neck spots
  sph(girNeckG, BROWN, 0.1, [0.14, 0.8, 0.14], [1, 1, 0.4]);
  sph(girNeckG, BROWN, 0.09, [0.15, 1.4, -0.13], [1, 1, 0.4]);
  sph(girNeckG, BROWN, 0.08, [-0.1, 1.8, 0.12], [1, 1, 0.4]);

  // head: small, elongated, at the top of the neck
  const girHeadG = new THREE.Group();
  girHeadG.position.set(0, 2.05, 0);
  girNeckG.add(girHeadG);
  sph(girHeadG, YELLOW, 0.3, [0, 0, 0], [1.6, 0.95, 0.85]);
  sph(girHeadG, "#c98f4e", 0.18, [0.38, -0.08, 0], [1.3, 0.8, 0.9]);
  sph(girHeadG, "#5a3d24", 0.05, [0.55, -0.04, 0], [1, 0.8, 0.8], 0.5);
  const { eyeL, eyeR } = makeEyes(girHeadG, 0.28, 0.12, 0.18, 0.055);
  // ossicones: two little knobs on top
  cyl(girHeadG, BROWN_DARK, 0.035, 0.03, 0.26, [-0.05, 0.32, 0.12], [0, 0, 0.15]);
  cyl(girHeadG, BROWN_DARK, 0.035, 0.03, 0.26, [-0.05, 0.32, -0.12], [0, 0, 0.15]);
  sph(girHeadG, BROWN_DARK, 0.06, [-0.09, 0.46, 0.12]);
  sph(girHeadG, BROWN_DARK, 0.06, [-0.09, 0.46, -0.12]);
  // lower jaw (speaking)
  const girJawG = new THREE.Group();
  girJawG.position.set(0.3, -0.22, 0);
  girHeadG.add(girJawG);
  sph(girJawG, "#b97f3e", 0.12, [0.05, -0.03, 0], [1.4, 0.5, 0.9]);

  // ears: flattened, sticking out sideways
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.12, 0.14, z);
    girHeadG.add(g);
    sph(g, YELLOW, 0.14, [0, 0, z > 0 ? 0.08 : -0.08], [1.2, 0.45, 0.7]);
    sph(g, BROWN, 0.07, [0, 0, z > 0 ? 0.14 : -0.14], [1, 0.4, 0.6]);
    return g;
  };
  const girEarL = mkEar(0.3);
  const girEarR = mkEar(-0.3);

  // legs: long columns + dark hooves, pivot at the hip
  const mkLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.55, z);
    girBodyG.add(g);
    sph(g, YELLOW, 0.17, [0, -0.08, 0], [1, 1.4, 1]);
    cyl(g, YELLOW, 0.11, 0.09, 1.4, [0, -0.7, 0]);
    sph(g, "#4a3524", 0.11, [0, -1.4, 0], [1.2, 0.7, 1.2]);
    return g;
  };
  const girLegFL = mkLeg(0.75, 0.35);
  const girLegFR = mkLeg(0.75, -0.35);
  const girLegBL = mkLeg(-0.75, 0.35);
  const girLegBR = mkLeg(-0.75, -0.35);

  // tail with dark tuft
  const girTailG = new THREE.Group();
  girTailG.position.set(-1.3, 0.1, 0);
  girBodyG.add(girTailG);
  cyl(girTailG, YELLOW, 0.05, 0.04, 0.9, [-0.08, -0.4, 0], [0, 0, 0.25]);
  sph(girTailG, BROWN_DARK, 0.11, [-0.2, -0.85, 0], [0.8, 1.5, 0.8]);

  return {
    root: giraffe,
    refs: {
      girBodyG, girNeckG, girHeadG, girJawG, girEarL, girEarR,
      girLegFL, girLegFR, girLegBL, girLegBR, girTailG,
      girEyeL: eyeL, girEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- kangaroo
function buildKangaroo(): {
  root: THREE.Group;
  refs: Pick<JerapahRefs, "rooBodyG" | "rooHeadG" | "rooJawG"
    | "rooEarL" | "rooEarR" | "rooArmL" | "rooArmR"
    | "rooLegL" | "rooLegR" | "rooTailG" | "rooEyeL" | "rooEyeR">;
} {
  const roo = new THREE.Group();
  const rooBodyG = new THREE.Group();
  rooBodyG.position.set(0, 0.95, 0);
  roo.add(rooBodyG);

  // body: upright reddish-brown ellipsoid + cream belly + pouch
  sph(rooBodyG, ROO, 0.55, [0, 0, 0], [0.85, 1.25, 0.75]);
  sph(rooBodyG, ROO_CREAM, 0.4, [0.18, -0.12, 0], [0.8, 1.1, 0.7]);
  sph(rooBodyG, "#e8c99a", 0.22, [0.3, -0.38, 0], [0.9, 0.55, 0.7]);

  // head: rounded, at the top-front of the body
  const rooHeadG = new THREE.Group();
  rooHeadG.position.set(0.32, 0.78, 0);
  rooBodyG.add(rooHeadG);
  sph(rooHeadG, ROO, 0.32, [0, 0, 0], [1.2, 1, 0.9]);
  sph(rooHeadG, ROO_CREAM, 0.18, [0.26, -0.1, 0], [1.1, 0.75, 0.85]);
  sph(rooHeadG, "#4a3524", 0.05, [0.48, -0.04, 0], [1, 0.8, 0.8], 0.5);
  const { eyeL, eyeR } = makeEyes(rooHeadG, 0.16, 0.1, 0.17, 0.05);
  // lower jaw (speaking)
  const rooJawG = new THREE.Group();
  rooJawG.position.set(0.22, -0.2, 0);
  rooHeadG.add(rooJawG);
  sph(rooJawG, "#a86a34", 0.1, [0.04, -0.02, 0], [1.3, 0.5, 0.9]);

  // ears: tall, upright, flattened — ciri kanguru yang paling terbaca
  const mkEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.08, 0.28, z);
    rooHeadG.add(g);
    cone(g, ROO, 0.1, 0.62, [0, 0.28, 0]);
    const inner = cone(g, "#e8b48a", 0.05, 0.36, [0.02, 0.26, 0]);
    inner.scale.set(1, 1, 0.4);
    const outer = g.children[0] as THREE.Mesh;
    outer.scale.set(1, 1, 0.45);
    g.rotation.x = z > 0 ? -0.1 : 0.1;
    return g;
  };
  const rooEarL = mkEar(0.18);
  const rooEarR = mkEar(-0.18);

  // arms: small, tucked at the chest, pivot at the shoulder
  const mkArm = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.32, 0.2, z);
    rooBodyG.add(g);
    cyl(g, ROO, 0.05, 0.045, 0.34, [0.05, -0.14, 0], [0, 0, -0.5]);
    sph(g, ROO_DARK, 0.07, [0.14, -0.3, 0], [1.2, 0.8, 1]);
    return g;
  };
  const rooArmL = mkArm(0.3);
  const rooArmR = mkArm(-0.3);

  // hind legs: big thighs + LONG flat hind feet — ciri kanguru kedua.
  // Kaki HARUS menapak di tanah: pinggul y 0.45, telapak di y ≈ 0.03.
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.05, -0.5, z);
    rooBodyG.add(g);
    sph(g, ROO, 0.26, [0, -0.05, 0], [1.15, 1.25, 0.7]);
    cyl(g, ROO, 0.09, 0.08, 0.35, [0.08, -0.28, 0], [0, 0, -0.3]);
    // long hind foot pointing forward (+x), flat on the ground
    sph(g, ROO_DARK, 0.14, [0.32, -0.42, 0], [2.1, 0.35, 0.85]);
    return g;
  };
  const rooLegL = mkLeg(0.26);
  const rooLegR = mkLeg(-0.26);

  // tail: long, thick at the base, tapering, trailing on the ground behind.
  // Sumbu silinder diputar ~2.0 rad supaya ujungnya turun ke tanah, bukan
  // terangkat ke udara (perbaikan ronde 1: ekor sempat menunjuk ke atas).
  const rooTailG = new THREE.Group();
  rooTailG.position.set(-0.42, -0.3, 0);
  rooBodyG.add(rooTailG);
  cyl(rooTailG, ROO, 0.12, 0.05, 1.15, [-0.5, -0.25, 0], [0, 0, 2.0]);
  sph(rooTailG, ROO_DARK, 0.07, [-1.02, -0.48, 0], [1, 1, 1]);

  return {
    root: roo,
    refs: {
      rooBodyG, rooHeadG, rooJawG, rooEarL, rooEarR,
      rooArmL, rooArmR, rooLegL, rooLegR, rooTailG,
      rooEyeL: eyeL, rooEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- friends
// Tiga teman kecil menunggu di bawah pohon (kelinci, burung kecil, rubah
// kecil) — sengaja mungil dan sederhana supaya tidak tertukar dengan tokoh.
function buildFriends(): { friends: THREE.Group[]; friendHeadGs: THREE.Group[] } {
  const friends: THREE.Group[] = [];
  const friendHeadGs: THREE.Group[] = [];
  const mk = (x: number, z: number, body: string, belly: string, kind: "rabbit" | "bird" | "fox") => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(0.75);
    const bodyG = new THREE.Group();
    bodyG.position.set(0, 0.42, 0);
    g.add(bodyG);
    sph(bodyG, body, 0.4, [0, 0, 0], [1.1, 1, 0.9]);
    sph(bodyG, belly, 0.26, [0.16, -0.1, 0], [1, 0.8, 0.85]);
    const headG = new THREE.Group();
    headG.position.set(0.38, 0.32, 0);
    bodyG.add(headG);
    sph(headG, body, 0.28, [0, 0, 0]);
    makeEyes(headG, 0.16, 0.08, 0.15, 0.045);
    if (kind === "rabbit") {
      cone(headG, body, 0.08, 0.55, [-0.05, 0.5, 0.12]);
      cone(headG, body, 0.08, 0.55, [-0.05, 0.5, -0.12]);
    } else if (kind === "bird") {
      cone(headG, "#f2b234", 0.07, 0.3, [0.36, -0.02, 0], [0, 0, -Math.PI / 2]);
      sph(headG, "#7fc4de", 0.12, [-0.1, 0.2, 0], [1.4, 0.5, 0.8]);
      cone(headG, "#5a9ec4", 0.05, 0.3, [-0.28, -0.05, 0], [0, 0, Math.PI / 2 + 0.3]);
    } else {
      cone(headG, body, 0.1, 0.28, [-0.02, 0.34, 0.14]);
      cone(headG, body, 0.1, 0.28, [-0.02, 0.34, -0.14]);
      sph(headG, belly, 0.14, [0.22, -0.06, 0], [1, 0.7, 0.85]);
    }
    friends.push(g);
    friendHeadGs.push(headG);
    return g;
  };
  // Teman-teman menunggu DI BAWAH POHON (z negatif, dekat batang) — ronde 1
  // mereka duduk di depan kanguru (z 2.3) sehingga menumpuk jadi bola-bola.
  mk(0.0, -1.2, "#e8e0d0", "#ffffff", "rabbit");
  mk(1.0, -1.5, "#7fb3d5", "#cfe8f7", "bird");
  mk(2.0, -1.2, "#d97b2e", "#fbe3a1", "fox");
  return { friends, friendHeadGs };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): JerapahRefs {
  const g = scene as unknown as THREE.Group;

  // sabana: tanah kuning-hijau kering + bukit lembut di belakang
  groundDisc(g, "#a3c256");
  const hills: [number, number, number, string][] = [
    [-22, -22, 20, "#8fb84a"], [8, -24, 24, "#96bd4f"], [28, -20, 18, "#a8c95a"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.82, z], [1, 0.55, 1], 1);
    h.castShadow = false;
  });

  // ---- pohon akasia: batang tinggi + tajuk datar khas akasia --------------
  // Tajuk dibuat dari 3 gumpal bertingkat (bukan satu piringan) supaya
  // siluetnya bergelombang, bukan piring terbang (perbaikan ronde 1).
  const acaciaG = new THREE.Group();
  acaciaG.position.set(0.9, 0, -3.8);
  g.add(acaciaG);
  cyl(acaciaG, "#7a4a28", 0.17, 0.28, 5.2, [0, 2.6, 0], [0, 0, 0.05]);
  cyl(acaciaG, "#6e4526", 0.1, 0.14, 1.6, [0.5, 5.4, 0], [0, 0, -0.7]);
  cyl(acaciaG, "#6e4526", 0.09, 0.12, 1.4, [-0.5, 5.3, 0], [0, 0, 0.8]);
  // tajuk datar (payung) — 3 gumpal bertingkat dengan tinggi berbeda supaya
  // siluet atas bergelombang, bukan satu piringan mulus (perbaikan ronde 2)
  sph(acaciaG, LEAF, 1.3, [0.3, 5.75, 0], [1.1, 0.45, 0.95], 1);
  sph(acaciaG, LEAF_DARK, 0.9, [-1.1, 6.05, -0.2], [1.0, 0.4, 0.9], 1);
  sph(acaciaG, LEAF_BRIGHT, 0.9, [1.5, 5.95, 0.2], [1.0, 0.4, 0.9], 1);
  sph(acaciaG, LEAF_BRIGHT, 0.6, [0.4, 6.45, -0.3], [1.2, 0.4, 1], 1);

  // ranting yang patah (line 2): menjulur dari puncak batang ke arah
  // jerapah, ujungnya membawa gugus daun tertinggi
  const branchG = new THREE.Group();
  branchG.position.set(0.9, 5.2, -3.8);
  g.add(branchG);
  cyl(branchG, "#6e4526", 0.07, 0.1, 1.7, [-0.75, 0.35, 0.35], [0, 0, 1.15]);
  const topLeavesG = new THREE.Group();
  topLeavesG.position.set(-1.5, 0.72, 0.7);
  branchG.add(topLeavesG);
  sph(topLeavesG, LEAF_BRIGHT, 0.42, [0, 0, 0], [1.3, 0.6, 1], 0.7);
  sph(topLeavesG, LEAF, 0.3, [0.3, 0.12, 0.15], [1.2, 0.6, 1], 0.7);
  sph(topLeavesG, "#7ed67f", 0.26, [-0.28, 0.1, -0.12], [1.2, 0.6, 1], 0.55);

  // daun-daun yang jatuh berserakan (line 2): mulai di ujung ranting,
  // berakhir tersebar di tanah di bawah pohon
  const leafGs: THREE.Group[] = [];
  const lr = rng(41);
  const LEAF_START: [number, number, number] = [-0.6, 5.9, -3.1];
  for (let i = 0; i < 8; i++) {
    const lg = new THREE.Group();
    lg.position.set(...LEAF_START);
    lg.userData.bx = LEAF_START[0] + (lr() - 0.5) * 0.4;
    lg.userData.by = LEAF_START[1] + (lr() - 0.5) * 0.3;
    lg.userData.bz = LEAF_START[2] + (lr() - 0.5) * 0.4;
    lg.userData.ex = -1.2 + lr() * 2.6;
    lg.userData.ez = -2.2 + lr() * 2.4;
    lg.userData.phase = lr() * Math.PI * 2;
    lg.userData.spin = 2 + lr() * 3;
    lg.visible = false;
    g.add(lg);
    const col = i % 3 === 0 ? LEAF_BRIGHT : i % 3 === 1 ? LEAF : "#57a83e";
    sph(lg, col, 0.16, [0, 0, 0], [1.5, 0.35, 1], 0.7);
    sph(lg, "#7ed67f", 0.09, [0.1, 0.04, 0], [1.4, 0.35, 0.9], 0.6);
    leafGs.push(lg);
  }

  // semak + rumput sabana
  makeBush(g, -5.6, -2.2, 1.2);
  makeBush(g, 5.8, -2.6, 1.0);
  makeBush(g, -6.4, 2.8, 0.9);
  makeGrassTufts(g, 55, 31, -7, 7.5, -3, 4);
  const flowers = makeFlowers(g, 36, 32, -6.5, 7, -2.5, 3.5,
    (x, z) => Math.abs(z - 0.9) < 0.5 && x > -4 && x < 4.5);

  // rumput bergoyang (visible ambient): rumpun kerucut tipis, digoyang story
  const grassSway: THREE.Group[] = [];
  const gr = rng(53);
  for (let i = 0; i < 14; i++) {
    const gg = new THREE.Group();
    const x = -6.5 + gr() * 13;
    const z = -2.5 + gr() * 5.5;
    gg.position.set(x, 0, z);
    gg.userData.phase = gr() * Math.PI * 2;
    g.add(gg);
    cone(gg, "#63b84a", 0.09, 0.55, [0, 0.26, 0]);
    cone(gg, "#57a83e", 0.07, 0.45, [0.14, 0.2, 0.06], [0, 0, -0.15]);
    cone(gg, "#7ed67f", 0.07, 0.5, [-0.12, 0.22, -0.05], [0, 0, 0.18]);
    grassSway.push(gg);
  }

  // rumput latar depan (z besar = dekat kamera, mengisi bawah bingkai)
  for (let i = 0; i < 6; i++) {
    const gg = new THREE.Group();
    const x = -5.5 + gr() * 11;
    const z = 3.2 + gr() * 1.4;
    gg.position.set(x, 0, z);
    gg.scale.setScalar(1.5);
    gg.userData.phase = gr() * Math.PI * 2;
    g.add(gg);
    cone(gg, "#63b84a", 0.09, 0.55, [0, 0.26, 0]);
    cone(gg, "#57a83e", 0.07, 0.45, [0.14, 0.2, 0.06], [0, 0, -0.15]);
    cone(gg, "#7ed67f", 0.07, 0.5, [-0.12, 0.22, -0.05], [0, 0, 0.18]);
    grassSway.push(gg);
  }

  // langit pagi: awan + matahari kiri atas
  const clouds = makeClouds(g, [
    [-11, 8.5, -16, 1.4], [10, 9.5, -20, 1.4], [15, 8.5, -16, 1.0], [-19, 8.5, -18, 1.3],
    [-11, 8.0, -14, 1.0], [6, 7.8, -14, 1.1],
  ]);
  makeSun(g, -13.5, 8.5, -22, 1.9, "#fff3c4");

  // kilau penutup (line 5), di sekitar pasangan + teman-teman
  const sparkles = makeSparkles(g, [
    [-1.6, 3.2, 0.6], [-0.6, 2.6, 1.0], [0.8, 2.2, 1.2],
    [1.6, 1.6, 2.0], [0.2, 3.6, 0.4], [2.4, 1.4, 2.2],
  ], 1.1);

  const gir = buildGiraffe();
  gir.root.position.set(-2.4, 0, 0.4);
  g.add(gir.root);

  const roo = buildKangaroo();
  roo.root.position.set(1.7, 0, 1.3);
  g.add(roo.root);

  // daun yang ditangkap jerapah di udara (line 5): menempel di mulut
  const caughtLeafG = new THREE.Group();
  caughtLeafG.position.set(0.62, -0.12, 0);
  caughtLeafG.visible = false;
  gir.refs.girHeadG.add(caughtLeafG);
  sph(caughtLeafG, LEAF_BRIGHT, 0.16, [0, 0, 0], [1.5, 0.35, 1], 0.7);
  sph(caughtLeafG, LEAF, 0.1, [0.12, 0.03, 0], [1.4, 0.35, 0.9], 0.7);

  // daun terbagi untuk teman-teman (penutup): muncul di dekat mereka
  const sharedLeafGs: THREE.Group[] = [];
  [[0.1, -0.9], [1.9, -0.9]].forEach(([x, z]) => {
    const sg = new THREE.Group();
    sg.position.set(x, 0.12, z);
    sg.visible = false;
    g.add(sg);
    sph(sg, LEAF_BRIGHT, 0.15, [0, 0, 0], [1.5, 0.35, 1], 0.7);
    sharedLeafGs.push(sg);
  });

  const { friends, friendHeadGs } = buildFriends();
  friends.forEach((fr) => g.add(fr));

  return {
    giraffe: gir.root, ...gir.refs,
    kangaroo: roo.root, ...roo.refs,
    branchG, topLeavesG,
    leafGs, caughtLeafG, sharedLeafGs,
    friends, friendHeadGs,
    grassSway,
    clouds, flowers, sparkles,
  };
}
