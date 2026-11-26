import * as THREE from "three";
import {
  smat, smatT, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface PenguinRefs {
  penguin: THREE.Group; penguinBodyG: THREE.Group; penguinHeadG: THREE.Group;
  penguinBeakLowG: THREE.Group;
  penguinFlipL: THREE.Group; penguinFlipR: THREE.Group;
  penguinFootL: THREE.Group; penguinFootR: THREE.Group;
  penguinTailG: THREE.Group; penguinEyeL: THREE.Mesh; penguinEyeR: THREE.Mesh;
  shrimp: THREE.Group; shrimpBodyG: THREE.Group; shrimpHeadG: THREE.Group;
  shrimpJawG: THREE.Group; shrimpTailG: THREE.Group;
  shrimpClawL: THREE.Group; shrimpClawR: THREE.Group;
  shrimpAntL: THREE.Mesh; shrimpAntR: THREE.Mesh;
  shrimpEyeL: THREE.Mesh; shrimpEyeR: THREE.Mesh;
  bubbles: THREE.Group; bubbleMeshes: THREE.Mesh[];
  colony: THREE.Group[]; colonyHeadGs: THREE.Group[];
  iceChunks: THREE.Group[];
  crackG: THREE.Group; water: THREE.Mesh;
  clouds: THREE.Group[]; sparkles: THREE.Group;
}

const BLACK = "#23272e";
const WHITE = "#ffffff";
const WHITE_SOFT = "#f2f6f8";
const ORANGE = "#f08a1d";
const ORANGE_DARK = "#d96f0e";
const SHRIMP = "#ff7a3c";
const SHRIMP_LIGHT = "#ffb08a";

// ---------------------------------------------------------------- penguin
function buildPenguin(): {
  root: THREE.Group;
  refs: Pick<PenguinRefs, "penguinBodyG" | "penguinHeadG" | "penguinBeakLowG"
    | "penguinFlipL" | "penguinFlipR" | "penguinFootL" | "penguinFootR"
    | "penguinTailG" | "penguinEyeL" | "penguinEyeR">;
} {
  const penguin = new THREE.Group();
  const penguinBodyG = new THREE.Group();
  penguinBodyG.position.set(0, 0.88, 0);
  penguin.add(penguinBodyG);

  // body: round black ellipsoid + white belly (front, +x side)
  sph(penguinBodyG, BLACK, 0.55, [0, 0, 0], [1, 1.25, 0.9]);
  sph(penguinBodyG, WHITE, 0.42, [0.16, -0.08, 0], [0.85, 1.05, 0.8]);
  // white face patches continue down from the head onto the chest
  sph(penguinBodyG, WHITE, 0.2, [0.3, 0.5, 0.18], [0.8, 1, 0.5]);
  sph(penguinBodyG, WHITE, 0.2, [0.3, 0.5, -0.18], [0.8, 1, 0.5]);

  // head: black ball, slightly forward; white face mask around the eyes
  const penguinHeadG = new THREE.Group();
  penguinHeadG.position.set(0.08, 0.72, 0);
  penguinBodyG.add(penguinHeadG);
  sph(penguinHeadG, BLACK, 0.38, [0, 0, 0]);
  sph(penguinHeadG, WHITE, 0.24, [0.12, 0.02, 0.16], [0.9, 1, 0.45]);
  sph(penguinHeadG, WHITE, 0.24, [0.12, 0.02, -0.16], [0.9, 1, 0.45]);
  const { eyeL, eyeR } = makeEyes(penguinHeadG, 0.2, 0.1, 0.2, 0.055);
  // upper beak: short orange cone along +x, flattened
  cone(penguinHeadG, ORANGE, 0.09, 0.42, [0.42, -0.04, 0], [0, 0, -Math.PI / 2]);
  const upper = penguinHeadG.children[penguinHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.5);
  // lower beak (pivot at beak base, rotates down to speak)
  const penguinBeakLowG = new THREE.Group();
  penguinBeakLowG.position.set(0.18, -0.1, 0);
  penguinHeadG.add(penguinBeakLowG);
  cone(penguinBeakLowG, ORANGE_DARK, 0.07, 0.3, [0.14, 0, 0], [0, 0, -Math.PI / 2]);
  const low = penguinBeakLowG.children[penguinBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // flippers: flattened black ellipsoids, pivot at the shoulder
  const mkFlip = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.02, 0.12, z);
    penguinBodyG.add(g);
    sph(g, BLACK, 0.34, [-0.05, -0.22, z > 0 ? 0.1 : -0.1], [0.9, 1.5, 0.28]);
    return g;
  };
  const penguinFlipL = mkFlip(0.48);
  const penguinFlipR = mkFlip(-0.48);

  // feet: flat orange ovals, pivot at the ankle so they can paddle/kick
  const mkFoot = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.08, -0.62, z);
    penguinBodyG.add(g);
    sph(g, ORANGE, 0.14, [0.08, 0, 0], [1.5, 0.35, 0.9]);
    return g;
  };
  const penguinFootL = mkFoot(0.22);
  const penguinFootR = mkFoot(-0.22);

  // tail: short black wedge at the back
  const penguinTailG = new THREE.Group();
  penguinTailG.position.set(-0.5, -0.1, 0);
  penguinBodyG.add(penguinTailG);
  cone(penguinTailG, BLACK, 0.16, 0.4, [-0.14, -0.05, 0], [0, 0, Math.PI / 2 + 0.5]);

  return {
    root: penguin,
    refs: {
      penguinBodyG, penguinHeadG, penguinBeakLowG,
      penguinFlipL, penguinFlipR, penguinFootL, penguinFootR,
      penguinTailG, penguinEyeL: eyeL, penguinEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- shrimp
function buildShrimp(): {
  root: THREE.Group;
  refs: Pick<PenguinRefs, "shrimpBodyG" | "shrimpHeadG" | "shrimpJawG" | "shrimpTailG"
    | "shrimpClawL" | "shrimpClawR" | "shrimpAntL" | "shrimpAntR"
    | "shrimpEyeL" | "shrimpEyeR">;
} {
  const shrimp = new THREE.Group();
  const shrimpBodyG = new THREE.Group();
  shrimp.add(shrimpBodyG);

  // body: three overlapping translucent orange segments, curving down-back
  sphT(shrimpBodyG, SHRIMP, 0.22, 0.92, [0.1, 0, 0], [1.4, 1, 0.85]);
  sphT(shrimpBodyG, SHRIMP, 0.19, 0.92, [-0.18, -0.06, 0], [1.3, 1, 0.85]);
  sphT(shrimpBodyG, SHRIMP_LIGHT, 0.16, 0.92, [-0.4, -0.16, 0], [1.2, 1, 0.85]);
  // pale belly stripe
  sphT(shrimpBodyG, "#ffd9c2", 0.12, 0.9, [0.02, -0.14, 0], [1.5, 0.6, 0.7]);

  // head at the front (+x): small ball + stalked eyes
  const shrimpHeadG = new THREE.Group();
  shrimpHeadG.position.set(0.34, 0.04, 0);
  shrimpBodyG.add(shrimpHeadG);
  sphT(shrimpHeadG, SHRIMP, 0.14, 0.95, [0, 0, 0]);
  // eye stalks: thin columns + dark beads
  const mkEyeStalk = (z: number) => {
    cyl(shrimpHeadG, SHRIMP, 0.02, 0.02, 0.16, [0.05, 0.12, z]);
    const e = sph(shrimpHeadG, "#241d1a", 0.045, [0.06, 0.22, z], [1, 1, 1], 0.25);
    return e;
  };
  const shrimpEyeL = mkEyeStalk(0.09);
  const shrimpEyeR = mkEyeStalk(-0.09);
  // little mandible jaw (speaking)
  const shrimpJawG = new THREE.Group();
  shrimpJawG.position.set(0.08, -0.1, 0);
  shrimpHeadG.add(shrimpJawG);
  sphT(shrimpJawG, ORANGE_DARK, 0.05, 0.95, [0.03, -0.02, 0], [1.4, 0.5, 0.9]);

  // antennae: two long thin feelers sweeping forward-up
  const mkAnt = (z: number, tilt: number) => {
    const a = cyl(shrimpHeadG, "#ff9a5c", 0.012, 0.008, 0.45, [0.26, 0.13, z], [0, 0, -0.9 + tilt]);
    a.castShadow = false;
    return a;
  };
  const shrimpAntL = mkAnt(0.06, 0.15);
  const shrimpAntR = mkAnt(-0.06, -0.15);

  // tail fan: flattened fan of three lobes at the back
  const shrimpTailG = new THREE.Group();
  shrimpTailG.position.set(-0.55, -0.2, 0);
  shrimpBodyG.add(shrimpTailG);
  sphT(shrimpTailG, SHRIMP, 0.14, 0.9, [-0.12, 0, 0], [1.4, 0.3, 0.9]);
  sphT(shrimpTailG, SHRIMP_LIGHT, 0.11, 0.9, [-0.14, 0.02, 0.12], [1.2, 0.25, 0.7]);
  sphT(shrimpTailG, SHRIMP_LIGHT, 0.11, 0.9, [-0.14, 0.02, -0.12], [1.2, 0.25, 0.7]);

  // small claws: thin arms + tiny pincer balls, pivot at the front underside
  const mkClaw = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.22, -0.12, z);
    shrimpBodyG.add(g);
    cyl(g, SHRIMP, 0.025, 0.02, 0.22, [0.08, -0.02, 0], [0, 0, -1.1]);
    sphT(g, ORANGE_DARK, 0.05, 0.95, [0.18, -0.1, 0]);
    return g;
  };
  const shrimpClawL = mkClaw(0.12);
  const shrimpClawR = mkClaw(-0.12);
  // little swimmeret legs under the belly (static, wiggle via body)
  for (let i = 0; i < 3; i++) {
    cyl(shrimpBodyG, SHRIMP_LIGHT, 0.015, 0.012, 0.12,
      [-0.05 - i * 0.14, -0.2, 0.1], [0.4, 0, 0]);
    cyl(shrimpBodyG, SHRIMP_LIGHT, 0.015, 0.012, 0.12,
      [-0.05 - i * 0.14, -0.2, -0.1], [-0.4, 0, 0]);
  }

  return {
    root: shrimp,
    refs: {
      shrimpBodyG, shrimpHeadG, shrimpJawG, shrimpTailG,
      shrimpClawL, shrimpClawR, shrimpAntL, shrimpAntR,
      shrimpEyeL, shrimpEyeR,
    },
  };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): PenguinRefs {
  const g = scene as unknown as THREE.Group;

  // frozen sea: deep blue water disc (y=-0.35) + big ice sheet on top (y=0)
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

  // main ice sheet: wide flattened white-blue slab, slightly domed
  const iceG = new THREE.Group();
  g.add(iceG);
  sph(iceG, "#eaf6fb", 4.6, [0, -0.12, 0], [1.35, 0.07, 0.62], 0.7);
  sph(iceG, "#ffffff", 3.4, [-0.4, 0.02, 0.1], [1.3, 0.05, 0.6], 0.8);
  // pale blue rim where the ice meets the water
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.14, 10, 48),
    smat("#bfe3f2", 0.7));
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(1.15, 0.55, 1);
  rim.position.y = -0.05;
  rim.castShadow = false;
  iceG.add(rim);

  // crack in the ice (the danger): dark jagged line across the middle
  const crackG = new THREE.Group();
  g.add(crackG);
  const crackMat = smat("#274b63", 0.9);
  const segs: [number, number, number, number][] = [
    [0.15, 0.3, 0.9, 0.5], [0.35, 0.75, 0.6, -0.4], [0.05, 1.05, 0.7, 0.9],
    [0.55, 0.15, 0.5, 1.2], [-0.1, -0.2, 0.7, 2.2],
  ];
  segs.forEach(([x, z, len, rot]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.1), crackMat);
    m.position.set(x, 0.22, z);
    m.rotation.y = rot;
    crackG.add(m);
  });

  // floating ice chunks bobbing in the water (sway in story.ts)
  const iceChunks: THREE.Group[] = [];
  const chunkSpots: [number, number, number, number][] = [
    [-5.2, 1.8, 0.9, 1.2], [4.8, 2.2, 0.7, 0.9], [-4.2, -2.6, 0.8, 1.0],
    [5.6, -1.6, 0.6, 0.8], [-6.0, -0.4, 0.75, 1.0],
  ];
  chunkSpots.forEach(([x, z, r, s], i) => {
    const cg = new THREE.Group();
    cg.position.set(x, -0.28, z);
    cg.scale.setScalar(s);
    cg.userData.phase = i * 1.4;
    g.add(cg);
    sph(cg, "#eaf6fb", r, [0, 0.1, 0], [1.2, 0.28, 1], 0.75);
    sph(cg, "#ffffff", r * 0.6, [0.2, 0.16, 0.1], [1, 0.25, 0.9], 0.8);
    iceChunks.push(cg);
  });

  // distant colony: 6 tiny penguins far right, small + low (z back)
  const colony: THREE.Group[] = [];
  const colonyHeadGs: THREE.Group[] = [];
  const cr = rng(11);
  const colonySpots: [number, number, number][] = [
    [4.6, -1.9, 0.5], [5.1, -2.1, 0.42], [5.6, -1.8, 0.48],
    [4.9, -2.4, 0.38], [5.4, -2.5, 0.4], [5.9, -2.2, 0.36],
  ];
  colonySpots.forEach(([x, z, s], i) => {
    const pg = new THREE.Group();
    pg.position.set(x, 0, z);
    pg.scale.setScalar(s);
    pg.rotation.y = -Math.PI / 4 + (cr() - 0.5) * 0.4;
    pg.userData.phase = cr() * Math.PI * 2;
    g.add(pg);
    const body = new THREE.Group();
    body.position.y = 0.88;
    pg.add(body);
    sph(body, BLACK, 0.55, [0, 0, 0], [1, 1.25, 0.9]);
    sph(body, WHITE, 0.42, [0.16, -0.08, 0], [0.85, 1.05, 0.8]);
    const head = new THREE.Group();
    head.position.set(0.08, 0.72, 0);
    body.add(head);
    sph(head, BLACK, 0.38, [0, 0, 0]);
    cone(head, ORANGE, 0.09, 0.4, [0.42, -0.04, 0], [0, 0, -Math.PI / 2]);
    sph(head, "#241d1a", 0.05, [0.2, 0.1, 0.2], [1, 1, 1], 0.25);
    sph(head, "#241d1a", 0.05, [0.2, 0.1, -0.2], [1, 1, 1], 0.25);
    colony.push(pg);
    colonyHeadGs.push(head);
  });

  // bubble trail: 14 small translucent bubbles along the safe path
  // (shrimp -> colony), hidden until line 4, animated in story.ts
  const bubbles = new THREE.Group();
  g.add(bubbles);
  const bubbleMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const bx = 1.3 + t * 3.0;
    const bz = 3.4 - t * 1.2;
    const b = sphT(bubbles, "#dff4ff", 0.07 + (i % 3) * 0.015, 0.75,
      [bx, 0.7 + (i % 4) * 0.22, bz]);
    b.castShadow = false;
    b.userData.tx = bx;
    b.userData.tz = bz;
    b.userData.baseY = 0.7 + (i % 4) * 0.22;
    b.userData.phase = i * 0.9;
    bubbleMeshes.push(b);
  }
  bubbles.visible = false;

  // cold morning sky props
  const clouds = makeClouds(g, [
    [-10, 7.2, -15, 1.5], [6, 8.4, -18, 1.8], [14, 6.6, -13, 1.1], [-19, 7.6, -17, 1.4],
  ]);
  makeSun(g, -13.5, 7.5, -22, 1.9, "#fff3c4");

  // sparkles: closing moment (line 5), around the two friends at the colony
  const sparkles = makeSparkles(g, [
    [3.6, 2.2, 0.6], [4.1, 1.8, 0.3], [3.1, 2.5, 0.8],
    [2.6, 1.6, 0.5], [4.5, 2.4, 0.2], [1.6, 1.4, 1.2],
  ], 1.2);

  const penguin = buildPenguin();
  penguin.root.scale.setScalar(1.6); // tokoh utama harus besar di bingkai
  g.add(penguin.root);
  const shrimp = buildShrimp();
  shrimp.root.scale.setScalar(1.5); // udang kecil tapi harus terbaca
  g.add(shrimp.root);

  return {
    penguin: penguin.root, ...penguin.refs,
    shrimp: shrimp.root, ...shrimp.refs,
    bubbles, bubbleMeshes,
    colony, colonyHeadGs,
    iceChunks, crackG, water,
    clouds, sparkles,
  };
}
