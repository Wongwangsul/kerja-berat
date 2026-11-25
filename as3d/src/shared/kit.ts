import * as THREE from "three";

// ------------------------------------------------------------------
// Smooth-shaded low-poly helpers (disalin dari proyek uji Rubah):
// flatShading SELALU false, segmen rapat, siluet membulat.
// ------------------------------------------------------------------

export function smat(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness: 0,
    flatShading: false,
  });
}

export function smatT(color: string, opacity: number, roughness = 0.9): THREE.MeshStandardMaterial {
  const m = smat(color, roughness);
  m.transparent = true;
  m.opacity = opacity;
  m.depthWrite = false;
  return m;
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

export function sphT(
  parent: THREE.Object3D, color: string, r: number, opacity: number,
  p: [number, number, number], s: [number, number, number] = [1, 1, 1],
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), smatT(color, opacity));
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = false; m.receiveShadow = false;
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

// ------------------------------------------------------------------
// Story helpers — murni fungsi frame, deterministik.
// ------------------------------------------------------------------

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const sstep = (a: number, b: number, f: number) => {
  const t = clamp01((f - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Giliran bicara aktif pada frame f (0..7), atau -1 di luar giliran. */
export function lineAt(lines: { i: number; f0: number; f1: number }[], f: number): number {
  for (const l of lines) if (f >= l.f0 && f <= l.f1) return l.i;
  return -1;
}

/** Nilai mulut 0..1 untuk karakter pada frame f (aman di luar rentang). */
export function mouthVal(mouth: Record<string, number[]>, key: string, f: number): number {
  const arr = mouth[key];
  if (!arr || arr.length === 0) return 0;
  const i = clamp(Math.round(f), 0, arr.length - 1);
  return arr[i] ?? 0;
}

/** Skala Y mata untuk kedipan deterministik: tutup 1 frame, buka 1 frame. */
export function blinkScale(f: number, offset: number, period = 120): number {
  const t = (f + offset) % period;
  if (t < 1) return lerp(1, 0.12, t);
  if (t < 2) return lerp(0.12, 1, t - 1);
  return 1;
}

/** Camera distance so a horizontal spread fits the 1080x1920 frame.
 *  Visible width at distance z (fov 42) ≈ z * 0.4318. */
export function fitZ(spread: number, margin = 1.2, zMin = 11, zMax = 19): number {
  return Math.max(zMin, Math.min(zMax, (spread + margin) / 0.4318));
}

/** Frame a pair by their true left/right extents: returns centre x + distance. */
export function frameExtent(left: number, right: number, margin = 1.2, zMin = 11, zMax = 19) {
  return { mid: (left + right) / 2, z: fitZ(right - left, margin, zMin, zMax) };
}
export function keyLerp<T extends Record<string, number>>(
  keys: (T & { f: number })[], f: number,
): T {
  if (keys.length === 0) throw new Error("keyLerp: no keys");
  if (f <= keys[0].f) { const { f: _f, ...rest } = keys[0]; return rest as T; }
  const last = keys[keys.length - 1];
  if (f >= last.f) { const { f: _f, ...rest } = last; return rest as T; }
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f >= a.f && f <= b.f) {
      const t = sstep(a.f, b.f, f);
      const out = {} as Record<string, number>;
      for (const k of Object.keys(a)) {
        if (k === "f") continue;
        out[k] = lerp(a[k] as number, b[k] as number, t);
      }
      return out as T;
    }
  }
  const { f: _f, ...rest } = last; return rest as T;
}

// ------------------------------------------------------------------
// Lingkungan bersama — gaya uji Rubah: siluet membulat, warna jenuh cerah.
// ------------------------------------------------------------------

export function groundDisc(scene: THREE.Object3D, color: string, r = 70): THREE.Mesh {
  const g = new THREE.Mesh(new THREE.CircleGeometry(r, 48), smat(color, 1));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true;
  scene.add(g); return g;
}

export function makeClouds(scene: THREE.Object3D, spots: [number, number, number, number][]): THREE.Group[] {
  const clouds: THREE.Group[] = [];
  for (const [x, y, z, s] of spots) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
    g.userData.baseX = x;
    const cm = smat("#ffffff", 1);
    [[0, 0, 0, 1.15], [1.0, -0.12, 0.2, 0.85], [-1.0, -0.1, -0.15, 0.9], [0.35, 0.32, -0.3, 0.75], [-0.45, 0.26, 0.3, 0.7]]
      .forEach(([cx, cy, cz, cr]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(cr, 24, 18), cm);
        m.position.set(cx, cy, cz); m.scale.set(1.25, 0.72, 1); g.add(m);
      });
    clouds.push(g);
  }
  return clouds;
}

export function driftClouds(clouds: THREE.Group[], f: number, speed = 0.0022) {
  clouds.forEach((c, i) => {
    c.position.x = (c.userData.baseX as number) + Math.sin(f * 0.004 + i * 1.7) * 0.7 + f * speed * (i + 1);
  });
}

export function makeSun(scene: THREE.Object3D, x: number, y: number, z: number, r = 1.6, color = "#ffd94d") {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18),
    new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z); scene.add(m); return m;
}

export function makeTree(scene: THREE.Object3D, x: number, z: number, s: number, trunk = "#8a5a36", greens: string[] = ["#3f9e4d", "#359046", "#49ac57"]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(g, trunk, 0.2, 0.3, 1.7, [0, 0.85, 0]);
  sph(g, greens[0], 1.35, [0, 2.6, 0]);
  sph(g, greens[1], 1.0, [0.85, 2.1, 0.3]);
  sph(g, greens[2], 0.95, [-0.8, 2.2, -0.25]);
  sph(g, greens[1], 0.8, [0.1, 3.3, -0.4]);
  return g;
}

export function makeBush(scene: THREE.Object3D, x: number, z: number, s: number, colors: string[] = ["#359046", "#3f9e4d"]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  sph(g, colors[0], 0.65, [0, 0.32, 0], [1.25, 0.75, 1]);
  sph(g, colors[1], 0.45, [0.55, 0.24, 0.2], [1.2, 0.75, 1]);
  sph(g, colors[1], 0.4, [-0.5, 0.22, -0.15], [1.2, 0.7, 1]);
  return g;
}

export function makeFlowers(scene: THREE.Object3D, n: number, seed: number, x0: number, x1: number, z0: number, z1: number, avoid?: (x: number, z: number) => boolean): THREE.Group[] {
  const r = rng(seed);
  const petalCols = ["#e86a8a", "#f2c14e", "#ffffff", "#b388e6", "#ff8a5c"];
  const out: THREE.Group[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    if (avoid && avoid(x, z)) continue;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    cyl(g, "#3f9e4d", 0.02, 0.03, 0.34, [0, 0.17, 0]);
    sph(g, petalCols[Math.floor(r() * petalCols.length)], 0.1, [0, 0.38, 0], [1, 0.8, 1], 0.6);
    g.userData.phase = r() * Math.PI * 2;
    out.push(g);
  }
  return out;
}

export function swayFlowers(flowers: THREE.Group[], f: number, amp = 0.06) {
  flowers.forEach((g, i) => {
    g.rotation.z = Math.sin(f * 0.03 + (g.userData.phase as number) + i * 0.7) * amp;
  });
}

export function makeGrassTufts(scene: THREE.Object3D, n: number, seed: number, x0: number, x1: number, z0: number, z1: number, colorA = "#57a83e", colorB = "#63b84a") {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    sph(scene, colorA, 0.17, [x, 0.07, z], [1.15, 0.55, 1.15]);
    sph(scene, colorB, 0.11, [x + 0.14, 0.05, z + 0.1], [1.1, 0.5, 1.1]);
  }
}

/** Gugus kilau bintang penutup: bola kecil putih/kuning, skala berdenyut. */
export function makeSparkles(parent: THREE.Object3D, spots: [number, number, number][], scale = 1): THREE.Group {
  const g = new THREE.Group();
  spots.forEach(([x, y, z], i) => {
    const s = sph(g, i % 2 === 0 ? "#fff7c0" : "#ffffff", 0.09 * scale, [x, y, z], [1, 1, 1], 0.4);
    s.castShadow = false;
    (s as THREE.Mesh).userData.phase = i * 1.3;
  });
  g.visible = false;
  parent.add(g);
  return g;
}

export function pulseSparkles(g: THREE.Group, f: number, visible: boolean) {
  g.visible = visible;
  if (!visible) return;
  g.children.forEach((c) => {
    const ph = (c as THREE.Mesh).userData.phase as number;
    const s = 0.7 + 0.5 * Math.abs(Math.sin(f * 0.12 + ph));
    c.scale.setScalar(s);
  });
}

/** Mata manik glossy: bola gelap + titik kilau putih. Kembalikan kedua mesh mata. */
export function makeEyes(headG: THREE.Group, x: number, y: number, z: number, r = 0.058, eyeColor = "#241d1a"): { eyeL: THREE.Mesh; eyeR: THREE.Mesh } {
  const eyeL = sph(headG, eyeColor, r, [x, y, z], [1, 1, 1], 0.25);
  const eyeR = sph(headG, eyeColor, r, [x, y, -z], [1, 1, 1], 0.25);
  sph(headG, "#ffffff", r * 0.34, [x + r * 0.06, y + r * 0.65, z + r * 0.12], [1, 1, 1], 0.2);
  sph(headG, "#ffffff", r * 0.34, [x + r * 0.06, y + r * 0.65, -z + r * 0.12], [1, 1, 1], 0.2);
  return { eyeL, eyeR };
}

export function applyBlink(eyeL: THREE.Mesh, eyeR: THREE.Mesh, f: number, offset: number, period = 120) {
  const s = blinkScale(f, offset, period);
  eyeL.scale.y = s; eyeR.scale.y = s;
}
