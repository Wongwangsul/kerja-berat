import * as THREE from "three";
import { box, mat, rng, faceTexture, tiredFaceTexture, headWithFace } from "./vox";

export const LADDER_TOP = 118;
export const CLOUD_SEA_Y = 74;
export const NEST_POS: [number, number, number] = [8.5, LADDER_TOP, -2];

export interface WorldRefs {
  bima: THREE.Group;
  bimaHead: THREE.Group;
  headNormal: THREE.Object3D;
  headTired: THREE.Object3D;
  armL: THREE.Group; armR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;
  torso: THREE.Group;
  mama: THREE.Group;
  mamaHead: THREE.Group;
  wingL: THREE.Group; wingR: THREE.Group;
  chick1: THREE.Group; chick2: THREE.Group;
  chickHead1: THREE.Group; chickHead2: THREE.Group;
  feather: THREE.Group;
  sunMesh: THREE.Mesh;
}

function instanced(parent: THREE.Object3D, items: { p: [number, number, number]; s: [number, number, number]; c: string; ry?: number }[]) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const byColor = new Map<string, typeof items>();
  for (const it of items) { const a = byColor.get(it.c) ?? []; a.push(it); byColor.set(it.c, a); }
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler(); const v = new THREE.Vector3(); const sc = new THREE.Vector3();
  for (const [color, arr] of byColor) {
    const im = new THREE.InstancedMesh(geo, mat(color), arr.length);
    arr.forEach((it, i) => {
      e.set(0, it.ry ?? 0, 0); q.setFromEuler(e);
      v.set(...it.p); sc.set(...it.s);
      m4.compose(v, q, sc); im.setMatrixAt(i, m4);
    });
    im.castShadow = true; im.receiveShadow = true;
    parent.add(im);
  }
}

function buildTerrain(scene: THREE.Scene) {
  const g = new THREE.Group(); scene.add(g);
  const r = rng(42);
  const items: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
  const greens = ["#69b84a", "#5da843", "#76c253", "#63ae47"];
  for (let ix = -24; ix <= 24; ix++) for (let iz = -24; iz <= 24; iz++) {
    const x = ix * 2, z = iz * 2;
    const d = Math.sqrt(x * x + z * z);
    if (d > 48) continue;
    // plateau near the village, falling away in steps
    let h = d < 12 ? 0 : -Math.floor((d - 12) / 7) * 1.6 - Math.floor(r() * 1.2);
    if (Math.abs(x) < 3 && z > -8 && z < 14) h = Math.max(h, -0.0); // flat path to ladder
    const c = greens[Math.floor(r() * greens.length)];
    items.push({ p: [x, h - 1, z], s: [2.02, 2, 2.02], c });
    if (r() < 0.05 && d > 6) items.push({ p: [x, h + 0.15, z], s: [0.3, 0.3, 0.3], c: ["#e86a8a", "#f2c14e", "#ffffff"][Math.floor(r() * 3)] });
  }
  instanced(g, items);
  // dirt patch under the ladder
  box(g, "#9a6b46", 7, 0.25, 7, 0, 0.05, -2, { shadow: false });
}

function house(parent: THREE.Object3D, x: number, z: number, ry: number, wall: string) {
  const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; parent.add(h);
  box(h, wall, 4.6, 2.8, 3.8, 0, 1.4, 0);
  box(h, "#7a4b2d", 1.1, 1.9, 0.2, 0, 0.95, 1.95);
  box(h, "#3d2b1f", 0.18, 0.18, 0.18, 0.35, 0.95, 2.06);
  box(h, "#ffe9a8", 0.9, 0.9, 0.15, -1.3, 1.7, 1.93, { shadow: false });
  box(h, "#ffe9a8", 0.9, 0.9, 0.15, 1.3, 1.7, 1.93, { shadow: false });
  // stepped pyramid roof
  box(h, "#8a5a34", 5.6, 0.55, 4.8, 0, 3.05, 0);
  box(h, "#96653c", 4.4, 0.55, 3.7, 0, 3.55, 0);
  box(h, "#8a5a34", 3.1, 0.55, 2.5, 0, 4.05, 0);
  box(h, "#96653c", 1.7, 0.55, 1.3, 0, 4.55, 0);
  return h;
}

function buildVillage(scene: THREE.Scene) {
  const g = new THREE.Group(); scene.add(g);
  house(g, -11, 6, 0.5, "#e8dcc4");
  house(g, 12, 8, -0.4, "#dfc9a8");
  house(g, -16, -4, 0.9, "#e8dcc4");
  house(g, 17, -6, -0.9, "#e5d3b3");
  house(g, -8, 16, 0.15, "#dfc9a8");
  house(g, 19, 14, -0.2, "#e8dcc4");
  // fences
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const rad = 15 + r() * 3;
    box(g, "#8a5a34", 0.18, 1.0, 0.18, Math.cos(a) * rad, 0.5, Math.sin(a) * rad + 6, { shadow: false });
  }
  // hay bales + crates + water tubs
  box(g, "#e3c568", 1.4, 1.0, 1.4, 6, 0.5, 12); box(g, "#e3c568", 1.4, 1.0, 1.4, 6.2, 1.5, 12.2);
  box(g, "#a9743f", 1.2, 1.2, 1.2, -6, 0.6, 11); box(g, "#7ec8e3", 2.2, 0.7, 1.4, -13, 0.35, 12, { shadow: false });
}

function buildTree(scene: THREE.Scene) {
  const g = new THREE.Group(); g.position.set(-14, 0, -10); scene.add(g);
  const r = rng(99);
  // trunk: stacked, slightly tapering
  for (let i = 0; i < 9; i++) {
    const w = 2.6 - i * 0.16;
    box(g, i % 2 ? "#7a4b2d" : "#845231", w, 2.1, w, (r() - 0.5) * 0.3, 1 + i * 2, (r() - 0.5) * 0.3);
  }
  box(g, "#7a4b2d", 3.4, 1.6, 1.4, -2.2, 15.5, 0).rotation.z = 0.5;
  box(g, "#7a4b2d", 1.4, 1.6, 3.2, 0.6, 15.8, -1.8).rotation.x = -0.45;
  // canopy: voxel blobs
  const leaves: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
  const fruits: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
  const greens = ["#4f9e3d", "#5cab47", "#478f36", "#66b854"];
  for (let i = 0; i < 210; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rad = 3.2 + r() * 3.4;
    const x = Math.sin(ph) * Math.cos(th) * rad, y = Math.cos(ph) * rad * 0.72, z = Math.sin(ph) * Math.sin(th) * rad;
    const s = 1.1 + r() * 1.3;
    leaves.push({ p: [x, 21 + y, z], s: [s, s, s], c: greens[Math.floor(r() * 4)] });
    if (r() < 0.16) fruits.push({ p: [x * 1.06, 20.4 + y * 1.02, z * 1.06], s: [0.55, 0.55, 0.55], c: "#f08a2e" });
  }
  instanced(g, leaves); instanced(g, fruits);
}

function buildLadder(scene: THREE.Scene) {
  const g = new THREE.Group(); g.position.set(0, 0, -2); scene.add(g);
  const H = LADDER_TOP + 4;
  box(g, "#8a5a34", 0.55, H, 0.55, -1.05, H / 2, 0);
  box(g, "#8a5a34", 0.55, H, 0.55, 1.05, H / 2, 0);
  const rungs: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
  for (let y = 1.0; y < H; y += 1.05) rungs.push({ p: [0, y, 0], s: [1.7, 0.28, 0.4], c: "#a9743f" });
  instanced(g, rungs);
  // base platform + support struts
  box(g, "#96653c", 4.2, 0.4, 3.4, 0, 0.2, 0);
  const s1 = box(g, "#7a4b2d", 0.3, 6, 0.3, -2.2, 2.8, -1.4); s1.rotation.z = 0.5;
  const s2 = box(g, "#7a4b2d", 0.3, 6, 0.3, 2.2, 2.8, -1.4); s2.rotation.z = -0.5;
}

const cloudMat = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: new THREE.Color("#aebfd2"), emissiveIntensity: 0.38 });
function cloudCluster(parent: THREE.Object3D, x: number, y: number, z: number, scale: number, seed: number, soft = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const r = rng(seed);
  const n = 14 + Math.floor(r() * 8);
  for (let i = 0; i < n; i++) {
    const bx = (r() - 0.5) * 7 * scale, by = (r() - 0.5) * 1.6 * scale, bz = (r() - 0.5) * 4.4 * scale;
    const s = (1.1 + r() * 1.9) * scale;
    box(g, soft ? "#f4f9ff" : "#ffffff", s, s * 0.78, s * 0.85, bx, by, bz, { shadow: false, material: cloudMat });
  }
  return g;
}

function buildSky(scene: THREE.Scene) {
  const geo = new THREE.SphereGeometry(900, 24, 16);
  const mtl = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#3f7fd0") }, mid: { value: new THREE.Color("#8fbbe8") }, bot: { value: new THREE.Color("#d8ecfa") } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0.18 ? mix(mid, top, smoothstep(0.18, 0.75, h)) : mix(bot, mid, smoothstep(-0.08, 0.18, h)); gl_FragColor = vec4(c, 1.0); }",
  });
  const sky = new THREE.Mesh(geo, mtl); scene.add(sky);
  scene.fog = new THREE.Fog(new THREE.Color("#cfe2f4"), 90, 420);
  // square sun
  const sun = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 2), new THREE.MeshBasicMaterial({ color: "#ffd94d", fog: false }));
  sun.position.set(-150, 190, -320); scene.add(sun);
  return sun;
}

function buildClouds(scene: THREE.Scene) {
  const g = new THREE.Group(); scene.add(g);
  // cloud sea at CLOUD_SEA_Y with a hole around the ladder
  const r = rng(1234);
  const items: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2, rad = 9 + Math.pow(r(), 0.6) * 150;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad - 2;
    if (Math.abs(x) < 5 && Math.abs(z + 2) < 5) continue;
    const s = 5 + r() * 9;
    items.push({ p: [x, CLOUD_SEA_Y + (r() - 0.5) * 2.4, z], s: [s, s * 0.34, s * 0.7], c: r() < 0.25 ? "#eef6fd" : "#ffffff" });
  }
  instanced(g, items);
  // floating voxel clouds at assorted heights (kept clear of the ladder shaft)
  const spots: [number, number, number, number][] = [
    [-38, 34, -30, 1.6], [42, 44, -18, 1.9], [-30, 58, 14, 1.4], [36, 26, 22, 1.5],
    [-52, 88, 6, 2.0], [48, 96, -34, 1.8], [-26, 104, -40, 1.5], [30, 66, -44, 1.6],
    [58, 58, 30, 1.7], [-58, 44, 34, 1.8], [26, 112, 38, 1.4], [-26, 98, 50, 1.6],
  ];
  spots.forEach(([x, y, z, s], i) => cloudCluster(g, x, y, z, s, 500 + i * 17));
}

function buildNest(scene: THREE.Scene) {
  const g = new THREE.Group(); g.position.set(...NEST_POS); scene.add(g);
  // cloud puff platform under the nest
  cloudCluster(g, 4.5, -5.8, 0, 1.35, 777);
  cloudCluster(g, 0.5, -6.4, 2.5, 1.0, 778);
  cloudCluster(g, 11, -6.6, -3, 1.2, 779);
  // twig ring: instanced thin sticks
  const r = rng(2024);
  const sticks: { p: [number, number, number]; s: [number, number, number]; c: string; ry?: number }[] = [];
  const browns = ["#8a5a34", "#75502e", "#96653c", "#6b4527"];
  for (let i = 0; i < 190; i++) {
    const a = r() * Math.PI * 2, rad = 3.1 + r() * 1.5;
    sticks.push({
      p: [Math.cos(a) * rad, -0.6 + r() * 1.5 - Math.abs(rad - 3.8) * 0.35, Math.sin(a) * rad],
      s: [1.6 + r() * 1.6, 0.22, 0.22], c: browns[Math.floor(r() * 4)], ry: a + (r() - 0.5) * 0.8,
    });
  }
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, rad = r() * 3.0;
    sticks.push({ p: [Math.cos(a) * rad, -0.85 + r() * 0.3, Math.sin(a) * rad], s: [1.4 + r() * 1.4, 0.2, 0.2], c: browns[Math.floor(r() * 4)], ry: r() * Math.PI });
  }
  instanced(g, sticks);
  // soft inner bowl
  box(g, "#caa06a", 5.6, 0.5, 5.6, 0, -0.75, 0, { shadow: false });
  return g;
}

function buildBima(scene: THREE.Scene): Partial<WorldRefs> {
  const root = new THREE.Group(); scene.add(root);
  const SKIN = "#f3c39c", TEAL = "#35b5ac", TEAL_D = "#2da39b", BLUE = "#2e4d9e", HAIR = "#6e4a2f";
  // legs with hip pivots
  const mkLeg = (side: number) => {
    const hip = new THREE.Group(); hip.position.set(0.21 * side, 0.74, 0); root.add(hip);
    box(hip, BLUE, 0.34, 0.62, 0.38, 0, -0.31, 0);
    box(hip, "#26221f", 0.38, 0.16, 0.55, 0, -0.66, 0.07); // shoe
    return hip;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);
  // torso
  const torso = new THREE.Group(); torso.position.y = 0.74; root.add(torso);
  box(torso, TEAL, 0.92, 0.82, 0.5, 0, 0.41, 0);
  box(torso, TEAL_D, 0.92, 0.18, 0.52, 0, 0.06, 0);
  box(torso, SKIN, 0.3, 0.16, 0.06, 0, 0.78, 0.24, { shadow: false }); // neck notch skin
  // arms with shoulder pivots
  const mkArm = (side: number) => {
    const sh = new THREE.Group(); sh.position.set(0.58 * side, 1.48, 0); root.add(sh);
    box(sh, TEAL, 0.3, 0.5, 0.34, 0, -0.22, 0);
    box(sh, SKIN, 0.28, 0.34, 0.32, 0, -0.62, 0);
    return sh;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // head group
  const headG = new THREE.Group(); headG.position.y = 1.56; root.add(headG);
  const faceN = headWithFace(faceTexture(), SKIN); faceN.scale.set(0.92, 0.92, 0.92); faceN.position.y = 0.46; headG.add(faceN);
  const faceT = headWithFace(tiredFaceTexture(), SKIN); faceT.scale.set(0.92, 0.92, 0.92); faceT.position.y = 0.46; faceT.visible = false; headG.add(faceT);
  // voxel hair: top slab + stepped fringe + back + sides
  box(headG, HAIR, 0.98, 0.3, 0.98, 0, 1.0, 0);
  box(headG, HAIR, 0.98, 0.34, 0.3, 0, 0.82, 0.36);
  box(headG, HAIR, 0.7, 0.22, 0.7, -0.08, 1.2, -0.05);
  box(headG, HAIR, 0.98, 0.5, 0.24, 0, 0.74, -0.4);
  box(headG, HAIR, 0.2, 0.5, 0.9, -0.42, 0.68, 0);
  box(headG, HAIR, 0.2, 0.5, 0.9, 0.42, 0.68, 0);
  box(headG, SKIN, 0.16, 0.3, 0.16, -0.53, 0.42, 0, { shadow: false }); // ears
  box(headG, SKIN, 0.16, 0.3, 0.16, 0.53, 0.42, 0, { shadow: false });
  root.traverse((o) => { o.frustumCulled = false; });
  return { bima: root, bimaHead: headG, headNormal: faceN, headTired: faceT, armL, armR, legL, legR, torso };
}

function buildBird(scale: number, chick: boolean) {
  const g = new THREE.Group();
  const BLUE = "#8ec9e8", BLUE_D = "#6fb3dd", WHITE = "#ffffff", ORANGE = "#f59b23";
  box(g, BLUE, 2.6, 2.2, 3.0, 0, 1.5, 0);                    // body
  box(g, WHITE, 2.2, 1.8, 0.7, 0, 1.3, 1.35);               // belly
  box(g, BLUE_D, 2.0, 0.9, 2.2, 0, 2.9, -0.2);              // shoulders
  const head = new THREE.Group(); head.position.set(0, 3.3, 0.7); g.add(head);
  box(head, BLUE, 1.7, 1.5, 1.7, 0, 0.6, 0);
  box(head, WHITE, 1.5, 0.7, 0.3, 0, 0.25, 0.82, { shadow: false });
  box(head, ORANGE, 0.95, 0.34, 0.85, 0, 0.42, 1.2);        // upper beak
  box(head, "#e8890f", 0.8, 0.26, 0.6, 0, 0.12, 1.08);      // lower beak
  box(head, "#1d1a17", 0.22, 0.3, 0.1, -0.55, 0.85, 0.87, { shadow: false });
  box(head, "#1d1a17", 0.22, 0.3, 0.1, 0.55, 0.85, 0.87, { shadow: false });
  // crest tufts
  box(head, BLUE_D, 0.34, 0.6, 0.34, -0.4, 1.6, -0.2).rotation.z = 0.3;
  box(head, BLUE_D, 0.34, 0.75, 0.34, 0.05, 1.66, -0.25);
  box(head, BLUE_D, 0.34, 0.55, 0.34, 0.45, 1.58, -0.2).rotation.z = -0.3;
  // wings on shoulder pivots
  const mkWing = (side: number) => {
    const w = new THREE.Group(); w.position.set(1.25 * side, 2.5, -0.1); g.add(w);
    const wm = box(w, BLUE_D, 0.35, 2.3, 1.7, 0.28 * side, -0.9, -0.2);
    wm.rotation.z = side * 0.12;
    box(w, BLUE, 0.3, 1.4, 1.3, 0.3 * side, -2.2, -0.35);
    return w;
  };
  const wingL = mkWing(-1), wingR = mkWing(1);
  // tail fan
  for (let i = -1; i <= 1; i++) {
    const t = box(g, BLUE_D, 0.8, 0.25, 1.9, i * 0.55, 1.9, -2.2);
    t.rotation.x = -0.5; t.rotation.y = i * 0.25;
  }
  // legs + feet
  if (!chick) {
    box(g, ORANGE, 0.28, 1.0, 0.28, -0.6, -0.3, 0.3);
    box(g, ORANGE, 0.28, 1.0, 0.28, 0.6, -0.3, 0.3);
    box(g, ORANGE, 0.85, 0.22, 1.1, -0.6, -0.85, 0.55);
    box(g, ORANGE, 0.85, 0.22, 1.1, 0.6, -0.85, 0.55);
  }
  g.scale.setScalar(scale);
  g.traverse((o) => { o.frustumCulled = false; });
  return { g, head, wingL, wingR };
}

function buildFeather(scene: THREE.Scene) {
  const g = new THREE.Group(); scene.add(g);
  box(g, "#d9e9f2", 0.16, 5.6, 0.16, 0, 0, 0); // shaft (along Y)
  const r = rng(31);
  for (let i = 0; i < 15; i++) {
    const y = -2.4 + i * 0.33;
    const wdt = 1.75 * Math.sin(Math.PI * (i + 1) / 16) + 0.2;
    const b1 = box(g, i % 2 ? "#eef7fc" : "#cfe6f2", wdt, 0.3, 0.1, -wdt / 2, y, 0, { shadow: false });
    b1.rotation.z = 0.5;
    const b2 = box(g, i % 2 ? "#cfe6f2" : "#eef7fc", wdt, 0.3, 0.1, wdt / 2, y, 0, { shadow: false });
    b2.rotation.z = -0.5;
    void r;
  }
  g.traverse((o) => { o.frustumCulled = false; });
  g.visible = false;
  return g;
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  buildTerrain(scene);
  buildVillage(scene);
  buildTree(scene);
  buildLadder(scene);
  const sunMesh = buildSky(scene);
  buildClouds(scene);
  buildNest(scene);
  const bimaRefs = buildBima(scene);

  // mama bird in the nest, facing the ladder (-x side)
  const mamaB = buildBird(1.55, false);
  mamaB.g.position.set(NEST_POS[0] + 0.5, NEST_POS[1] - 0.6, NEST_POS[2] - 0.5);
  mamaB.g.rotation.y = -0.9;
  scene.add(mamaB.g);
  const chickB1 = buildBird(0.52, true);
  chickB1.g.position.set(NEST_POS[0] - 2.6, NEST_POS[1] - 0.5, NEST_POS[2] + 2.2);
  chickB1.g.rotation.y = -0.6;
  scene.add(chickB1.g);
  const chickB2 = buildBird(0.46, true);
  chickB2.g.position.set(NEST_POS[0] + 3.1, NEST_POS[1] - 0.5, NEST_POS[2] + 2.4);
  chickB2.g.rotation.y = -1.2;
  scene.add(chickB2.g);

  const feather = buildFeather(scene);

  return {
    ...(bimaRefs as WorldRefs),
    mama: mamaB.g, mamaHead: mamaB.head, wingL: mamaB.wingL, wingR: mamaB.wingR,
    chick1: chickB1.g, chick2: chickB2.g, chickHead1: chickB1.head, chickHead2: chickB2.head,
    feather, sunMesh,
  };
}
