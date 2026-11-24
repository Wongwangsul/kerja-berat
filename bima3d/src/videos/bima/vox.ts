import * as THREE from "three";

// Deterministic PRNG (mulberry32) so every frame/machine builds the same world.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const matCache = new Map<string, THREE.MeshLambertMaterial>();
export function mat(color: string) {
  let m = matCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); matCache.set(color, m); }
  return m;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export function box(
  parent: THREE.Object3D, color: string,
  sx: number, sy: number, sz: number,
  x: number, y: number, z: number,
  opts: { shadow?: boolean; material?: THREE.Material } = {},
) {
  const mesh = new THREE.Mesh(boxGeo, opts.material ?? mat(color));
  mesh.scale.set(sx, sy, sz);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.shadow ?? true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Bima's face painted on a canvas: skin bg, square eyes, brows, big toothy smile.
export function faceTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f3c39c"; g.fillRect(0, 0, 256, 256);
  // brows
  g.fillStyle = "#5a3a22";
  g.fillRect(52, 92, 44, 12); g.fillRect(160, 92, 44, 12);
  // eyes (square, slightly tall)
  g.fillStyle = "#1d1a17";
  g.fillRect(62, 118, 24, 30); g.fillRect(170, 118, 24, 30);
  // nose hint
  g.fillStyle = "#e0a878"; g.fillRect(118, 148, 20, 16);
  // big smile: dark mouth + white teeth
  g.fillStyle = "#7c3f2a";
  g.beginPath(); g.arc(128, 168, 52, 0.15 * Math.PI, 0.85 * Math.PI); g.closePath(); g.fill();
  g.fillStyle = "#ffffff"; g.fillRect(84, 172, 88, 16);
  g.fillStyle = "#7c3f2a"; g.fillRect(124, 172, 4, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tired face for the pegal beat: half-lidded eyes + flat mouth.
export function tiredFaceTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f3c39c"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#5a3a22";
  g.fillRect(52, 100, 44, 12); g.fillRect(160, 100, 44, 12);
  g.fillStyle = "#1d1a17";
  g.fillRect(62, 132, 24, 10); g.fillRect(170, 132, 24, 10);
  g.fillStyle = "#e0a878"; g.fillRect(118, 150, 20, 16);
  g.fillStyle = "#7c3f2a"; g.fillRect(96, 196, 64, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function headWithFace(face: THREE.Texture, skin: string) {
  const skinM = mat(skin);
  const faceM = new THREE.MeshLambertMaterial({ map: face });
  // Box material order: +x, -x, +y, -y, +z (face), -z
  const m = new THREE.Mesh(boxGeo, [skinM, skinM, skinM, skinM, faceM, skinM]);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoother = (v: number) => { v = clamp01(v); return v * v * v * (v * (v * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
