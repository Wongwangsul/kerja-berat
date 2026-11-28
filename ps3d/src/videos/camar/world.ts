import * as THREE from "three";
import {
  smat, smatT, sph, sphT, cone, cyl, rng,
  groundDisc, makeClouds, makeSun, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface CamarRefs {
  seagull: THREE.Group; seagullBodyG: THREE.Group; seagullHeadG: THREE.Group;
  seagullBeakLowG: THREE.Group; seagullWingL: THREE.Group; seagullWingR: THREE.Group;
  seagullTailG: THREE.Group; seagullLegL: THREE.Group; seagullLegR: THREE.Group;
  seagullEyeL: THREE.Mesh; seagullEyeR: THREE.Mesh;
  swan: THREE.Group; swanBodyG: THREE.Group; swanNeckG: THREE.Group;
  swanHeadG: THREE.Group; swanBeakLowG: THREE.Group; swanWingL: THREE.Group;
  swanWingR: THREE.Group; swanTailG: THREE.Group; swanLegL: THREE.Group;
  swanLegR: THREE.Group; swanEyeL: THREE.Mesh; swanEyeR: THREE.Mesh;
  boat: THREE.Group; sailG: THREE.Group; flagG: THREE.Group;
  clouds: THREE.Group[]; ripples: THREE.Mesh[]; rippleBoat: THREE.Mesh;
  distantBirds: THREE.Group[]; sparkles: THREE.Group; water: THREE.Mesh;
}

const WHITE = "#ffffff";
const WHITE_SOFT = "#f6f1e6";
const GULL_GREY = "#9aa5ad";
const GULL_BODY = "#f4f6f7";
const GULL_WING = "#e8ecef";
const BEAK_YELLOW = "#f2b705";
const BEAK_ORANGE = "#f08a1d";
const SWAN_ORANGE = "#e87f1e";

// ---------------------------------------------------------------- camar (seagull)
function buildSeagull(): {
  root: THREE.Group;
  refs: Pick<CamarRefs, "seagullBodyG" | "seagullHeadG" | "seagullBeakLowG"
    | "seagullWingL" | "seagullWingR" | "seagullTailG"
    | "seagullLegL" | "seagullLegR" | "seagullEyeL" | "seagullEyeR">;
} {
  const seagull = new THREE.Group();
  const seagullBodyG = new THREE.Group();
  seagullBodyG.position.set(0, 0, 0);
  seagull.add(seagullBodyG);

  // body: white-grey ellipsoid + white belly + grey saddle on the back
  sph(seagullBodyG, GULL_BODY, 0.5, [0, 0, 0], [1.4, 0.85, 0.8]);
  sph(seagullBodyG, WHITE, 0.4, [0.05, -0.15, 0], [1.2, 0.7, 0.75]);
  sph(seagullBodyG, "#c8ced3", 0.34, [-0.05, 0.28, 0], [1.3, 0.4, 0.7]);

  // head: small white ball, clearly forward of the body
  const seagullHeadG = new THREE.Group();
  seagullHeadG.position.set(0.55, 0.28, 0);
  seagullBodyG.add(seagullHeadG);
  sph(seagullHeadG, GULL_BODY, 0.28, [0, 0, 0]);
  const { eyeL, eyeR } = makeEyes(seagullHeadG, 0.16, 0.1, 0.16, 0.05);
  // upper beak: short pointed yellow cone along +x, flattened
  cone(seagullHeadG, BEAK_YELLOW, 0.08, 0.5, [0.38, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = seagullHeadG.children[seagullHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.5);
  // lower beak (pivot at the beak base, rotates down to speak)
  const seagullBeakLowG = new THREE.Group();
  seagullBeakLowG.position.set(0.12, -0.1, 0);
  seagullHeadG.add(seagullBeakLowG);
  cone(seagullBeakLowG, "#e8a91c", 0.06, 0.42, [0.2, 0, 0], [0, 0, -Math.PI / 2]);
  const low = seagullBeakLowG.children[seagullBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.5);

  // wings: long pointed, grey-white with darker grey tips, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.18, z);
    seagullBodyG.add(g);
    sph(g, GULL_WING, 0.5, [-0.1, 0, z > 0 ? 0.25 : -0.25], [1.7, 0.16, 0.55]);
    sph(g, GULL_GREY, 0.3, [-0.78, 0, z > 0 ? 0.3 : -0.3], [1.2, 0.14, 0.5]);
    return g;
  };
  const seagullWingL = mkWing(0.3);
  const seagullWingR = mkWing(-0.3);

  // tail: grey fan at the back
  const seagullTailG = new THREE.Group();
  seagullTailG.position.set(-0.62, 0.05, 0);
  seagullBodyG.add(seagullTailG);
  sph(seagullTailG, "#c8ced3", 0.25, [-0.08, 0, 0], [1.3, 0.25, 0.8]);

  // legs: short orange, tucked forward under the body while flying
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.1, -0.3, z);
    seagullBodyG.add(g);
    cyl(g, BEAK_ORANGE, 0.04, 0.035, 0.3, [0, -0.15, 0]);
    sph(g, BEAK_ORANGE, 0.05, [0.03, -0.3, 0], [1.4, 0.4, 1.2]);
    return g;
  };
  const seagullLegL = mkLeg(0.15);
  const seagullLegR = mkLeg(-0.15);

  return {
    root: seagull,
    refs: {
      seagullBodyG, seagullHeadG, seagullBeakLowG,
      seagullWingL, seagullWingR, seagullTailG,
      seagullLegL, seagullLegR,
      seagullEyeL: eyeL, seagullEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- angsa (swan)
function buildSwan(): {
  root: THREE.Group;
  refs: Pick<CamarRefs, "swanBodyG" | "swanNeckG" | "swanHeadG" | "swanBeakLowG"
    | "swanWingL" | "swanWingR" | "swanTailG" | "swanLegL" | "swanLegR"
    | "swanEyeL" | "swanEyeR">;
} {
  const swan = new THREE.Group();
  const swanBodyG = new THREE.Group();
  swanBodyG.position.set(0, 0, 0);
  swan.add(swanBodyG);

  // body: big elegant white ellipsoid + soft cream belly
  sph(swanBodyG, WHITE, 0.62, [0, 0, 0], [1.5, 0.95, 0.85]);
  sph(swanBodyG, WHITE_SOFT, 0.48, [0.08, -0.2, 0], [1.3, 0.75, 0.78]);

  // neck: LONG, S-curved — a tapered cylinder core so the neck reads as
  // ONE continuous column (never separate beads), with soft joint spheres
  const swanNeckG = new THREE.Group();
  swanNeckG.position.set(0.55, 0.25, 0);
  swanBodyG.add(swanNeckG);
  sph(swanNeckG, WHITE, 0.22, [0.02, 0.15, 0], [1, 1.3, 0.9]);
  cyl(swanNeckG, WHITE, 0.14, 0.19, 1.5, [0.22, 0.9, 0], [0, 0, -0.18]);
  sph(swanNeckG, WHITE, 0.17, [0.38, 1.35, 0], [1, 1.4, 0.9]);

  // head at the top of the long neck
  const swanHeadG = new THREE.Group();
  swanHeadG.position.set(0.48, 1.68, 0);
  swanNeckG.add(swanHeadG);
  sph(swanHeadG, WHITE, 0.3, [0, 0, 0]);
  const { eyeL, eyeR } = makeEyes(swanHeadG, 0.17, 0.1, 0.17, 0.05);
  // orange beak with a small black knob at the base (swan's signature)
  sph(swanHeadG, "#1c1a18", 0.07, [0.2, 0.1, 0], [1, 0.9, 0.9], 0.5);
  cone(swanHeadG, SWAN_ORANGE, 0.09, 0.55, [0.44, -0.02, 0], [0, 0, -Math.PI / 2]);
  const upper = swanHeadG.children[swanHeadG.children.length - 1] as THREE.Mesh;
  upper.scale.set(1, 1, 0.45);
  // lower beak (pivot at the beak base, rotates down to speak)
  const swanBeakLowG = new THREE.Group();
  swanBeakLowG.position.set(0.16, -0.12, 0);
  swanHeadG.add(swanBeakLowG);
  cone(swanBeakLowG, "#c96a12", 0.07, 0.45, [0.22, 0, 0], [0, 0, -Math.PI / 2]);
  const low = swanBeakLowG.children[swanBeakLowG.children.length - 1] as THREE.Mesh;
  low.scale.set(1, 1, 0.45);

  // wings: broad white ellipsoids with a soft cream edge, pivot at shoulder
  const mkWing = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0, 0.22, z);
    swanBodyG.add(g);
    sph(g, WHITE, 0.55, [-0.05, 0, z > 0 ? 0.28 : -0.28], [1.5, 0.3, 0.55]);
    sph(g, WHITE_SOFT, 0.32, [-0.55, -0.02, z > 0 ? 0.32 : -0.32], [1.2, 0.26, 0.5]);
    return g;
  };
  const swanWingL = mkWing(0.45);
  const swanWingR = mkWing(-0.45);

  // tail: short white wedge pointing up at the back
  const swanTailG = new THREE.Group();
  swanTailG.position.set(-0.85, 0.15, 0);
  swanBodyG.add(swanTailG);
  cone(swanTailG, WHITE, 0.18, 0.5, [-0.15, 0.12, 0], [0, 0, Math.PI / 2 + 0.5]);

  // legs: orange, tucked forward under the body while flying
  const mkLeg = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.1, -0.35, z);
    swanBodyG.add(g);
    cyl(g, BEAK_ORANGE, 0.045, 0.04, 0.35, [0, -0.17, 0]);
    sph(g, BEAK_ORANGE, 0.06, [0.04, -0.35, 0], [1.5, 0.4, 1.2]);
    return g;
  };
  const swanLegL = mkLeg(0.18);
  const swanLegR = mkLeg(-0.18);

  return {
    root: swan,
    refs: {
      swanBodyG, swanNeckG, swanHeadG, swanBeakLowG,
      swanWingL, swanWingR, swanTailG,
      swanLegL, swanLegR,
      swanEyeL: eyeL, swanEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- perahu layar
function buildBoat(): {
  root: THREE.Group;
  refs: Pick<CamarRefs, "sailG" | "flagG">;
} {
  const boat = new THREE.Group();
  // hull: warm wooden boat, bow pointing -x (sails toward the beach, left)
  sph(boat, "#8a5a36", 0.9, [0, 0.25, 0], [1.7, 0.45, 0.55]);
  sph(boat, "#a9743f", 0.7, [0, 0.45, 0], [1.5, 0.3, 0.45]);
  sph(boat, "#f6f1e6", 0.5, [0.1, 0.55, 0], [1.4, 0.22, 0.4]);
  // mast: tall thin pole; top ≈ y 3.4 — the birds' landing perch
  cyl(boat, "#6e4526", 0.05, 0.06, 3.2, [0, 1.9, 0]);
  // boom: horizontal spar the sail hangs from
  cyl(boat, "#6e4526", 0.04, 0.04, 1.7, [0.35, 0.95, 0], [0, 0, Math.PI / 2 - 0.12]);
  // main sail: big white triangle (flattened cone), billowing toward +x
  const sailG = new THREE.Group();
  sailG.position.set(0.15, 2.1, 0);
  boat.add(sailG);
  cone(sailG, "#fff8ea", 0.85, 2.4, [0, 0, 0], [0, 0, 0]);
  const sail = sailG.children[sailG.children.length - 1] as THREE.Mesh;
  sail.scale.set(1, 1, 0.14);
  sail.rotation.z = 0.12;
  // jib: smaller sail forward of the mast, lower so its peak never merges
  // with the main sail's peak into an "M"
  cone(boat, "#fdf3d8", 0.45, 1.4, [-0.75, 1.45, 0], [0, 0, 0.35]);
  const jib = boat.children[boat.children.length - 1] as THREE.Mesh;
  jib.scale.set(1, 1, 0.12);
  // little red flag at the mast top
  const flagG = new THREE.Group();
  flagG.position.set(0, 3.55, 0);
  boat.add(flagG);
  cone(flagG, "#e84a4a", 0.09, 0.42, [0.2, 0, 0], [0, 0, -Math.PI / 2]);
  const flag = flagG.children[flagG.children.length - 1] as THREE.Mesh;
  flag.scale.set(1, 1, 0.4);

  return { root: boat, refs: { sailG, flagG } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): CamarRefs {
  const g = scene as unknown as THREE.Group;

  // sea: deep blue bed (y=-0.35) + clear shimmering surface (y=0)
  const waterG = new THREE.Group();
  waterG.position.y = -0.35;
  g.add(waterG);
  groundDisc(waterG, "#2e6ea8");
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    smatT("#4aa3c2", 0.45, 0.3),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.02;
  water.receiveShadow = true;
  g.add(water);

  // sandy beach at the left foreground — where the boat is heading
  const beachG = new THREE.Group();
  g.add(beachG);
  sph(beachG, "#e8c98f", 3.0, [-5.2, -0.28, 2.2], [1.4, 0.12, 1.0], 1);
  sph(beachG, "#f2ddab", 2.0, [-4.3, -0.18, 2.3], [1.3, 0.1, 0.9], 1);
  // a few shells on the sand
  const sr = rng(53);
  for (let i = 0; i < 6; i++) {
    const x = -6.6 + sr() * 3.0, z = 1.2 + sr() * 2.0;
    sph(beachG, i % 2 ? "#f7ead0" : "#e0b183", 0.12 + sr() * 0.08, [x, -0.05, z], [1, 0.4, 1], 1);
  }

  // distant shore hills on the horizon (muted sunset mauve)
  const hills: [number, number, number, string][] = [
    [-22, -26, 20, "#8a6f6a"], [8, -28, 24, "#7d6560"], [30, -24, 18, "#96755f"],
  ];
  hills.forEach(([x, z, rad, c]) => {
    const h = sph(g, c, rad, [x, -rad * 0.86, z], [1, 0.5, 1], 1);
    h.castShadow = false;
  });

  // sunset sky props: low orange sun far left, warm clouds HIGH in the sky
  // (y≈10–11) so they read as sky, never as stray balls at the frame edge
  const clouds = makeClouds(g, [
    [-7, 10.5, -18, 1.2], [4, 11.0, -20, 1.6], [13, 10.0, -16, 1.0], [-15, 10.5, -20, 1.3],
  ]);
  makeSun(g, -16, 7.0, -24, 2.4, "#ffcf5e");

  // distant tiny birds far in the sky (dark silhouettes, drift in story.ts)
  const distantBirds: THREE.Group[] = [];
  const dbSpots: [number, number, number][] = [[-6, 6.5, -10], [-2, 7.2, -12], [8, 6.8, -11]];
  dbSpots.forEach(([x, y, z], i) => {
    const bg = new THREE.Group();
    bg.position.set(x, y, z);
    bg.userData.bx = x;
    bg.userData.phase = i * 2.1;
    g.add(bg);
    sph(bg, "#3a3a3a", 0.12, [0, 0, 0], [1.6, 0.5, 0.6], 1);
    cone(bg, "#3a3a3a", 0.06, 0.3, [-0.22, 0, 0], [0, 0, Math.PI / 2]);
    distantBirds.push(bg);
  });

  // ripple rings on the water surface (pulse in story.ts)
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
  const ripples = [
    mkRipple(-2.5, 1.2, 0.7, 0.4),
    mkRipple(1.5, 1.8, 0.55, 0.35),
    mkRipple(3.5, -0.5, 0.8, 0.3),
  ];
  // boat wake: follows the boat (repositioned in story.ts)
  const rippleBoat = mkRipple(6.5, -5, 0.9, 0.4);

  // sparkles: closing moment (line 5), around the birds above the boat
  const sparkles = makeSparkles(g, [
    [-2.6, 4.2, -2.4], [-0.6, 4.4, -2.6], [-1.6, 4.8, -2.2],
    [-2.2, 3.6, -2.8], [-0.9, 3.9, -2.4], [-1.5, 5.2, -2.6],
  ], 1.6);

  const seagull = buildSeagull();
  seagull.root.scale.setScalar(1.15);
  g.add(seagull.root);
  const swan = buildSwan();
  swan.root.scale.setScalar(1.3);
  g.add(swan.root);
  const boat = buildBoat();
  g.add(boat.root);

  return {
    seagull: seagull.root, ...seagull.refs,
    swan: swan.root, ...swan.refs,
    boat: boat.root, ...boat.refs,
    clouds, ripples, rippleBoat, distantBirds, sparkles, water,
  };
}
