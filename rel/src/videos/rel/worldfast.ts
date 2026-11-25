import * as THREE from "three";
import {
  smat, sph, box, cyl, rng,
  buildPoints, buildSwitchStand, buildTrain, buildMan,
} from "./world";

// Fast-cut variant world: rails are built from 5 m segments so a stretch
// can buckle in the heat and one joint gap can visibly close. Adds a big
// sun prop and a sweat drop for the heat scene. Everything else (canyon,
// switch stand, train, engineer) reuses the base builders.

export interface FastRefs {
  lever: THREE.Group;
  pointsL: THREE.Group;
  pointsR: THREE.Group;
  train: THREE.Group;
  wheels: THREE.Mesh[];
  smoke: THREE.Mesh[];
  lampGlow: THREE.Sprite;
  man: THREE.Group;
  headG: THREE.Group;
  armL: THREE.Group; armR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;
  cap: THREE.Group;
  scarf: THREE.Mesh;
  segments: THREE.Group[];      // rail segment groups, both sides, z order
  buckleIdx: number[];          // indices into segments forming the buckle zone
  jointA: THREE.Group[];        // segment pair at the z=5 joint (both sides)
  jointB: THREE.Group[];
  sun: THREE.Group;
  sweat: THREE.Mesh;
}

export function buildWorldFast(scene: THREE.Scene): FastRefs {
  const g = scene as unknown as THREE.Group;
  const r = rng(47);

  // ---- ground, ballast, sleepers, stones (as the base world)
  const sand = new THREE.Mesh(new THREE.CircleGeometry(160, 40), smat("#dfb77e", 1));
  sand.rotation.x = -Math.PI / 2; sand.position.y = -0.06; sand.receiveShadow = true; g.add(sand);
  box(g, "#9b8a76", [4.6, 0.18, 122], [0, 0.02, -42], 1);

  const sleeperGeo = new THREE.BoxGeometry(2.3, 0.09, 0.52);
  const sleepers = new THREE.InstancedMesh(sleeperGeo, smat("#6e5136", 1), 128);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < 128; i++) {
    mtx.makeRotationY((r() - 0.5) * 0.02);
    mtx.setPosition((r() - 0.5) * 0.05, 0.13, 14 - i * 0.95);
    sleepers.setMatrixAt(i, mtx);
  }
  sleepers.receiveShadow = true;
  g.add(sleepers);

  const stones = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), smat("#a08b74", 1, true), 800);
  const col = new THREE.Color();
  let placed = 0;
  while (placed < 800) {
    const sx = (r() - 0.5) * 4.1;
    if (Math.abs(Math.abs(sx) - 0.75) < 0.2) continue;
    const s = 0.55 + r() * 0.75;
    mtx.makeRotationFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
    mtx.scale(new THREE.Vector3(s, s * 0.7, s));
    mtx.setPosition(sx, 0.05 + r() * 0.04, 15 - r() * 118);
    stones.setMatrixAt(placed, mtx);
    stones.setColorAt(placed, col.setHSL(0.08 + r() * 0.03, 0.18 + r() * 0.15, 0.42 + r() * 0.2));
    placed++;
  }
  stones.receiveShadow = true;
  g.add(stones);

  // ---- segmented rails: 23 segments of 5 m per side, z from +15 to -100
  const steel = new THREE.MeshStandardMaterial({ color: new THREE.Color("#aeb8c0"), roughness: 0.42, metalness: 0.35 });
  const segments: THREE.Group[] = [];
  const segIndexByKey = new Map<string, THREE.Group>();
  for (let i = 0; i < 23; i++) {
    const zTop = 15 - i * 5;
    for (const sx of [1, -1]) {
      const grp = new THREE.Group();
      grp.position.set(sx * 0.75, 0.24, zTop);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 4.93), steel);
      rail.position.set(0, 0, -2.5);
      rail.castShadow = true; rail.receiveShadow = true;
      grp.add(rail);
      g.add(grp);
      segments.push(grp);
      segIndexByKey.set(`${i}:${sx}`, grp);
    }
  }
  // buckle zone: segments with centre z in [-15, -5] -> i where zTop in {-5,-10,-15}
  const buckleIdx: number[] = [];
  segments.forEach((grp, idx) => {
    const cz = grp.position.z - 2.5;
    if (cz <= -5 && cz >= -17.5) buckleIdx.push(idx);
  });
  // joint at z=5: segment i=1 covers ~5..10 (A, far side), i=2 covers ~0..5 (B, near side)
  const jointA = [segIndexByKey.get("1:1")!, segIndexByKey.get("1:-1")!];
  const jointB = [segIndexByKey.get("2:1")!, segIndexByKey.get("2:-1")!];
  // fishplates straddling the joint (attached to B so they ride along)
  for (const b of jointB) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.7), smat("#5a5148", 0.6));
    plate.position.set(b.position.x > 0 ? -0.075 : 0.075, 0, 0.05);
    b.add(plate);
  }

  // ---- canyon slabs + mesas + cacti (trimmed copy of the base set)
  const rockCols = ["#b4502e", "#a8432a", "#c05a36"];
  const slab = (x: number, y: number, z: number, size: [number, number, number], i: number, rotY = 0) => {
    const m = box(g, rockCols[i % 3], size, [x, y, z], 1, true);
    m.rotation.y = rotY;
    m.castShadow = false;
    return m;
  };
  slab(-14.5, 1.4, -8, [7, 2.8, 20], 0, 0.05);
  slab(-15, 3.6, -14, [7.5, 2.2, 26], 1, -0.04);
  slab(-14.8, 2.0, -27, [7.5, 2.6, 18], 2, 0.02);
  slab(-15.5, 5.4, -24, [8, 2.0, 30], 2, 0.03);
  slab(-14, 1.1, -34, [6.5, 2.2, 18], 1, 0);
  slab(-16, 3.2, -48, [8, 2.6, 26], 0, -0.05);
  slab(15.5, 1.2, -20, [7, 2.4, 22], 1, -0.04);
  slab(16, 3.1, -30, [7.5, 2.0, 26], 2, 0.04);
  slab(16.5, 4.7, -44, [8, 1.9, 28], 0, 0);
  [[-16, -78, 7], [4, -85, 9], [20, -76, 6]].forEach(([x, z, w], i) => {
    box(g, rockCols[i % 3], [w * 2, 3.2, 6], [x, 1.2, z], 1, true);
    box(g, rockCols[(i + 1) % 3], [w * 1.5, 2.4, 5], [x, 3.8, z], 1, true);
    box(g, rockCols[(i + 2) % 3], [w * 1.05, 1.8, 4], [x, 5.9, z], 1, true);
  });
  const cactus = (x: number, z: number, s: number) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.scale.setScalar(s); g.add(c);
    cyl(c, smat("#3f7d4e", 0.9), 0.16, 0.19, 1.5, [0, 0.75, 0]);
    cyl(c, smat("#3f7d4e", 0.9), 0.11, 0.12, 0.6, [0.32, 1.0, 0]);
    cyl(c, smat("#3f7d4e", 0.9), 0.11, 0.12, 0.45, [-0.3, 0.85, 0]);
  };
  cactus(-3.4, 4.5, 1); cactus(-4.4, -1.5, 0.75); cactus(5.6, -3.5, 0.9);
  const stoneCols = ["#c9a06b", "#bb9057", "#d4af77"];
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 26;
    if (Math.abs(x) < 3.2) continue;
    sph(g, stoneCols[i % 3], 0.16 + r() * 0.3, [x, 0.05, 8 - r() * 60], [1.2, 0.6, 1.1], 1);
  }

  // ---- sun prop (heat scene)
  const sun = new THREE.Group();
  sun.position.set(-13, 14.5, -52);
  g.add(sun);
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(3.1, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#ffd76a" }),
  );
  sun.add(sunBall);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const x = c.getContext("2d")!;
      const grad = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, "rgba(255,214,110,0.85)");
      grad.addColorStop(1, "rgba(255,180,60,0)");
      x.fillStyle = grad; x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sunGlow.scale.set(17, 17, 1);
  sun.add(sunGlow);
  sun.visible = false;

  // ---- shared builders
  const { pointsL, pointsR } = buildPoints(g);
  const lever = buildSwitchStand(g);
  const { train, wheels, smoke, lampGlow } = buildTrain(g);
  const manRefs = buildMan(g);

  // sweat drop on the engineer's head (heat scene)
  const sweat = sph(manRefs.headG, "#57b7e8", 0.075, [0.3, 0.12, 0.36], [0.75, 1.15, 0.75], 0.3);
  sweat.visible = false;

  return {
    lever, pointsL, pointsR, train, wheels, smoke, lampGlow,
    man: manRefs.man, headG: manRefs.headG,
    armL: manRefs.armL, armR: manRefs.armR,
    legL: manRefs.legL, legR: manRefs.legR,
    cap: manRefs.cap, scarf: manRefs.scarf,
    segments, buckleIdx, jointA, jointB, sun, sweat,
  };
}
