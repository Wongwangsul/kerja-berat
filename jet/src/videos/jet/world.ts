import * as THREE from "three";

// Su-57-style stealth jet over a sea of clouds at golden hour.
// Jet is built from primitives (flattened spheres, swept boxes, cylinders);
// the world moves (clouds stream past) while the jet performs in place.

export function smat(color: string, roughness = 0.9, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness, metalness, flatShading: false,
  });
}

function sph(parent: THREE.Object3D, mat: THREE.Material, r: number,
  p: [number, number, number], s: [number, number, number] = [1, 1, 1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18), mat);
  m.position.set(...p); m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

function box(parent: THREE.Object3D, mat: THREE.Material,
  size: [number, number, number], p: [number, number, number]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

function cyl(parent: THREE.Object3D, mat: THREE.Material, rTop: number, rBot: number, h: number,
  p: [number, number, number]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 20), mat);
  m.position.set(...p);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const x = c.getContext("2d")!;
  const grad = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  x.fillStyle = grad;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export interface JetRefs {
  jet: THREE.Group;
  burners: THREE.Sprite[];
  flames: THREE.Mesh[];
  clouds: THREE.InstancedMesh;
  cloudBase: { x: number; y: number; z: number; s: number }[];
  sunSprite: THREE.Sprite;
}

function buildJet(g: THREE.Group): { jet: THREE.Group; burners: THREE.Sprite[]; flames: THREE.Mesh[] } {
  const jet = new THREE.Group();
  g.add(jet);
  const hull = smat("#a7b0b8", 0.38, 0.45);
  const dark = smat("#8b959e", 0.45, 0.4);
  const glass = smat("#16222e", 0.12, 0.65);

  // fuselage: blended flattened spheres, nose toward -z
  sph(jet, hull, 1, [0, 0, 0.4], [0.62, 0.44, 2.4]);
  sph(jet, hull, 1, [0, -0.02, -1.9], [0.44, 0.32, 1.5]);
  sph(jet, hull, 1, [0, -0.03, -3.3], [0.2, 0.15, 0.9]);
  // canopy + spine
  sph(jet, glass, 1, [0, 0.3, -1.15], [0.33, 0.2, 0.72]);
  sph(jet, dark, 1, [0, 0.22, 0.15], [0.3, 0.16, 1.5]);
  // wings (swept, slight dihedral)
  for (const sx of [1, -1]) {
    const w = box(jet, dark, [2.7, 0.07, 1.15], [sx * 1.5, -0.1, 0.75]);
    w.rotation.y = sx * -0.52;
    w.rotation.z = sx * 0.05;
    // canted twin tails
    const fin = box(jet, dark, [0.07, 0.9, 0.85], [sx * 0.58, 0.48, 2.0]);
    fin.rotation.z = sx * -0.42;
    fin.rotation.y = sx * -0.12;
    // stabilators
    const st = box(jet, dark, [1.15, 0.06, 0.62], [sx * 0.92, 0.0, 2.25]);
    st.rotation.y = sx * -0.3;
    // intake block
    box(jet, smat("#6d767e", 0.55, 0.3), [0.42, 0.3, 1.5], [sx * 0.52, -0.3, -0.1]);
    // underwing missile
    const mis = cyl(jet, smat("#d5d9dc", 0.4, 0.3), 0.055, 0.055, 0.95, [sx * 1.55, -0.26, 0.55]);
    mis.rotation.x = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 12), smat("#c8ccd0", 0.4, 0.3));
    tip.position.set(sx * 1.55, -0.26, 0.02);
    tip.rotation.x = -Math.PI / 2;
    jet.add(tip);
  }
  // engines + nozzles + burner glow + flames
  const burners: THREE.Sprite[] = [];
  const flames: THREE.Mesh[] = [];
  const flameMat = new THREE.MeshBasicMaterial({
    color: "#ff9a3c", transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  for (const sx of [1, -1]) {
    const eng = cyl(jet, smat("#79828b", 0.4, 0.55), 0.21, 0.23, 1.7, [sx * 0.34, -0.04, 1.55]);
    eng.rotation.x = Math.PI / 2;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture("rgba(255,190,90,1)", "rgba(255,120,30,0)"),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
    }));
    glow.position.set(sx * 0.34, -0.04, 2.48);
    glow.scale.set(0.85, 0.85, 1);
    jet.add(glow);
    burners.push(glow);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.6, 14), flameMat.clone());
    flame.position.set(sx * 0.34, -0.04, 3.25);
    flame.rotation.x = Math.PI / 2;
    jet.add(flame);
    flames.push(flame);
  }
  return { jet, burners, flames };
}

export function buildJetWorld(scene: THREE.Scene): JetRefs {
  const g = scene as unknown as THREE.Group;
  const r = rng(31);

  // sun glow low on the horizon (behind the jet's flight path)
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture("rgba(255,214,140,1)", "rgba(255,150,60,0)"),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95,
  }));
  sunSprite.position.set(-16, 3.5, -95);
  sunSprite.scale.set(46, 46, 1);
  g.add(sunSprite);

  // cloud sea: clustered puffs (3-5 overlapping spheres per cloud) so the
  // masses read as soft cumulus instead of flat lentils
  const cloudGeo = new THREE.SphereGeometry(1, 18, 12);
  const cloudMat = smat("#fff6e8", 1);
  const cloudBase: JetRefs["cloudBase"] = [];
  const CLUSTERS = 44;
  for (let c = 0; c < CLUSTERS; c++) {
    const cx = (r() - 0.5) * 90;
    const cy = -6.8 - r() * 4.5 + (Math.abs(cx) > 30 ? 2.5 : 0);
    const cz = 30 - r() * 165;
    const cs = 3 + r() * 4.5;
    const puffs = 3 + Math.floor(r() * 3);
    for (let p = 0; p < puffs; p++) {
      cloudBase.push({
        x: cx + (r() - 0.5) * cs * 1.15,
        y: cy + (r() - 0.5) * 0.9,
        z: cz + (r() - 0.5) * cs * 0.8,
        s: cs * (0.45 + r() * 0.4),
      });
    }
  }
  const N = cloudBase.length;
  const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, N);
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    clouds.setColorAt(i, col.setHSL(0.09, 0.22, 0.9 + r() * 0.07));
  }
  clouds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  g.add(clouds);
  // a few high wisps (soft, only mildly flattened)
  for (let i = 0; i < 5; i++) {
    const w = sph(g, smat("#fff8ec", 1), 1,
      [(r() - 0.5) * 90, 8 + r() * 6, -55 - r() * 65],
      [4 + r() * 3, 1.1 + r() * 0.6, 2.4 + r() * 1.4]);
    w.castShadow = false;
  }

  const { jet, burners, flames } = buildJet(g);
  return { jet, burners, flames, clouds, cloudBase, sunSprite };
}
