import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface HiuRefs {
  shark: THREE.Group; sharkBodyG: THREE.Group; sharkHeadG: THREE.Group;
  sharkJawG: THREE.Group; sharkFinL: THREE.Group; sharkFinR: THREE.Group;
  sharkTailG: THREE.Group; sharkDorsalG: THREE.Group;
  sharkEyeL: THREE.Mesh; sharkEyeR: THREE.Mesh;
  starfish: THREE.Group; starBodyG: THREE.Group;
  starArms: THREE.Group[]; starMouth: THREE.Mesh;
  starEyeL: THREE.Mesh; starEyeR: THREE.Mesh;
  netG: THREE.Group;
  bubblesG: THREE.Group; burstG: THREE.Group;
  seaweed: THREE.Group[]; rays: THREE.Mesh[];
  sparkles: THREE.Group;
}

const SHARK_GREY = "#7d8fa3";
const SHARK_DARK = "#5d7285";
const SHARK_BELLY = "#dfe9f0";
const STAR_ORANGE = "#ff7f2a";
const STAR_LIGHT = "#ffa54d";
const STAR_DARK = "#e05e12";

// ---------------------------------------------------------------- shark
// Faces +x at ry=0 (same convention as the whale in PausKepiting):
// snout + eyes at +x, crescent tail at -x.
function buildShark(): {
  root: THREE.Group;
  refs: Pick<HiuRefs, "sharkBodyG" | "sharkHeadG" | "sharkJawG"
    | "sharkFinL" | "sharkFinR" | "sharkTailG" | "sharkDorsalG"
    | "sharkEyeL" | "sharkEyeR">;
} {
  const shark = new THREE.Group();
  const sharkBodyG = new THREE.Group();
  shark.add(sharkBodyG);

  // body: long slim ellipsoid + pale belly + darker back
  sph(sharkBodyG, SHARK_GREY, 1.0, [0, 0, 0], [2.0, 0.72, 0.62]);
  sph(sharkBodyG, SHARK_BELLY, 0.8, [0.1, -0.28, 0], [1.9, 0.55, 0.55]);
  sph(sharkBodyG, SHARK_DARK, 0.7, [-0.3, 0.3, 0], [1.7, 0.5, 0.55]);

  // head: rounded snout at the front
  const sharkHeadG = new THREE.Group();
  sharkHeadG.position.set(1.7, 0.05, 0);
  sharkBodyG.add(sharkHeadG);
  sph(sharkHeadG, SHARK_GREY, 0.55, [0.15, 0, 0], [1.3, 0.85, 0.8]);
  sph(sharkHeadG, SHARK_BELLY, 0.4, [0.2, -0.22, 0], [1.2, 0.55, 0.7]);
  const { eyeL, eyeR } = makeEyes(sharkHeadG, 0.35, 0.18, 0.42, 0.09);
  // gill slits: three thin dark vertical marks on each flank
  [-0.12, 0.02, 0.16].forEach((x) => {
    sph(sharkHeadG, SHARK_DARK, 0.16, [x, -0.05, 0.44], [0.25, 1.0, 0.12], 0.7);
    sph(sharkHeadG, SHARK_DARK, 0.16, [x, -0.05, -0.44], [0.25, 1.0, 0.12], 0.7);
  });
  // lower jaw (speaking): pale, tucked UNDER the snout so it never reads
  // as a separate white chin — shorter and set back from the snout tip
  const sharkJawG = new THREE.Group();
  sharkJawG.position.set(0.2, -0.22, 0);
  sharkHeadG.add(sharkJawG);
  sph(sharkJawG, SHARK_BELLY, 0.3, [0.05, -0.05, 0], [1.2, 0.4, 0.75]);

  // dorsal fin: tall triangle on the back, swept slightly backwards
  const sharkDorsalG = new THREE.Group();
  sharkDorsalG.position.set(0.1, 0.62, 0);
  sharkBodyG.add(sharkDorsalG);
  cone(sharkDorsalG, SHARK_DARK, 0.42, 1.05, [0, 0.45, 0], [0, 0, -0.35]);
  const dorsal = sharkDorsalG.children[sharkDorsalG.children.length - 1] as THREE.Mesh;
  dorsal.scale.set(1, 1, 0.32);

  // pectoral fins: flat swept ellipsoids at the sides, pivot at the shoulder
  const mkFin = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.9, -0.35, z);
    sharkBodyG.add(g);
    sph(g, SHARK_DARK, 0.5, [0, -0.15, z > 0 ? 0.2 : -0.2], [1.4, 0.25, 0.6]);
    return g;
  };
  const sharkFinL = mkFin(0.55);
  const sharkFinR = mkFin(-0.55);

  // tail: narrow stock reaching the fluke + crescent fluke (upper lobe
  // longer, swept back). Lobes overlap the stock end so no gap shows.
  const sharkTailG = new THREE.Group();
  sharkTailG.position.set(-1.9, 0, 0);
  sharkBodyG.add(sharkTailG);
  cyl(sharkTailG, SHARK_GREY, 0.22, 0.16, 1.1, [-0.45, 0, 0], [0, 0, Math.PI / 2]);
  cone(sharkTailG, SHARK_DARK, 0.38, 1.2, [-0.85, 0.42, 0], [0, 0, 2.35]);
  const up = sharkTailG.children[sharkTailG.children.length - 1] as THREE.Mesh;
  up.scale.set(1, 1, 0.3);
  cone(sharkTailG, SHARK_DARK, 0.3, 0.85, [-0.8, -0.32, 0], [0, 0, 0.85]);
  const lo = sharkTailG.children[sharkTailG.children.length - 1] as THREE.Mesh;
  lo.scale.set(1, 1, 0.3);

  return {
    root: shark,
    refs: {
      sharkBodyG, sharkHeadG, sharkJawG, sharkFinL, sharkFinR,
      sharkTailG, sharkDorsalG, sharkEyeL: eyeL, sharkEyeR: eyeR,
    },
  };
}

// ---------------------------------------------------------------- starfish
// Built facing +z (toward the camera): five arms radiating in the x-y plane,
// stuck upright on the coral. Arm 0 points straight up.
function buildStarfish(): {
  root: THREE.Group;
  refs: Pick<HiuRefs, "starBodyG" | "starArms" | "starMouth" | "starEyeL" | "starEyeR">;
} {
  const starfish = new THREE.Group();
  const starBodyG = new THREE.Group();
  starfish.add(starBodyG);

  // central disc
  sph(starBodyG, STAR_ORANGE, 0.45, [0, 0, 0], [1, 1, 0.45]);
  sph(starBodyG, STAR_LIGHT, 0.3, [0, 0.08, 0.14], [1, 1, 0.4]);

  // five tapered arms, each a pivot group so one arm can rise to point
  const starArms: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const armG = new THREE.Group();
    armG.rotation.z = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    starBodyG.add(armG);
    cone(armG, STAR_ORANGE, 0.22, 0.95, [0.48, 0, 0], [0, 0, -Math.PI / 2]);
    const c = armG.children[armG.children.length - 1] as THREE.Mesh;
    c.scale.set(1, 1, 0.5);
    sph(armG, STAR_ORANGE, 0.17, [0.92, 0, 0], [1, 0.9, 0.5]);
    sph(armG, STAR_LIGHT, 0.08, [0.55, 0.1, 0.12], [1, 1, 0.5], 0.6);
    sph(armG, STAR_LIGHT, 0.08, [0.3, -0.08, 0.14], [1, 1, 0.5], 0.6);
    starArms.push(armG);
  }

  // face on the front (+z): two glossy eyes + a small mouth disc
  const eyeL = sph(starBodyG, "#241d1a", 0.075, [-0.14, 0.14, 0.2], [1, 1, 1], 0.25);
  const eyeR = sph(starBodyG, "#241d1a", 0.075, [0.14, 0.14, 0.2], [1, 1, 1], 0.25);
  sph(starBodyG, "#ffffff", 0.026, [-0.12, 0.17, 0.26], [1, 1, 1], 0.2);
  sph(starBodyG, "#ffffff", 0.026, [0.16, 0.17, 0.26], [1, 1, 1], 0.2);
  const starMouth = sph(starBodyG, STAR_DARK, 0.09, [0, -0.1, 0.19], [1, 0.7, 0.4], 0.6);

  return { root: starfish, refs: { starBodyG, starArms, starMouth, starEyeL: eyeL, starEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): HiuRefs {
  const g = scene as unknown as THREE.Group;

  // sandy floor
  const sandG = new THREE.Group();
  sandG.position.y = -2.2;
  g.add(sandG);
  groundDisc(sandG, "#d9c08a");
  // coral reef mounds + grey rocks on the sand
  const coralCols = ["#a86fd6", "#ff9a5c", "#f28ba8", "#c98af2"];
  [[-4.6, -1.4], [-3.2, -2.4], [-0.6, -2.6], [0.8, -2.2], [4.6, -2.2], [5.4, -1.2], [-5.4, -2.0]].forEach(([x, z], i) => {
    sph(sandG, coralCols[i % coralCols.length], 0.5, [x, 0.2, z], [1, 0.7, 1]);
    sph(sandG, coralCols[(i + 1) % coralCols.length], 0.35, [x + 0.5, 0.15, z + 0.3], [1, 0.7, 1]);
  });
  [[-3.8, -0.9], [1.6, -1.6], [-1.8, -1.2]].forEach(([x, z]) => {
    sph(sandG, "#9a9a92", 0.55, [x, 0.15, z], [1.3, 0.6, 1]);
  });
  // mid-ground coral + shells so the lower band of the tall frame is not
  // empty sand
  [[-1.5, -1.8], [0.2, -2.0], [4.0, -1.8], [-2.6, -2.2]].forEach(([x, z], i) => {
    sph(sandG, coralCols[(i + 2) % coralCols.length], 0.4, [x, 0.15, z], [1, 0.65, 1]);
  });
  [[-1.0, -1.0], [0.9, -1.3], [-3.0, -1.5]].forEach(([x, z]) => {
    sph(sandG, "#f2e8d5", 0.16, [x, 0.08, z], [1.3, 0.5, 1], 0.7);
  });
  // the starfish's perch: a tall flat-topped coral rock on the right
  sph(sandG, "#a86fd6", 0.85, [2.6, 0.35, 0.1], [1.3, 0.75, 1.1]);
  sph(sandG, "#ff9a5c", 0.5, [3.1, 0.4, 0.55], [1, 0.6, 1]);
  sph(sandG, "#c98af2", 0.4, [2.1, 0.3, -0.3], [1, 0.6, 1]);

  // seaweed: cluster near the coral (right) + a pair on the left
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
    seaweed.push(mkBlade(3.6 + (b % 3) * 0.45, -1.2 + Math.floor(b / 3) * 0.8, 1.6 + (b % 3) * 0.5, b % 2 === 0 ? "#2e8b57" : "#3aa76d", b * 0.9));
  }
  seaweed.push(mkBlade(-4.8, -1.6, 1.8, "#2e8b57", 4.2));
  seaweed.push(mkBlade(-4.3, -0.9, 1.4, "#3aa76d", 5.1));
  seaweed.push(mkBlade(1.2, -2.4, 1.5, "#2e8b57", 6.0));

  // drifting net: a loose grid of pale strands in the x-y plane, far right
  // in the background (z=-2.2); drifts left toward the shark in lines 2-4.
  const netG = new THREE.Group();
  netG.position.set(4.6, 0.7, -2.2);
  netG.rotation.y = -0.25;
  g.add(netG);
  const NET = "#e8e0c8";
  for (let i = -2; i <= 2; i++) {
    cyl(netG, NET, 0.035, 0.035, 3.6, [i * 0.6, 0, 0]);
  }
  for (let j = -2; j <= 2; j++) {
    cyl(netG, NET, 0.035, 0.035, 2.7, [0, j * 0.7, 0], [0, 0, Math.PI / 2]);
  }
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      sph(netG, "#cfc4a0", 0.06, [i * 0.6, j * 0.7, 0], [1, 1, 0.6], 0.8);
    }
  }
  // torn corner flapping loose (bottom-left of the net)
  const tearG = new THREE.Group();
  tearG.position.set(-1.2, -1.4, 0);
  netG.add(tearG);
  cyl(tearG, NET, 0.03, 0.03, 0.7, [0.1, -0.2, 0], [0, 0, 0.5]);

  // light rays from the surface
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

  // bubble burst: scattered by the shark's fast turn (line 2)
  const burstG = new THREE.Group();
  burstG.visible = false;
  g.add(burstG);
  for (let i = 0; i < 10; i++) {
    sphT(burstG, "#e8f7ff", 0.11, 0.8, [0, 0, 0]);
  }

  // closing sparkles around the coral + starfish
  const sparkles = makeSparkles(g, [
    [2.6, 0.6, 0.9], [3.1, 0.1, 0.7], [2.1, 0.9, 0.6], [2.9, 1.3, 0.8],
    [1.6, -0.2, 0.9], [3.4, -0.5, 0.8], [2.3, -0.6, 1.0],
  ], 1.2);

  const shark = buildShark();
  shark.root.scale.setScalar(1.0);
  g.add(shark.root);
  const starfish = buildStarfish();
  starfish.root.scale.setScalar(0.95);
  g.add(starfish.root);

  return {
    shark: shark.root, ...shark.refs,
    starfish: starfish.root, ...starfish.refs,
    netG, bubblesG, burstG, seaweed, rays, sparkles,
  };
}
