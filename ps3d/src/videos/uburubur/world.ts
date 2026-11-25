import * as THREE from "three";
import {
  sph, sphT, cone, cyl,
  groundDisc, makeSparkles, makeEyes,
} from "../../shared/kit";

export interface UburUburRefs {
  jelly: THREE.Group; jellyDomeG: THREE.Group; jellyMouthG: THREE.Group;
  jellyTentG: THREE.Group; jellyEyeL: THREE.Mesh; jellyEyeR: THREE.Mesh;
  shark: THREE.Group; sharkBodyG: THREE.Group; sharkHeadG: THREE.Group;
  sharkJawG: THREE.Group; sharkFinL: THREE.Group; sharkFinR: THREE.Group;
  sharkDorsalG: THREE.Group; sharkTailG: THREE.Group;
  sharkEyeL: THREE.Mesh; sharkEyeR: THREE.Mesh;
  bubblesG: THREE.Group; currentG: THREE.Group; planktonG: THREE.Group;
  seaweed: THREE.Group[]; sparkles: THREE.Group;
}

const JELLY_PINK = "#f7a8d8";
const JELLY_GLOW = "#ffd6ef";
const JELLY_DEEP = "#e87ab8";
const SHARK_GREY = "#8a9ba8";
const SHARK_DARK = "#5f7482";
const SHARK_BELLY = "#d7e2e8";

// ---------------------------------------------------------------- jellyfish
function buildJellyfish(): {
  root: THREE.Group;
  refs: Pick<UburUburRefs, "jellyDomeG" | "jellyMouthG" | "jellyTentG" | "jellyEyeL" | "jellyEyeR">;
} {
  const jelly = new THREE.Group();
  const jellyDomeG = new THREE.Group();
  jelly.add(jellyDomeG);

  // glowing translucent dome (flattened sphere) + bright inner core
  sphT(jellyDomeG, JELLY_PINK, 0.55, 0.72, [0, 0.15, 0], [1, 0.78, 1]);
  sphT(jellyDomeG, JELLY_GLOW, 0.4, 0.55, [0, 0.1, 0], [1, 0.7, 1]);
  // rim ring at the dome base
  sphT(jellyDomeG, JELLY_DEEP, 0.5, 0.6, [0, -0.08, 0], [1, 0.28, 1]);
  // dome spots (glow dots on top)
  sphT(jellyDomeG, "#ffffff", 0.07, 0.8, [-0.18, 0.48, 0.28]);
  sphT(jellyDomeG, "#ffffff", 0.06, 0.8, [0.14, 0.52, -0.2]);
  sphT(jellyDomeG, "#ffffff", 0.05, 0.8, [0.05, 0.5, 0.35]);
  // eyes on the front (+x) face of the dome
  const { eyeL, eyeR } = makeEyes(jellyDomeG, 0.3, 0.18, 0.3, 0.05);
  // little mouth opening under the dome centre
  const jellyMouthG = new THREE.Group();
  jellyMouthG.position.set(0.08, -0.22, 0);
  jellyDomeG.add(jellyMouthG);
  sph(jellyMouthG, "#8a2a5c", 0.09, [0, 0, 0], [1.2, 0.4, 0.9], 0.6);

  // frilly oral arms (short, centre) + long tentacles (rim)
  const jellyTentG = new THREE.Group();
  jellyDomeG.add(jellyTentG);
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Group();
    a.position.set(-0.12 + i * 0.08, -0.2, -0.12 + (i % 2) * 0.24);
    a.userData.phase = i * 1.1;
    jellyTentG.add(a);
    sph(a, JELLY_DEEP, 0.07, [0, -0.12, 0], [1, 1.6, 1]);
    sph(a, JELLY_PINK, 0.05, [0, -0.3, 0], [1, 1.6, 1]);
  }
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const t = new THREE.Group();
    t.position.set(Math.cos(ang) * 0.42, -0.12, Math.sin(ang) * 0.42);
    t.userData.phase = i * 0.8;
    jellyTentG.add(t);
    cyl(t, JELLY_PINK, 0.028, 0.018, 0.95, [0, -0.48, 0]);
    sph(t, JELLY_DEEP, 0.045, [0, -0.98, 0]);
  }

  return { root: jelly, refs: { jellyDomeG, jellyMouthG, jellyTentG, jellyEyeL: eyeL, jellyEyeR: eyeR } };
}

// ---------------------------------------------------------------- shark
function buildShark(): {
  root: THREE.Group;
  refs: Pick<UburUburRefs, "sharkBodyG" | "sharkHeadG" | "sharkJawG" | "sharkFinL" | "sharkFinR" | "sharkDorsalG" | "sharkTailG" | "sharkEyeL" | "sharkEyeR">;
} {
  const shark = new THREE.Group();
  const sharkBodyG = new THREE.Group();
  shark.add(sharkBodyG);

  // streamlined body (head +x) + pale belly
  sph(sharkBodyG, SHARK_GREY, 0.85, [0, 0, 0], [1.7, 0.85, 0.78]);
  sph(sharkBodyG, SHARK_BELLY, 0.7, [0.0, -0.38, 0], [1.6, 0.6, 0.7]);
  sph(sharkBodyG, SHARK_DARK, 0.6, [-0.9, 0.28, 0], [1.3, 0.8, 0.75]);

  const sharkHeadG = new THREE.Group();
  sharkHeadG.position.set(1.2, 0.08, 0);
  sharkBodyG.add(sharkHeadG);
  sph(sharkHeadG, SHARK_GREY, 0.52, [0, 0, 0], [1.25, 0.95, 0.95]);
  // pointed snout
  cone(sharkHeadG, SHARK_GREY, 0.34, 0.5, [0.58, -0.02, 0], [0, 0, -Math.PI / 2]);
  const snout = sharkHeadG.children[sharkHeadG.children.length - 1] as THREE.Mesh;
  snout.scale.set(1, 1, 0.75);
  // gill slits (dark marks on the side)
  sph(sharkHeadG, SHARK_DARK, 0.05, [-0.28, -0.05, 0.5], [0.4, 2.2, 0.6], 0.6);
  sph(sharkHeadG, SHARK_DARK, 0.05, [-0.38, -0.05, 0.5], [0.4, 2.2, 0.6], 0.6);
  const { eyeL, eyeR } = makeEyes(sharkHeadG, 0.28, 0.18, 0.42, 0.075);
  // lower jaw (speaking)
  const sharkJawG = new THREE.Group();
  sharkJawG.position.set(0.15, -0.36, 0);
  sharkHeadG.add(sharkJawG);
  sph(sharkJawG, SHARK_BELLY, 0.4, [0.15, -0.06, 0], [1.5, 0.45, 0.9]);

  // dorsal fin (tall triangle-ish, flattened)
  const sharkDorsalG = new THREE.Group();
  sharkDorsalG.position.set(0.15, 0.62, 0);
  sharkBodyG.add(sharkDorsalG);
  sph(sharkDorsalG, SHARK_DARK, 0.42, [0, 0.22, 0], [1.1, 1.15, 0.22]);

  // pectoral fins
  const mkFin = (z: number) => {
    const g = new THREE.Group();
    g.position.set(0.75, -0.4, z);
    sharkBodyG.add(g);
    sph(g, SHARK_DARK, 0.45, [0.05, -0.18, z > 0 ? 0.3 : -0.3], [1.5, 0.3, 0.7]);
    return g;
  };
  const sharkFinL = mkFin(0.62);
  const sharkFinR = mkFin(-0.62);

  // tail: stock + vertical fluke lobes
  const sharkTailG = new THREE.Group();
  sharkTailG.position.set(-1.35, 0, 0);
  sharkBodyG.add(sharkTailG);
  cyl(sharkTailG, SHARK_GREY, 0.24, 0.18, 0.7, [-0.25, 0, 0], [0, 0, Math.PI / 2]);
  sph(sharkTailG, SHARK_DARK, 0.42, [-0.6, 0.3, 0], [1.2, 1.0, 0.22]);
  sph(sharkTailG, SHARK_DARK, 0.32, [-0.6, -0.26, 0], [1.2, 0.85, 0.22]);

  return { root: shark, refs: { sharkBodyG, sharkHeadG, sharkJawG, sharkFinL, sharkFinR, sharkDorsalG, sharkTailG, sharkEyeL: eyeL, sharkEyeR: eyeR } };
}

// ---------------------------------------------------------------- world
export function buildWorld(scene: THREE.Scene): UburUburRefs {
  const g = scene as unknown as THREE.Group;

  // sandy floor
  const sandG = new THREE.Group();
  sandG.position.y = -2.2;
  g.add(sandG);
  groundDisc(sandG, "#d9c08a");
  // small rocks scattered on the sand
  [[-4.5, -1.2], [-1.0, -2.0], [1.2, -2.4], [-3.0, -2.6]].forEach(([x, z]) => {
    sph(sandG, "#9a9a92", 0.5, [x, 0.12, z], [1.3, 0.55, 1]);
  });

  // sharp coral cluster, right-bottom (the hazard): cones + base rocks
  const coralG = new THREE.Group();
  coralG.position.set(3.1, -2.2, -1.2);
  g.add(coralG);
  const coralCols = ["#c65a8a", "#e87a4e", "#b388e6", "#f2a541"];
  const spikes: [number, number, number, number][] = [
    [0, 0, 0.32, 1.0], [0.55, 0.25, 0.26, 0.85], [-0.5, 0.3, 0.24, 0.8],
    [0.9, -0.2, 0.2, 0.7], [-0.85, -0.25, 0.2, 0.65], [0.25, -0.45, 0.22, 0.75],
  ];
  spikes.forEach(([x, z, r, h], i) => {
    cone(coralG, coralCols[i % coralCols.length], r, h, [x, h / 2, z]);
  });
  sph(coralG, "#8a6f5c", 0.55, [0.1, 0.1, 0], [1.6, 0.5, 1.2]);
  sph(coralG, "#8a6f5c", 0.4, [-0.6, 0.08, 0.3], [1.4, 0.5, 1.1]);

  // seaweed: left edge + right edge (goal side)
  const seaweed: THREE.Group[] = [];
  for (let b = 0; b < 8; b++) {
    const blade = new THREE.Group();
    const leftSide = b < 4;
    blade.position.set(
      leftSide ? -4.6 + (b % 4) * 0.5 : 4.4 + (b % 4) * 0.45,
      -2.2,
      -1.4 + Math.floor(b / 4) * 0.8,
    );
    blade.userData.phase = b * 0.9;
    g.add(blade);
    const h = 1.5 + (b % 3) * 0.45;
    for (let s = 0; s < 4; s++) {
      sph(blade, b % 2 === 0 ? "#2e8b57" : "#3aa76d", 0.2 - s * 0.03, [0.05 * s, 0.25 + s * (h / 4), 0], [0.7, 1.3, 0.5]);
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

  // plankton particles drifting with the current
  const planktonG = new THREE.Group();
  g.add(planktonG);
  for (let i = 0; i < 14; i++) {
    sphT(planktonG, "#eaf7ff", 0.05, 0.55, [0, 0, 0]);
  }

  // current streaks (thin, faint — must not read as solid bars)
  const currentG = new THREE.Group();
  g.add(currentG);
  for (let i = 0; i < 5; i++) {
    const c = cyl(currentG, "#ffffff", 0.02, 0.02, 1.6, [0, -1 + i * 0.9, -0.5], [0, 0, Math.PI / 2]);
    (c as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#cfeeff", transparent: true, opacity: 0.2 });
    (c as THREE.Mesh).castShadow = false;
  }

  // sparkles at the calm-water arrival — in open water, clear of the shark
  const sparkles = makeSparkles(g, [
    [1.0, 1.4, 0.6], [2.2, 1.6, 0.4], [5.8, 1.4, 0.5], [5.6, 1.1, 0.8], [0.4, 1.0, 0.7],
  ], 1.2);

  const jelly = buildJellyfish();
  g.add(jelly.root);
  const shark = buildShark();
  g.add(shark.root);

  return {
    jelly: jelly.root, ...jelly.refs,
    shark: shark.root, ...shark.refs,
    bubblesG, currentG, planktonG, seaweed, sparkles,
  };
}
