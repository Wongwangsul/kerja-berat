import * as THREE from "three";

// Hybrid test scene: detailed 3D railroad world + flat-look stickman actor.
// World: desert canyon, track with instanced sleepers + ballast stones,
// a switch stand with lever and moving points, a steam locomotive with
// a wagon and recycled smoke puffs. Actor: white round head (toon outline),
// striped cap (canvas texture), drawn face (canvas texture), stick limbs.

export function smat(color: string, roughness = 0.9, flat = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness: 0,
    flatShading: flat,
  });
}

export function sph(
  parent: THREE.Object3D, color: string, r: number,
  p: [number, number, number], s: [number, number, number] = [1, 1, 1],
  roughness = 0.9,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18), smat(color, roughness));
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function box(
  parent: THREE.Object3D, color: string,
  size: [number, number, number], p: [number, number, number],
  roughness = 0.9, flat = false,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), smat(color, roughness, flat));
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function cyl(
  parent: THREE.Object3D, mat: THREE.Material, rTop: number, rBot: number, h: number,
  p: [number, number, number], seg = 22,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export interface WorldRefs {
  lever: THREE.Group;          // pivot at the switch-stand top
  pointsL: THREE.Group;        // moving point blades
  pointsR: THREE.Group;
  train: THREE.Group;
  wheels: THREE.Mesh[];
  lampGlow: THREE.Sprite;
  smoke: THREE.Mesh[];         // recycled puffs
  man: THREE.Group;
  headG: THREE.Group;
  armL: THREE.Group; armR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;
  cap: THREE.Group;
  scarf: THREE.Mesh;
}

function stripeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const x = c.getContext("2d")!;
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 === 0 ? "#2b5aa6" : "#f4f6f8";
    x.fillRect(i * 16, 0, 16, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function faceTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 192;
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 256, 192);
  x.fillStyle = "#241d1a";
  // smug half-lidded eyes
  x.save(); x.translate(78, 84); x.rotate(0.10);
  x.beginPath(); x.ellipse(0, 0, 17, 10, 0, 0, Math.PI * 2); x.fill(); x.restore();
  x.save(); x.translate(168, 84); x.rotate(-0.10);
  x.beginPath(); x.ellipse(0, 0, 17, 10, 0, 0, Math.PI * 2); x.fill(); x.restore();
  x.strokeStyle = "#241d1a"; x.lineWidth = 6; x.lineCap = "round";
  x.beginPath(); x.moveTo(58, 66); x.lineTo(98, 72); x.stroke();
  x.beginPath(); x.moveTo(188, 66); x.lineTo(148, 72); x.stroke();
  // small satisfied mouth
  x.lineWidth = 7;
  x.beginPath(); x.arc(126, 118, 20, Math.PI * 0.15, Math.PI * 0.75); x.stroke();
  return new THREE.CanvasTexture(c);
}

function buildTrack(g: THREE.Group) {
  const r = rng(47);
  // ballast bed + sand
  const sand = new THREE.Mesh(new THREE.CircleGeometry(160, 40), smat("#dfb77e", 1));
  sand.rotation.x = -Math.PI / 2; sand.position.y = -0.06; sand.receiveShadow = true; g.add(sand);
  box(g, "#9b8a76", [4.6, 0.18, 122], [0, 0.02, -42], 1);

  // sleepers (instanced)
  const sleeperGeo = new THREE.BoxGeometry(2.3, 0.09, 0.52);
  const sleeperMat = smat("#6e5136", 1);
  const nS = 128;
  const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, nS);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < nS; i++) {
    mtx.makeRotationY((r() - 0.5) * 0.02);
    mtx.setPosition((r() - 0.5) * 0.05, 0.13, 14 - i * 0.95);
    sleepers.setMatrixAt(i, mtx);
  }
  sleepers.receiveShadow = true; sleepers.castShadow = false;
  g.add(sleepers);

  // ballast stones (instanced)
  const stoneGeo = new THREE.IcosahedronGeometry(0.11, 0);
  const stoneMat = smat("#a08b74", 1, true);
  const nSt = 800;
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, nSt);
  const col = new THREE.Color();
  for (let i = 0; i < nSt; i++) {
    const sx = (r() - 0.5) * 4.1;
    if (Math.abs(Math.abs(sx) - 0.75) < 0.2) { i--; continue; }   // keep stones off the rail lines
    const s = 0.55 + r() * 0.75;
    mtx.makeRotationFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
    mtx.scale(new THREE.Vector3(s, s * 0.7, s));
    mtx.setPosition(sx, 0.05 + r() * 0.04, 15 - r() * 118);
    stones.setMatrixAt(i, mtx);
    stones.setColorAt(i, col.setHSL(0.08 + r() * 0.03, 0.18 + r() * 0.15, 0.42 + r() * 0.2));
  }
  stones.receiveShadow = true;
  g.add(stones);

  // rails (stylised steel: low metalness so it reads bright without an env map)
  const steel = new THREE.MeshStandardMaterial({ color: new THREE.Color("#aeb8c0"), roughness: 0.42, metalness: 0.35 });
  for (const sx of [1, -1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 122), steel);
    rail.position.set(sx * 0.75, 0.24, -42);
    rail.castShadow = true; rail.receiveShadow = true;
    g.add(rail);
  }
}

function buildPoints(g: THREE.Group): { pointsL: THREE.Group; pointsR: THREE.Group } {
  const steel = new THREE.MeshStandardMaterial({ color: new THREE.Color("#b4bec6"), roughness: 0.4, metalness: 0.35 });
  const mk = (x: number) => {
    const grp = new THREE.Group();
    grp.position.set(x, 0.24, 4.6);   // pivot at the heel of the point blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 3.4), steel);
    blade.position.set(0, 0, -1.7);
    blade.castShadow = true;
    grp.add(blade);
    g.add(grp);
    return grp;
  };
  return { pointsL: mk(-0.68), pointsR: mk(0.68) };
}

function buildSwitchStand(g: THREE.Group): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(2.45, 0, 2.6);
  g.add(grp);
  box(grp, "#3d3d40", [0.3, 0.85, 0.3], [0, 0.43, 0]);
  box(grp, "#56565a", [0.46, 0.1, 0.46], [0, 0.9, 0]);
  // target disc on top
  const disc = cyl(grp, smat("#c23b2e", 0.5), 0.13, 0.13, 0.05, [0, 1.2, 0]);
  disc.rotation.x = Math.PI / 2;
  cyl(grp, smat("#3d3d40"), 0.035, 0.035, 0.3, [0, 1.05, 0]);
  // lever pivot at stand top; arm + handle + counterweight
  const lever = new THREE.Group();
  lever.position.set(0, 0.92, 0);
  grp.add(lever);
  const arm = cyl(lever, smat("#2e2e32", 0.5), 0.04, 0.04, 1.15, [0, 0.55, 0]);
  void arm;
  sph(lever, "#c23b2e", 0.075, [0, 1.16, 0], [1, 1, 1], 0.45);
  sph(lever, "#2e2e32", 0.13, [0, -0.12, 0], [1, 0.8, 1], 0.5);
  lever.rotation.z = -0.85;   // resting: leaning toward the track
  return lever;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const x = c.getContext("2d")!;
  const grad = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, "rgba(255,225,160,1)");
  grad.addColorStop(0.35, "rgba(255,190,90,0.55)");
  grad.addColorStop(1, "rgba(255,170,60,0)");
  x.fillStyle = grad;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function buildTrain(g: THREE.Group): { train: THREE.Group; wheels: THREE.Mesh[]; smoke: THREE.Mesh[]; lampGlow: THREE.Sprite } {
  const train = new THREE.Group();
  g.add(train);
  const wheels: THREE.Mesh[] = [];
  const wheelMat = smat("#1d1d20", 0.5);
  const addWheel = (parent: THREE.Group, r: number, x: number, y: number, z: number) => {
    const w = cyl(parent, wheelMat, r, r, 0.1, [x, y, z]);
    w.rotation.z = Math.PI / 2;
    wheels.push(w);
    return w;
  };
  // locomotive
  const loco = new THREE.Group(); train.add(loco);
  const boiler = cyl(loco, smat("#26343a", 0.42), 0.58, 0.58, 2.9, [0, 1.18, 0.5]);
  boiler.rotation.x = Math.PI / 2;
  cyl(loco, smat("#1d1d20", 0.5), 0.62, 0.62, 0.25, [0, 1.18, 1.95]);            // smokebox door
  const chim = cyl(loco, smat("#1d1d20", 0.5), 0.24, 0.15, 0.55, [0, 1.95, 1.55]);
  void chim;
  cyl(loco, smat("#8c6d2f", 0.35), 0.2, 0.24, 0.3, [0, 1.86, 0.75]);              // brass dome
  box(loco, "#1d1d20", [1.5, 0.18, 4.6], [0, 0.52, 0]);                          // frame
  box(loco, "#31444c", [1.45, 1.55, 1.35], [0, 1.5, -1.55]);                     // cab
  box(loco, "#1d1d20", [1.7, 0.12, 1.6], [0, 2.34, -1.55]);                      // cab roof
  box(loco, "#0f1518", [0.5, 0.6, 0.06], [0.4, 1.75, -0.86]);                    // cab windows
  box(loco, "#0f1518", [0.5, 0.6, 0.06], [-0.4, 1.75, -0.86]);
  const cow = box(loco, "#b03a2e", [1.5, 0.75, 0.9], [0, 0.42, 2.25], 0.6);       // cowcatcher
  cow.rotation.x = 0.6;
  sph(loco, "#ffd97a", 0.16, [0, 1.35, 2.12], [1, 1, 1], 0.25);                  // headlamp glow
  box(loco, "#1d1d20", [0.4, 0.3, 0.18], [0, 1.35, 2.0]);
  const lamp = new THREE.PointLight(0xffc46b, 30, 26, 1.6);
  lamp.position.set(0, 1.35, 2.4); loco.add(lamp);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: 0xffe2a8, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  lampGlow.position.set(0, 1.35, 2.35);
  lampGlow.scale.set(2.1, 2.1, 1);
  loco.add(lampGlow);
  for (const sx of [1, -1]) {
    addWheel(loco, 0.46, sx * 0.72, 0.46, 0.9);
    addWheel(loco, 0.46, sx * 0.72, 0.46, -0.15);
    addWheel(loco, 0.3, sx * 0.72, 0.3, 1.75);
    addWheel(loco, 0.3, sx * 0.72, 0.3, -1.5);
  }
  // one freight wagon
  const wag = new THREE.Group(); wag.position.z = -4.6; train.add(wag);
  box(wag, "#7a4a2c", [1.55, 1.35, 3.1], [0, 1.25, 0], 0.85);
  box(wag, "#5d3820", [1.65, 0.14, 3.3], [0, 0.5, 0]);
  for (const sx of [1, -1]) {
    addWheel(wag, 0.34, sx * 0.72, 0.34, 1.0);
    addWheel(wag, 0.34, sx * 0.72, 0.34, -1.0);
  }
  train.position.set(0, 0, -95);

  // smoke puffs (recycled; story.ts drives them)
  const smoke: THREE.Mesh[] = [];
  const smokeMat = () => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e8e4de"), roughness: 1, transparent: true, opacity: 0,
  });
  for (let i = 0; i < 30; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), smokeMat());
    p.visible = false;
    g.add(p);
    smoke.push(p);
  }
  return { train, wheels, smoke, lampGlow };
}

function buildMan(g: THREE.Group) {
  const man = new THREE.Group();
  man.position.set(2.82, 0, 2.75);
  g.add(man);
  const black = smat("#26221f", 0.7);

  const headG = new THREE.Group();
  headG.position.set(0, 1.62, 0);
  man.add(headG);
  // toon outline: slightly larger black sphere, back side only
  const outline = new THREE.Mesh(
    new THREE.SphereGeometry(0.455, 26, 18),
    new THREE.MeshBasicMaterial({ color: "#26221f", side: THREE.BackSide }),
  );
  headG.add(outline);
  sph(headG, "#ffffff", 0.43, [0, 0, 0], [1, 1, 1], 0.55);
  // face (canvas texture on a plane hugging the head front)
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.39),
    new THREE.MeshBasicMaterial({ map: faceTexture(), transparent: true }),
  );
  face.position.set(0, -0.02, 0.415);
  headG.add(face);
  // striped cap
  const cap = new THREE.Group();
  cap.position.set(0, 0.3, 0);
  headG.add(cap);
  const capMat = new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.8 });
  const capTop = cyl(cap, capMat, 0.46, 0.47, 0.2, [0, 0.05, 0]);
  capTop.scale.set(1, 1, 1);
  sph(cap, "#2b5aa6", 0.46, [0, 0.14, 0], [1, 0.35, 1], 0.8);
  const brim = box(cap, "#2b5aa6", [0.62, 0.05, 0.34], [0, -0.03, 0.48], 0.8);
  brim.rotation.x = 0.1;

  // torso: teal work shirt, slightly leaning capsule
  const torso = sph(man, "#2e9e8f", 0.34, [0, 1.08, 0], [1.05, 1.25, 0.8], 0.85);
  void torso;
  box(man, "#257d72", [0.5, 0.34, 0.3], [0, 0.78, 0], 0.9);
  // red neckerchief: a flattened band at the neck
  const scarf = sph(man, "#c23b2e", 0.13, [0.02, 1.38, 0.16], [1.5, 0.55, 0.95], 0.7);

  const limb = (parent: THREE.Group, x: number, y: number, len: number) => {
    const grp = new THREE.Group();
    grp.position.set(x, y, 0);
    parent.add(grp);
    cyl(grp, black, 0.05, 0.045, len, [0, -len / 2, 0]);
    return grp;
  };
  const armL = limb(man, -0.36, 1.32, 0.62);
  const armR = limb(man, 0.36, 1.32, 0.62);
  sph(armL, "#26221f", 0.075, [0, -0.64, 0], [1, 1, 1], 0.6);
  sph(armR, "#26221f", 0.075, [0, -0.64, 0]);
  const legL = limb(man, -0.16, 0.82, 0.8);
  const legR = limb(man, 0.16, 0.82, 0.8);
  box(legL, "#26221f", [0.16, 0.08, 0.3], [0, -0.82, 0.06]);
  box(legR, "#26221f", [0.16, 0.08, 0.3], [0, -0.82, 0.06]);

  return { man, headG, armL, armR, legL, legR, cap, scarf };
}

export function buildWorld(scene: THREE.Scene): WorldRefs {
  const g = scene as unknown as THREE.Group;
  const r = rng(9);

  // canyon walls: faceted red rock masses both sides + layered mesas behind
  const rockCols = ["#b4502e", "#a8432a", "#c05a36"];
  // canyon walls: stacked strata slabs flanking the track corridor,
  // kept clear of the vanishing point so the train reads from far away
  const slab = (x: number, y: number, z: number, size: [number, number, number], i: number, rotY = 0) => {
    const m = box(g, rockCols[i % 3], size, [x, y, z], 1, true);
    m.rotation.y = rotY;
    m.castShadow = false;
    return m;
  };
  // left wall
  slab(-14.5, 1.4, -8, [7, 2.8, 20], 0, 0.05);
  slab(-15, 3.6, -14, [7.5, 2.2, 26], 1, -0.04);
  slab(-14.8, 2.0, -27, [7.5, 2.6, 18], 2, 0.02);
  slab(-15.5, 5.4, -24, [8, 2.0, 30], 2, 0.03);
  slab(-14, 1.1, -34, [6.5, 2.2, 18], 1, 0);
  slab(-16, 3.2, -48, [8, 2.6, 26], 0, -0.05);
  // right wall (further back, lower — the man stands on this side)
  slab(15.5, 1.2, -20, [7, 2.4, 22], 1, -0.04);
  slab(16, 3.1, -30, [7.5, 2.0, 26], 2, 0.04);
  slab(16.5, 4.7, -44, [8, 1.9, 28], 0, 0);
  // mesas on the horizon
  [[-16, -78, 7], [4, -85, 9], [20, -76, 6]].forEach(([x, z, w], i) => {
    box(g, rockCols[i % 3], [w * 2, 3.2, 6], [x, 1.2, z], 1, true);
    box(g, rockCols[(i + 1) % 3], [w * 1.5, 2.4, 5], [x, 3.8, z], 1, true);
    box(g, rockCols[(i + 2) % 3], [w * 1.05, 1.8, 4], [x, 5.9, z], 1, true);
  });
  // cacti near the switch
  const cactus = (x: number, z: number, s: number) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.scale.setScalar(s); g.add(c);
    cyl(c, smat("#3f7d4e", 0.9), 0.16, 0.19, 1.5, [0, 0.75, 0]);
    cyl(c, smat("#3f7d4e", 0.9), 0.11, 0.12, 0.6, [0.32, 1.0, 0]);
    cyl(c, smat("#3f7d4e", 0.9), 0.11, 0.12, 0.45, [-0.3, 0.85, 0]);
  };
  cactus(-3.4, 4.5, 1); cactus(-4.4, -1.5, 0.75); cactus(5.6, -3.5, 0.9);
  // scattered desert stones off-track
  const stoneCols = ["#c9a06b", "#bb9057", "#d4af77"];
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * 26;
    if (Math.abs(x) < 3.2) continue;
    const z = 8 - r() * 60;
    sph(g, stoneCols[i % 3], 0.16 + r() * 0.3, [x, 0.05, z], [1.2, 0.6, 1.1], 1);
  }

  buildTrack(g);
  const { pointsL, pointsR } = buildPoints(g);
  const lever = buildSwitchStand(g);
  const { train, wheels, smoke, lampGlow } = buildTrain(g);
  const manRefs = buildMan(g);

  return {
    lever, pointsL, pointsR, train, wheels, smoke, lampGlow,
    man: manRefs.man, headG: manRefs.headG,
    armL: manRefs.armL, armR: manRefs.armR,
    legL: manRefs.legL, legR: manRefs.legR,
    cap: manRefs.cap, scarf: manRefs.scarf,
  };
}
