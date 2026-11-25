import * as THREE from "three";
import { WorldRefs, POOL } from "./world";

// Timeline (750 frames @30fps = 25 s):
//   0–70    outline pegs+string on the empty plot, camera settles
//   70–160  digging: sand cap shrinks away, soil piles grow
//   165–215 concrete slab scales in
//   205–467 bricks pop in course by course (per-brick schedule in world.ts)
//   480–550 interior painted bright blue (floor, then wall panels)
//   555–645 water rises
//   650–672 float ring drops in and settles
//   665–685 tiny figure pops in, seated on the far wall
//   685–750 gentle finale: ring bobbing, head bob, camera push-in

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (p: number) => p * p * (3 - 2 * p);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const easeOutBounce = (p: number) => {
  const n1 = 7.5625, d1 = 2.75;
  if (p < 1 / d1) return n1 * p * p;
  if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
  if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
  return n1 * (p -= 2.625 / d1) * p + 0.984375;
};

const CAM_KEYS: [number, [number, number, number]][] = [
  [0, [11.6, 7.6, 15.4]],
  [240, [10.4, 6.7, 13.8]],
  [480, [9.6, 6.1, 13.0]],
  [750, [8.6, 5.5, 11.9]],
];

function camPos(frame: number): [number, number, number] {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const [f0, p0] = CAM_KEYS[i];
    const [f1, p1] = CAM_KEYS[i + 1];
    if (frame >= f0 && frame <= f1) {
      const p = easeInOut(clamp01((frame - f0) / (f1 - f0)));
      return [
        p0[0] + (p1[0] - p0[0]) * p,
        p0[1] + (p1[1] - p0[1]) * p,
        p0[2] + (p1[2] - p0[2]) * p,
      ];
    }
  }
  return CAM_KEYS[CAM_KEYS.length - 1][1];
}

const WATER_FLOOR = -POOL.pitDepth + 0.145;
const WATER_MAX_H = 0.78;

export function poseFrame(frame: number, refs: WorldRefs, camera: THREE.PerspectiveCamera) {
  // camera: slow push-in + gentle sway, never frozen
  const [cxp, cyp, czp] = camPos(frame);
  camera.position.set(
    cxp + Math.sin(frame * 0.011) * 0.12,
    cyp + Math.sin(frame * 0.017 + 1.3) * 0.06,
    czp,
  );
  camera.lookAt(0, -0.1, 0.3);

  // clouds drift
  for (let i = 0; i < refs.clouds.length; i++) {
    const c = refs.clouds[i];
    c.position.x = (c.userData.baseX as number) + Math.sin(frame * 0.0022 + i * 2.1) * 1.4;
  }

  // outline: holds, then shrinks away as digging starts
  const oP = clamp01((frame - 72) / 16);
  refs.outline.scale.setScalar(Math.max(0.0001, 1 - easeInOut(oP)));
  refs.outline.visible = frame < 90;

  // digging: the sand cap sinks into the ground and vanishes, piles grow
  const digP = easeInOut(clamp01((frame - 70) / 90));
  refs.soilCap.position.y = -0.24 - digP * 0.66;
  refs.soilCap.scale.set(1 - digP * 0.12, 1, 1 - digP * 0.12);
  refs.soilCap.visible = frame < 162;
  refs.soilPiles.forEach((p, i) => {
    const pp = easeOutBack(clamp01((frame - 78 - i * 13) / 26));
    p.scale.setScalar(Math.max(0.0001, pp));
  });

  // concrete slab
  const sP = easeOut(clamp01((frame - 165) / 50));
  refs.slab.scale.set(Math.max(0.0001, sP), 1, Math.max(0.0001, sP));

  // bricks pop in on their own schedule
  for (const b of refs.bricks) {
    const p = clamp01((frame - b.at) / 12);
    b.mesh.visible = p > 0;
    if (p > 0) {
      const s = Math.max(0.0001, easeOutBack(p));
      b.mesh.scale.set(s * b.sx, s, s * b.sz);
      b.mesh.position.y = b.baseY + (1 - easeOut(p)) * 0.3;
    }
  }

  // paint
  const pfP = easeOut(clamp01((frame - 480) / 40));
  refs.paintFloor.scale.set(Math.max(0.0001, pfP), 1, Math.max(0.0001, pfP));
  refs.paintPanels.forEach((p, i) => {
    const pp = easeOut(clamp01((frame - 492 - i * 12) / 34));
    p.scale.y = Math.max(0.0001, pp);
  });

  // water rises
  const wP = easeInOut(clamp01((frame - 555) / 90));
  const h = Math.max(0.0001, WATER_MAX_H * wP);
  refs.water.visible = frame >= 555;
  refs.water.scale.y = h;
  refs.water.position.y = WATER_FLOOR + h / 2;
  refs.waterTop.visible = frame >= 555;
  refs.waterTop.position.y = WATER_FLOOR + h + 0.005;
  const shimmer = 1 + Math.sin(frame * 0.05) * 0.0022;
  refs.waterTop.scale.set(shimmer, shimmer, 1);

  // float ring drops in, then bobs
  const ringRestY = WATER_FLOOR + WATER_MAX_H + 0.05;
  if (frame >= 650) {
    refs.ring.visible = true;
    const dP = clamp01((frame - 650) / 24);
    if (dP < 1) {
      refs.ring.position.y = 3.2 + (ringRestY - 3.2) * easeOutBounce(dP);
    } else {
      refs.ring.position.y = ringRestY + Math.sin((frame - 674) * 0.07) * 0.03;
      refs.ring.rotation.z = Math.sin((frame - 674) * 0.05) * 0.05;
      refs.ring.rotation.x = Math.cos((frame - 674) * 0.043) * 0.04;
    }
  }

  // figure pops in and idles
  if (frame >= 665) {
    refs.figure.visible = true;
    const fP = easeOutBack(clamp01((frame - 665) / 18));
    refs.figure.scale.setScalar(Math.max(0.0001, fP));
    refs.figHead.rotation.y = Math.sin(frame * 0.02) * 0.14;
    refs.figHead.rotation.z = Math.sin(frame * 0.031 + 0.7) * 0.05;
  }
}
