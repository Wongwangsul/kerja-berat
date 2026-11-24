import * as THREE from "three";

// Smooth-shaded low-poly helpers: flatShading OFF everywhere, generous segments
// so silhouettes stay round. This is the anti-voxel style test for Panggung Satwa.

export function smat(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness: 0,
    flatShading: false,
  });
}

export function sph(
  parent: THREE.Object3D, color: string, r: number,
  p: [number, number, number], s: [number, number, number] = [1, 1, 1],
  roughness = 0.9,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), smat(color, roughness));
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function cone(
  parent: THREE.Object3D, color: string, r: number, h: number,
  p: [number, number, number], rot: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24), smat(color));
  m.position.set(...p); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function cyl(
  parent: THREE.Object3D, color: string, rTop: number, rBot: number, h: number,
  p: [number, number, number], rot: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 20), smat(color));
  m.position.set(...p); m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export interface WorldRefs {
  fox: THREE.Group;
  bodyG: THREE.Group;
  headG: THREE.Group;
  earL: THREE.Group; earR: THREE.Group;
  legFL: THREE.Group; legFR: THREE.Group; legBL: THREE.Group; legBR: THREE.Group;
  tailG: THREE.Group;
  clouds: THREE.Group[];
}

const ORANGE = "#e8762a";
const ORANGE_DARK = "#d3641f";
const CREAM = "#fff3e0";
const NOSE = "#3a2a26";

// ---------------------------------------------------------------- fox
function buildFox(): { root: THREE.Group; refs: Omit<WorldRefs, "clouds"> } {
  const fox = new THREE.Group();

  const bodyG = new THREE.Group();
  bodyG.position.set(0, 1.05, 0);
  fox.add(bodyG);

  // body: plump ellipsoid + cream chest/belly
  sph(bodyG, ORANGE, 0.62, [0, 0, 0], [1.3, 0.95, 0.9]);
  sph(bodyG, CREAM, 0.5, [0.18, -0.22, 0], [1.15, 0.8, 0.78]);
  // haunch roundness at the back
  sph(bodyG, ORANGE_DARK, 0.45, [-0.52, -0.02, 0], [0.9, 0.95, 0.92]);

  // head
  const headG = new THREE.Group();
  headG.position.set(0.82, 0.36, 0);
  bodyG.add(headG);
  sph(headG, ORANGE, 0.4, [0, 0, 0]);
  // cheek fluff
  sph(headG, CREAM, 0.3, [0.1, -0.16, 0], [1.0, 0.75, 1.05]);
  // muzzle + nose
  sph(headG, CREAM, 0.22, [0.3, -0.1, 0], [1.25, 0.8, 0.9]);
  sph(headG, NOSE, 0.085, [0.56, -0.05, 0], [1, 0.85, 0.9], 0.5);
  // eyes (glossy dark beads)
  sph(headG, "#241d1a", 0.058, [0.3, 0.13, 0.21], [1, 1, 1], 0.25);
  sph(headG, "#241d1a", 0.058, [0.3, 0.13, -0.21], [1, 1, 1], 0.25);
  sph(headG, "#ffffff", 0.02, [0.33, 0.17, 0.23], [1, 1, 1], 0.2);
  sph(headG, "#ffffff", 0.02, [0.33, 0.17, -0.19], [1, 1, 1], 0.2);

  // ears: pivot groups so they can flick
  const makeEar = (z: number) => {
    const g = new THREE.Group();
    g.position.set(-0.06, 0.34, z);
    headG.add(g);
    cone(g, ORANGE, 0.17, 0.46, [0, 0.2, 0]);
    cone(g, "#ffb59e", 0.09, 0.26, [0.045, 0.17, 0]);
    return g;
  };
  const earL = makeEar(0.2);
  const earR = makeEar(-0.2);

  // legs: pivot at hip/shoulder, cylinder down + round paw
  const makeLeg = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, -0.32, z);
    bodyG.add(g);
    cyl(g, ORANGE_DARK, 0.105, 0.085, 0.52, [0, -0.26, 0]);
    sph(g, ORANGE_DARK, 0.115, [0.05, -0.54, 0], [1.25, 0.75, 1]);
    return g;
  };
  const legFL = makeLeg(0.42, 0.27);
  const legFR = makeLeg(0.42, -0.27);
  const legBL = makeLeg(-0.42, 0.27);
  const legBR = makeLeg(-0.42, -0.27);

  // tail: bushy chain of spheres rising behind, cream tip
  const tailG = new THREE.Group();
  tailG.position.set(-0.78, 0.12, 0);
  bodyG.add(tailG);
  sph(tailG, ORANGE, 0.26, [-0.16, 0.02, 0], [1.2, 0.95, 0.95]);
  sph(tailG, ORANGE, 0.33, [-0.44, 0.14, 0], [1.25, 1, 1]);
  sph(tailG, CREAM, 0.27, [-0.74, 0.3, 0], [1.2, 0.95, 0.95]);

  return { root: fox, refs: { fox, bodyG, headG, earL, earR, legFL, legFR, legBL, legBR, tailG } };
}

// ---------------------------------------------------------------- meadow
function buildMeadow(scene: THREE.Group): THREE.Group[] {
  const r = rng(7);

  // ground: big soft disc + rolling hills behind
  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), smat("#69b84a", 1));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  const hillCols = ["#5da843", "#63ae47", "#76c253"];
  [[-24, -21, 22, "#5da843"], [7, -25, 27, "#63ae47"], [30, -20, 19, "#76c253"], [-40, -18, 17, "#5da843"]]
    .forEach(([x, z, rad, c], i) => {
      const h = sph(scene, c as string, rad as number, [x as number, -rad * 0.82, z as number], [1, 0.55, 1], 1);
      h.castShadow = false;
    });

  // rounded trees
  const treeAt = (x: number, z: number, s: number) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    cyl(g, "#8a5a36", 0.2, 0.3, 1.7, [0, 0.85, 0]);
    const greens = ["#3f9e4d", "#359046", "#49ac57"];
    sph(g, greens[0], 1.35, [0, 2.6, 0]);
    sph(g, greens[1], 1.0, [0.85, 2.1, 0.3]);
    sph(g, greens[2], 0.95, [-0.8, 2.2, -0.25]);
    sph(g, greens[1], 0.8, [0.1, 3.3, -0.4]);
  };
  treeAt(-9, -7.5, 1.15); treeAt(6.5, -9, 1.35); treeAt(13, -6.5, 0.95);
  treeAt(-16, -10, 1.5); treeAt(19, -11, 1.25); treeAt(-3.5, -12, 1.05);

  // bushes
  [[-6, -3.4], [4.2, -4.2], [10.5, -3.2], [-12.5, -4.6]].forEach(([x, z]) => {
    sph(scene, "#359046", 0.65, [x, 0.32, z], [1.25, 0.75, 1]);
    sph(scene, "#3f9e4d", 0.45, [x + 0.55, 0.24, z + 0.2], [1.2, 0.75, 1]);
  });

  // flowers + grass tufts (deterministic scatter, kept off the fox's path centre)
  const petalCols = ["#e86a8a", "#f2c14e", "#ffffff", "#b388e6", "#ff8a5c"];
  for (let i = 0; i < 46; i++) {
    const x = -14 + r() * 30, z = -2.5 + r() * 7.5;
    if (Math.abs(z) < 0.9 && x > -5 && x < 4) continue;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    cyl(g, "#3f9e4d", 0.02, 0.03, 0.34, [0, 0.17, 0]);
    sph(g, petalCols[Math.floor(r() * petalCols.length)], 0.1, [0, 0.38, 0], [1, 0.8, 1], 0.6);
  }
  for (let i = 0; i < 60; i++) {
    const x = -15 + r() * 32, z = -3 + r() * 9;
    sph(scene, "#57a83e", 0.17, [x, 0.07, z], [1.15, 0.55, 1.15]);
    sph(scene, "#63b84a", 0.11, [x + 0.14, 0.05, z + 0.1], [1.1, 0.5, 1.1]);
  }

  // soft clouds: overlapping spheres, drift slowly
  const clouds: THREE.Group[] = [];
  const cloudAt = (x: number, y: number, z: number, s: number) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
    g.userData.baseX = x;
    const cm = smat("#ffffff", 1);
    [[0, 0, 0, 1.15], [1.0, -0.12, 0.2, 0.85], [-1.0, -0.1, -0.15, 0.9], [0.35, 0.32, -0.3, 0.75], [-0.45, 0.26, 0.3, 0.7]]
      .forEach(([cx, cy, cz, cr]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(cr, 24, 18), cm);
        m.position.set(cx, cy, cz); m.scale.set(1.25, 0.72, 1); g.add(m);
      });
    clouds.push(g);
  };
  cloudAt(-10, 6.7, -14, 1.4); cloudAt(4.5, 7.5, -17, 1.7);
  cloudAt(13, 6.3, -12.5, 1.1); cloudAt(-19, 7.2, -16, 1.5);

  // soft sun disc high left
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 18),
    new THREE.MeshBasicMaterial({ color: "#ffd94d" }));
  sunM.position.set(-13.5, 7.9, -22); scene.add(sunM);

  return clouds;
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  const g = scene as unknown as THREE.Group;
  const clouds = buildMeadow(g);
  const { root, refs } = buildFox();
  g.add(root);
  return { ...refs, clouds };
}
