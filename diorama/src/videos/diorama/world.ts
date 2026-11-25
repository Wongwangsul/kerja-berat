import * as THREE from "three";

// Miniature-diorama world v2: round wooden plinth on a meadow, sand top with a
// REAL rectangular hole for the pool plot (ShapeGeometry with a hole path),
// two tiny houses, rounded trees, and a pool that gets BUILT during the video.
// All animation state lives in refs; story.ts poses everything per frame.

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
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), smat(color, roughness));
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function box(
  parent: THREE.Object3D, color: string,
  size: [number, number, number], p: [number, number, number],
  roughness = 0.9,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), smat(color, roughness));
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function cyl(
  parent: THREE.Object3D, color: string, rTop: number, rBot: number, h: number,
  p: [number, number, number], seg = 24,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), smat(color));
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------------------------------------------------------------- pool plan
export const POOL = {
  cx: 0, cz: 0.7,          // pool centre on the base
  W: 5.4, D: 3.6,          // outer wall footprint
  t: 0.32,                 // wall thickness
  brickH: 0.18, courses: 6,
  pitDepth: 0.45,
};
export const BRICK_START = 205;
export const BRICK_EVERY = 1.35;

export interface BrickRef { mesh: THREE.Mesh; at: number; baseY: number; sx: number; sz: number }

export interface WorldRefs {
  bricks: BrickRef[];
  soilCap: THREE.Mesh;
  soilPiles: THREE.Group[];
  slab: THREE.Mesh;
  paintFloor: THREE.Mesh;
  paintPanels: THREE.Mesh[];
  water: THREE.Mesh;
  waterTop: THREE.Mesh;
  ring: THREE.Group;
  figure: THREE.Group;
  figHead: THREE.Group;
  outline: THREE.Group;
  clouds: THREE.Group[];
}

const BRICK_COLS = ["#b4502e", "#bc5733", "#a84a2a", "#c05a36"];

function buildBricks(scene: THREE.Group): BrickRef[] {
  const { cx, cz, W, D, t, brickH, courses, pitDepth } = POOL;
  const geoLong = new THREE.BoxGeometry(0.44, 0.165, 0.3);
  const geoShort = new THREE.BoxGeometry(0.3, 0.165, 0.44);
  const mats = BRICK_COLS.map((c) => smat(c, 0.95));
  const bricks: BrickRef[] = [];
  const r = rng(31);
  let idx = 0;
  const push = (geo: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sz: number) => {
    const m = new THREE.Mesh(geo, mats[Math.floor(r() * mats.length)]);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    m.visible = false;
    scene.add(m);
    bricks.push({ mesh: m, at: BRICK_START + idx * BRICK_EVERY, baseY: y, sx, sz });
    idx++;
  };
  // one wall run: centres along an axis, running bond on odd courses
  const run = (
    course: number, y: number, usable: number,
    place: (along: number, sx: number) => void,
  ) => {
    const n = Math.floor(usable / 0.49);
    const sp = usable / n;
    const off = course % 2 === 0 ? 0 : sp / 2;
    if (off > 0) {
      // half brick at the start, then full bricks, overflow dropped
      place(-usable / 2 + sp / 4, 0.52);
      for (let i = 0; i < n; i++) {
        const a = -usable / 2 + off + sp / 2 + i * sp;
        if (a + 0.22 > usable / 2) break;
        place(a, 1);
      }
    } else {
      for (let i = 0; i < n; i++) place(-usable / 2 + sp / 2 + i * sp, 1);
    }
  };
  for (let c = 0; c < courses; c++) {
    const y = -pitDepth + brickH / 2 + c * brickH;
    for (const side of [1, -1]) {           // near wall first, then far
      const z = cz + side * (D / 2 - t / 2);
      run(c, y, W - t, (a, sx) => push(geoLong, cx + a, y, z, sx, 1));
    }
    for (const side of [1, -1]) {           // right, then left
      const x = cx + side * (W / 2 - t / 2);
      run(c, y, D - 2 * t, (a, sx) => push(geoShort, x, y, cz + a, 1, sx));
    }
  }
  return bricks;
}

function buildHouse(parent: THREE.Group, x: number, z: number, wall: string, roof: string, rotY: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = rotY;
  parent.add(g);
  box(g, wall, [1.7, 1.25, 1.5], [0, 0.625, 0]);
  const roofM = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.95, 4), smat(roof, 0.95));
  roofM.position.set(0, 1.72, 0); roofM.rotation.y = Math.PI / 4;
  roofM.castShadow = true; roofM.receiveShadow = true;
  g.add(roofM);
  box(g, "#6e4a2f", [0.42, 0.78, 0.06], [0.25, 0.39, 0.78]);
  box(g, "#ffe9a8", [0.4, 0.4, 0.06], [-0.45, 0.75, 0.78], 0.4);
  return g;
}

function buildFigure(scene: THREE.Group): { figure: THREE.Group; figHead: THREE.Group } {
  const figure = new THREE.Group();
  const { cx, cz, D, brickH, courses, pitDepth } = POOL;
  const topY = -pitDepth + courses * brickH;
  // seated on the NEAR wall (camera side), legs dangling toward the viewer
  figure.position.set(cx - 0.9, topY, cz + D / 2 - 0.16);
  scene.add(figure);
  const bodyG = new THREE.Group(); figure.add(bodyG);
  sph(bodyG, "#2e8f86", 0.3, [0, 0.34, 0], [0.95, 1.1, 0.85]);           // torso
  const figHead = new THREE.Group(); figHead.position.set(0, 0.74, 0); bodyG.add(figHead);
  sph(figHead, "#f2c49b", 0.21, [0, 0.08, 0]);                            // head
  sph(figHead, "#4a3226", 0.215, [0, 0.15, -0.03], [1, 0.72, 1]);        // hair cap
  sph(figHead, "#241d1a", 0.032, [0.08, 0.1, 0.19], [1, 1, 1], 0.3);     // eyes
  sph(figHead, "#241d1a", 0.032, [-0.08, 0.1, 0.19], [1, 1, 1], 0.3);
  for (const s of [1, -1]) {
    const thigh = cyl(bodyG, "#3a5a8c", 0.075, 0.07, 0.34, [s * 0.13, 0.06, 0.28]);
    thigh.rotation.x = Math.PI / 2.3;
    cyl(bodyG, "#f2c49b", 0.06, 0.055, 0.36, [s * 0.13, -0.16, 0.42]);
    const arm = cyl(bodyG, "#2e8f86", 0.06, 0.055, 0.36, [s * 0.34, 0.3, 0.02]);
    arm.rotation.z = s * 0.5;
  }
  figure.visible = false;
  return { figure, figHead };
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  const g = scene as unknown as THREE.Group;
  const r = rng(11);
  const { cx, cz, W, D, pitDepth } = POOL;

  // meadow the model sits on
  const meadow = new THREE.Mesh(new THREE.CircleGeometry(90, 48), smat("#69b84a", 1));
  meadow.rotation.x = -Math.PI / 2; meadow.position.y = -0.62;
  meadow.receiveShadow = true; g.add(meadow);

  // wooden plinth
  cyl(g, "#8a5a36", 10.6, 11.0, 0.6, [0, -0.3, 0], 56);

  // sand top: disc with a REAL rectangular hole over the pool plot
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 10.6, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const hx = W / 2 + 0.03, hz = D / 2 + 0.03;
  hole.moveTo(cx - hx, -(cz - hz)); hole.lineTo(cx + hx, -(cz - hz));
  hole.lineTo(cx + hx, -(cz + hz)); hole.lineTo(cx - hx, -(cz + hz));
  hole.closePath();
  shape.holes.push(hole);
  const sand = new THREE.Mesh(new THREE.ShapeGeometry(shape, 40), smat("#dec084", 1));
  sand.rotation.x = -Math.PI / 2; sand.position.y = 0.001;
  sand.receiveShadow = true;
  g.add(sand);

  // pit interior: floor + earthen side walls (visible through the hole)
  box(g, "#5d4128", [W - 0.3, 0.06, D - 0.3], [cx, -pitDepth - 0.02, cz], 1);
  box(g, "#6f4e2d", [W + 0.04, pitDepth, 0.36], [cx, -pitDepth / 2, cz + D / 2 - 0.16], 1);
  box(g, "#6f4e2d", [W + 0.04, pitDepth, 0.36], [cx, -pitDepth / 2, cz - D / 2 + 0.16], 1);
  box(g, "#6f4e2d", [0.36, pitDepth, D + 0.04], [cx + W / 2 - 0.16, -pitDepth / 2, cz], 1);
  box(g, "#6f4e2d", [0.36, pitDepth, D + 0.04], [cx - W / 2 + 0.16, -pitDepth / 2, cz], 1);

  // back-edge village dressing
  buildHouse(g, -6.4, -6.2, "#b4502e", "#c9a35f", 0.35);
  buildHouse(g, 6.6, -6.6, "#f2ede2", "#b03a2e", -0.3);
  const treeAt = (x: number, z: number, s: number) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
    cyl(t, "#8a5a36", 0.14, 0.2, 1.1, [0, 0.55, 0]);
    sph(t, "#3f9e4d", 0.95, [0, 1.75, 0]);
    sph(t, "#359046", 0.7, [0.6, 1.35, 0.2]);
    sph(t, "#49ac57", 0.62, [-0.55, 1.45, -0.15]);
  };
  treeAt(-3.4, -8.2, 1); treeAt(3.2, -8.6, 1.2); treeAt(-8.6, -3.4, 0.9); treeAt(8.8, -3.8, 1.05);
  [[-8.2, 2.8], [8.4, 2.2], [-7.6, -0.6], [7.9, -0.9]].forEach(([x, z]) => {
    sph(g, "#359046", 0.5, [x, 0.22, z], [1.25, 0.75, 1]);
    sph(g, "#3f9e4d", 0.36, [x + 0.42, 0.16, z + 0.15], [1.2, 0.75, 1]);
  });
  // tiny flower dots away from the plot
  const petal = ["#e86a8a", "#f2c14e", "#ffffff", "#ff8a5c"];
  for (let i = 0; i < 30; i++) {
    const a = r() * Math.PI * 2, rad = 4.8 + r() * 5.0;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (Math.abs(x - cx) < 3.8 && Math.abs(z - cz) < 3.0) continue;
    cyl(g, petal[Math.floor(r() * petal.length)], 0.075, 0.075, 0.035, [x, 0.02, z], 10);
  }

  // ---- pool construction set
  // pegs + string outline
  const outline = new THREE.Group(); g.add(outline);
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    cyl(outline, "#c9a35f", 0.045, 0.045, 0.42, [cx + sx * (W / 2 + 0.25), 0.21, cz + sz * (D / 2 + 0.25)]);
  }
  const stringMat = smat("#f5f0e0", 0.6);
  const mkString = (w: number, d: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), stringMat);
    m.position.set(x, 0.3, z); outline.add(m);
  };
  mkString(W + 0.5, 0.03, cx, cz - D / 2 - 0.25); mkString(W + 0.5, 0.03, cx, cz + D / 2 + 0.25);
  mkString(0.03, D + 0.5, cx - W / 2 - 0.25, cz); mkString(0.03, D + 0.5, cx + W / 2 + 0.25, cz);

  // sand cap filling the hole; sinks away while digging
  const soilCap = box(g, "#d3af72", [W - 0.24, 0.5, D - 0.24], [cx, -0.24, cz], 1);
  const soilPiles: THREE.Group[] = [];
  [[-W / 2 - 1.0, 0.5], [W / 2 + 0.9, -0.9], [-W / 2 - 0.8, -1.4], [W / 2 + 1.1, 1.3], [0.9, D / 2 + 1.2]]
    .forEach(([dx, dz]) => {
      const p = new THREE.Group();
      p.position.set(cx + dx, 0, cz + dz);
      sph(p, "#b98d54", 0.4, [0, 0.02, 0], [1.25, 0.5, 1.25], 1);
      sph(p, "#c49a5e", 0.27, [0.22, 0.1, 0.12], [1.2, 0.55, 1.2], 1);
      p.scale.setScalar(0.0001);
      g.add(p); soilPiles.push(p);
    });

  // concrete slab
  const slab = box(g, "#c9c9c4", [W - 0.15, 0.12, D - 0.15], [cx, -pitDepth + 0.04, cz], 0.7);
  slab.scale.set(0.0001, 1, 0.0001);

  // bricks
  const bricks = buildBricks(g);

  // paint: blue floor + inner wall panels (geometry origin at panel bottom,
  // so scale.y grows upward from the floor instead of from the centre)
  const paintFloor = box(g, "#1f8fd0", [W - 0.64, 0.05, D - 0.64], [cx, -pitDepth + 0.12, cz], 0.5);
  paintFloor.scale.set(0.0001, 1, 0.0001);
  const paintPanels: THREE.Mesh[] = [];
  const panelH = POOL.courses * POOL.brickH - 0.12;
  const panelBaseY = -pitDepth + 0.15;
  const mkPanel = (w: number, d: number, x: number, z: number) => {
    const geo = new THREE.BoxGeometry(w, panelH, d);
    geo.translate(0, panelH / 2, 0);
    const p = new THREE.Mesh(geo, smat("#2ea3dd", 0.5));
    p.position.set(x, panelBaseY, z);
    p.castShadow = false; p.receiveShadow = true;
    p.scale.y = 0.0001;
    g.add(p); paintPanels.push(p);
  };
  mkPanel(W - 0.64, 0.04, cx, cz + D / 2 - POOL.t - 0.02);
  mkPanel(W - 0.64, 0.04, cx, cz - D / 2 + POOL.t + 0.02);
  mkPanel(0.04, D - 0.64, cx + W / 2 - POOL.t - 0.02, cz);
  mkPanel(0.04, D - 0.64, cx - W / 2 + POOL.t + 0.02, cz);

  // water (unit-height box, scaled in story)
  const waterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#3fb9f0"), roughness: 0.12, metalness: 0,
    transparent: true, opacity: 0.85,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(W - 0.7, 1, D - 0.7), waterMat);
  water.position.set(cx, -pitDepth + 0.15, cz);
  water.scale.y = 0.0001; water.visible = false;
  g.add(water);
  const waterTop = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.7, D - 0.7),
    new THREE.MeshStandardMaterial({ color: new THREE.Color("#8fd8fa"), roughness: 0.05, transparent: true, opacity: 0.55 }),
  );
  waterTop.rotation.x = -Math.PI / 2;
  waterTop.position.set(cx, -pitDepth + 0.15, cz);
  waterTop.visible = false;
  g.add(waterTop);

  // float ring
  const ring = new THREE.Group();
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.14, 14, 28), smat("#ff7a3c", 0.55));
  torus.rotation.x = Math.PI / 2; torus.castShadow = true;
  ring.add(torus);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const seg = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.145, 10, 6, 0.7), smat("#ffffff", 0.55));
    seg.rotation.x = Math.PI / 2; seg.rotation.z = a;
    seg.castShadow = true; ring.add(seg);
  }
  ring.position.set(cx - 1.1, 3.2, cz + 0.3);
  ring.visible = false;
  g.add(ring);

  const { figure, figHead } = buildFigure(g);

  // clouds
  const clouds: THREE.Group[] = [];
  const cloudAt = (x: number, y: number, z: number, s: number) => {
    const c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(s); g.add(c);
    c.userData.baseX = x;
    const cm = smat("#ffffff", 1);
    [[0, 0, 0, 1.1], [0.95, -0.12, 0.2, 0.8], [-0.95, -0.1, -0.15, 0.85], [0.3, 0.3, -0.3, 0.7]]
      .forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(pr, 22, 16), cm);
        m.position.set(px, py, pz); m.scale.set(1.25, 0.72, 1); c.add(m);
      });
    clouds.push(c);
  };
  cloudAt(-11, 8.6, -16, 1.5); cloudAt(5, 9.4, -19, 1.8); cloudAt(14, 8.2, -14, 1.15);

  return {
    bricks, soilCap, soilPiles, slab, paintFloor, paintPanels,
    water, waterTop, ring, figure, figHead, outline, clouds,
  };
}
