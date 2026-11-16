// A 3D layer for a film: a three.js canvas over the stage, drawn only when the film asks for a frame.
//
//   const space = createStage3D(document.querySelector("#space"));
//   const ball = new space.THREE.Mesh(new space.THREE.SphereGeometry(4, 64, 48), space.materials.ceramic());
//   space.scene.add(ball);
//   film.each((t) => { ball.rotation.y = state.turn; space.render(state.vis); });
//
// The camera looks down -z from DIST away with a narrow lens, so at z = 0 one world unit is UNIT pixels and a thing
// can be placed by pixels with space.at(xPx, yPx) (from the frame's centre, y down, like the page).
// Use 3D where it explains something physical or spatial. Type, panels and diagrams stay HTML and SVG.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createStage3D(canvas, { distance = 100, fov = 30, exposure = 1.05, environment = 0.42 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = environment;
  const camera = new THREE.PerspectiveCamera(fov, canvas.width / canvas.height, 1, 2000);
  camera.position.set(0, 0, distance);
  const UNIT = canvas.height / (2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2)));

  // Studio light: a key from the upper left and a rim from behind, both in the scene's own colour.
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(-40, 60, 90);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(70, -20, -30);
  scene.add(key, rim);

  // Materials that read as real things under this light. Each call makes a new one, so a film can tune its own.
  const materials = {
    ceramic: (color = 0xf1f1f4) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.05, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    gold: (color = 0xd9a032) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    graphite: (color = 0x1c1c20) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.46 }),
    glass: (color = 0xffffff) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.06, transmission: 0.92, thickness: 2, ior: 1.45 }),
    glow: (color = 0xffb21a, power = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: power, roughness: 0.4 }),
  };

  let blank = false;
  return {
    THREE,
    renderer,
    scene,
    camera,
    key,
    rim,
    materials,
    UNIT,
    // A position on the z = 0 plane from pixels off the frame's centre (y down).
    at: (x, y, z = 0) => new THREE.Vector3(x / UNIT, -y / UNIT, z),
    // Draws the layer at the given opacity; at zero it clears once and then costs nothing.
    render(opacity = 1) {
      canvas.style.opacity = opacity;
      if (opacity <= 0.001) {
        if (!blank) renderer.clear();
        blank = true;
        return;
      }
      blank = false;
      renderer.render(scene, camera);
    },
  };
}
