import * as THREE from "three";
import { SEG } from "./timing";
import { WorldRefs, LADDER_TOP, CLOUD_SEA_Y, NEST_POS } from "./world";
import { clamp01, smoother, lerp, lerp3 } from "./vox";

type V3 = [number, number, number];
const frac = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

interface Shot { a: number; b: number; pose: (t: number, R: WorldRefs) => { pos: V3; look: V3 } }

const LAD_Z = -2; // ladder plane z
const CLIMB_Z = LAD_Z + 0.85; // Bima hangs on the front face of the ladder

function resetBima(R: WorldRefs) {
  const b = R.bima;
  b.position.set(0, 0, 0); b.rotation.set(0, 0, 0); b.scale.setScalar(1);
  R.armL.rotation.set(0, 0, 0.12); R.armR.rotation.set(0, 0, -0.12);
  R.legL.rotation.set(0, 0, 0); R.legR.rotation.set(0, 0, 0);
  R.bimaHead.rotation.set(0, 0, 0);
  R.headNormal.visible = true; R.headTired.visible = false;
  R.feather.visible = false;
  R.mamaHead.rotation.set(0, 0, 0);
  R.wingL.rotation.set(0, 0, 0.15); R.wingR.rotation.set(0, 0, -0.15);
}

function climbPose(R: WorldRefs, phase: number, grip = 1) {
  // arms reach up alternately, legs step alternately, body bobs — phase in radians
  const s = Math.sin(phase), c = Math.cos(phase);
  R.armL.rotation.x = -2.6 * grip + s * 0.45;
  R.armR.rotation.x = -2.6 * grip - s * 0.45;
  R.armL.rotation.z = 0.25; R.armR.rotation.z = -0.25;
  R.legL.rotation.x = c * 0.55; R.legR.rotation.x = -c * 0.55;
  R.bima.position.y += Math.abs(Math.sin(phase)) * 0.07;
  R.bima.rotation.z = s * 0.03;
}

export const SHOTS: Shot[] = [
  // 1 — HOOK: wide village, ladder vanishing into clouds, tiny Bima gazes up
  {
    a: SEG.s1.a, b: SEG.s1.b,
    pose: (t, R) => {
      const b = R.bima;
      b.position.set(3.5, 0, 11); b.rotation.y = -0.5; b.scale.setScalar(1.25);
      R.bimaHead.rotation.x = -0.55 * smoother(frac(t, 0, 0.5)); // tilt up
      R.armL.rotation.z = 0.5; R.armR.rotation.z = -0.5;
      const k = smoother(t);
      return { pos: lerp3([27, 6, 34], [22, 5.5, 29], k), look: lerp3([0, 12.5, LAD_Z], [0, 11.5, LAD_Z], k) };
    },
  },
  // 2 — DECISION: at the ladder base; crouch of anticipation, then grabs on
  {
    a: SEG.s2.a, b: SEG.s2.b,
    pose: (t, R) => {
      const b = R.bima;
      b.position.set(0, 0, CLIMB_Z + 1.3); b.rotation.y = Math.PI; // face the ladder (-z)
      const crouch = Math.sin(clamp01(t / 0.22) * Math.PI) * 0.16;
      b.scale.y = 1 - crouch; b.position.y = -crouch * 0.4;
      const reach = smoother(frac(t, 0.3, 0.6));
      R.armL.rotation.x = -2.6 * reach; R.armR.rotation.x = -2.2 * reach;
      R.bimaHead.rotation.x = -0.5;
      const step = smoother(frac(t, 0.7, 1));
      R.legR.rotation.x = -0.7 * step; b.position.y += step * 0.5; b.position.z = CLIMB_Z + 1.3 - step * 1.15;
      const k = smoother(t);
      return { pos: lerp3([8.5, 3.0, 9.5], [7.0, 3.4, 8.0], k), look: [0.2, 2.4, -0.6] };
    },
  },
  // 3 — CLIMB past the giant tree; glance down at the toy houses
  {
    a: SEG.s3.a, b: SEG.s3.b,
    pose: (t, R) => {
      const b = R.bima;
      const y = lerp(5, 31, smoother(t));
      b.position.set(0, y, CLIMB_Z); b.rotation.y = Math.PI;
      climbPose(R, t * Math.PI * 7);
      const glance = smoother(frac(t, 0.55, 0.7)) * (1 - smoother(frac(t, 0.88, 1)));
      R.bimaHead.rotation.y = glance * 0.9; R.bimaHead.rotation.x = glance * 0.55;
      b.rotation.y = Math.PI - glance * 0.45;
      return { pos: lerp3([-13, y - 3, 11], [-11, y + 2.5, 9], smoother(t)), look: [0, y + 1.6, CLIMB_Z] };
    },
  },
  // 4 — CLOUD LAYER: tired face, a pause to rub his leg, then on again
  {
    a: SEG.s4.a, b: SEG.s4.b,
    pose: (t, R) => {
      const b = R.bima;
      const pause = smoother(frac(t, 0.42, 0.55)) * (1 - smoother(frac(t, 0.78, 0.92)));
      const climbT = t < 0.5 ? smoother(t / 0.5) * 0.5 : 0.5 + smoother((t - 0.5) / 0.5) * 0.5;
      const y = lerp(60, 82, climbT);
      b.position.set(0, y, CLIMB_Z); b.rotation.y = Math.PI - 0.35;
      R.headNormal.visible = false; R.headTired.visible = true;
      if (pause > 0.03) {
        R.armL.rotation.x = -2.6; R.armR.rotation.x = -2.6;
        R.armR.rotation.z = -0.9 * pause; // hand toward forehead/leg rub
        R.armR.rotation.x = lerp(-2.6, -0.7, pause);
        R.legR.rotation.x = -0.9 * pause; R.legL.rotation.x = 0.15;
        R.bimaHead.rotation.x = 0.35 * pause;
        b.rotation.z = Math.sin(t * 40) * 0.012 * pause; // tired leg tremble
      } else {
        climbPose(R, t * Math.PI * 6);
      }
      return { pos: lerp3([-4.6, y + 0.6, 4.6], [-4.0, y + 1.6, 4.0], smoother(t)), look: [0, y + 1.7, CLIMB_Z] };
    },
  },
  // 5 — WOW: head breaks through the sea of clouds; he turns to face the view
  {
    a: SEG.s5.a, b: SEG.s5.b,
    pose: (t, R) => {
      const b = R.bima;
      const y = lerp(82, 88, smoother(clamp01(t / 0.45)));
      b.position.set(0, y, CLIMB_Z);
      const turn = smoother(frac(t, 0.3, 0.55));
      b.rotation.y = Math.PI - turn * Math.PI; // turns outward to face +z
      R.bimaHead.rotation.y = Math.sin(frac(t, 0.55, 1) * Math.PI * 1.2) * 0.4 * turn;
      const wow = smoother(frac(t, 0.32, 0.45)) * (1 - smoother(frac(t, 0.6, 0.8)));
      R.armL.rotation.x = -2.9 * wow; R.armR.rotation.x = -2.9 * wow;
      R.armL.rotation.z = 0.7 * wow + 0.12; R.armR.rotation.z = -0.7 * wow - 0.12;
      if (wow <= 0.03 && turn < 0.5) climbPose(R, t * Math.PI * 5);
      const k = smoother(t);
      return { pos: lerp3([-6.0, y + 2.2, 11.5], [-7.0, y + 3.0, 12.5], k), look: [0, y + 1.9, CLIMB_Z] };
    },
  },
  // 6 — REVEAL: final rungs; the giant nest appears at the top
  {
    a: SEG.s6.a, b: Math.round((SEG.s6.a + SEG.s6.b) / 2),
    pose: (t, R) => {
      const b = R.bima;
      const y = lerp(100, LADDER_TOP - 1.5, smoother(t));
      b.position.set(0, y, CLIMB_Z); b.rotation.y = Math.PI;
      climbPose(R, t * Math.PI * 6.5);
      R.bimaHead.rotation.x = -0.4;
      const k = smoother(frac(t, 0.35, 1));
      return {
        pos: lerp3([-8.5, y + 2.5, 9.5], [18, LADDER_TOP + 7, 18], k),
        look: lerp3([0, y + 1.8, CLIMB_Z], [NEST_POS[0], NEST_POS[1] + 3, NEST_POS[2]], k),
      };
    },
  },
  // 7 — THE BIRDS: mama turns her head; chicks peep; Bima waves
  {
    a: Math.round((SEG.s6.a + SEG.s6.b) / 2), b: SEG.s6.b,
    pose: (t, R) => {
      const b = R.bima;
      b.position.set(NEST_POS[0] - 6.4, LADDER_TOP - 0.4, NEST_POS[2] + 1.2);
      b.rotation.y = 2.35; // face the birds (toward +x/+z of nest)
      const wave = smoother(frac(t, 0.25, 0.4));
      R.armR.rotation.x = -2.8 * wave; R.armR.rotation.z = -0.4 + Math.sin(t * 26) * 0.35 * wave;
      R.armL.rotation.z = 0.4;
      R.bimaHead.rotation.x = -0.15;
      // mama turns her head toward Bima, then a soft blink-tilt
      const turn = smoother(frac(t, 0.05, 0.35));
      R.mamaHead.rotation.y = lerp(-0.55, 0.25, turn);
      R.mamaHead.rotation.z = Math.sin(frac(t, 0.4, 1) * Math.PI) * 0.08;
      // chicks peep: head bobs + tiny hops, alternating
      const bob1 = Math.abs(Math.sin(t * 22)), bob2 = Math.abs(Math.sin(t * 22 + 2.2));
      R.chickHead1.rotation.x = -0.35 * bob1; R.chickHead2.rotation.x = -0.35 * bob2;
      R.chick1.position.y = NEST_POS[1] - 0.5 + bob1 * 0.12;
      R.chick2.position.y = NEST_POS[1] - 0.5 + bob2 * 0.12;
      R.wingL.rotation.z = 0.15 + Math.sin(t * 6.28) * 0.03;
      return {
        pos: lerp3([NEST_POS[0] - 4.2, NEST_POS[1] + 6.4, NEST_POS[2] + 19.8], [NEST_POS[0] - 3.8, NEST_POS[1] + 6.0, NEST_POS[2] + 18.6], smoother(t)),
        look: [NEST_POS[0] - 3.9, NEST_POS[1] + 2.4, NEST_POS[2] + 0.4],
      };
    },
  },
  // 8 — THE GIFT: mama plucks a giant feather and offers it; Bima takes it with both hands
  {
    a: SEG.s7.a, b: SEG.s7.b,
    pose: (t, R) => {
      const b = R.bima;
      b.position.set(NEST_POS[0] - 6.4, LADDER_TOP - 0.4, NEST_POS[2] + 1.2);
      b.rotation.y = 2.35;
      R.armL.rotation.x = -2.4 * smoother(frac(t, 0.45, 0.65));
      R.armR.rotation.x = -2.4 * smoother(frac(t, 0.45, 0.65));
      R.bimaHead.rotation.x = -0.25;
      // mama: wing rises, feather appears at her wing, then glides to Bima
      const pluck = smoother(frac(t, 0.15, 0.4));
      R.wingR.rotation.z = -0.15 - pluck * 0.9; R.wingR.rotation.x = -0.4 * pluck;
      R.mamaHead.rotation.y = lerp(0.25, -0.3, smoother(frac(t, 0.1, 0.3)));
      const f = R.feather;
      if (t > 0.18) {
        f.visible = true;
        const give = smoother(frac(t, 0.4, 0.7));
        const from: V3 = [NEST_POS[0] - 0.3, NEST_POS[1] + 5.4, NEST_POS[2] + 1.4];
        const to: V3 = [b.position.x + 0.4, b.position.y + 3.4, b.position.z + 0.6];
        const p = lerp3(from, to, give);
        f.position.set(p[0], p[1] + Math.sin(give * Math.PI) * 0.8, p[2]);
        f.rotation.set(0.4, 0.6, lerp(0.9, 0.25, give));
        const sc = lerp(0.7, 0.95, pluck); f.scale.setScalar(sc);
      }
      return {
        pos: lerp3([NEST_POS[0] - 13.5, NEST_POS[1] + 7.5, NEST_POS[2] + 12.5], [NEST_POS[0] - 12.5, NEST_POS[1] + 7.0, NEST_POS[2] + 11.5], smoother(t)),
        look: [NEST_POS[0] - 2.2, NEST_POS[1] + 2.8, NEST_POS[2] + 0.2],
      };
    },
  },
  // 9 — THE GLIDE: feather-parachute ride down through the clouds
  {
    a: SEG.s8.a, b: Math.round(SEG.s8.a + (SEG.s8.b - SEG.s8.a) * 0.55),
    pose: (t, R) => {
      const b = R.bima;
      const k = smoother(t);
      const x = lerp(NEST_POS[0] - 5, 7, k) + Math.sin(t * Math.PI * 2.2) * 2.2;
      const y = lerp(LADDER_TOP - 1, 16, Math.pow(t, 0.85));
      const z = lerp(NEST_POS[2] + 1, 11, k);
      b.position.set(x, y, z);
      b.rotation.y = 0.5 + Math.sin(t * Math.PI * 2.2 + 0.6) * 0.25;
      b.rotation.z = Math.sin(t * Math.PI * 3.1) * 0.07;
      R.armL.rotation.x = -3.05; R.armR.rotation.x = -3.05; // both hands up holding the feather
      R.armL.rotation.z = 0.3; R.armR.rotation.z = -0.3;
      R.legL.rotation.x = 0.25 + Math.sin(t * 9) * 0.12; // dangling happy kicks
      R.legR.rotation.x = 0.25 + Math.cos(t * 9) * 0.12;
      const f = R.feather;
      f.visible = true;
      f.position.set(x, y + 3.6 + Math.sin(t * Math.PI * 3.1 + 0.5) * 0.15, z);
      f.rotation.set(Math.PI / 2 - 0.12, 0, 0.15 * Math.sin(t * Math.PI * 2.2));
      f.scale.setScalar(1.15);
      return { pos: lerp3([x - 11, y + 3.5, z + 9], [x - 9, y + 2.5, z + 8], k), look: [x, y + 1.8, z] };
    },
  },
  // 10 — LANDING + GOODBYE: soft touchdown, squash, wave to the sky; wide echo of shot 1
  {
    a: Math.round(SEG.s8.a + (SEG.s8.b - SEG.s8.a) * 0.55), b: SEG.s8.b,
    pose: (t, R) => {
      const b = R.bima;
      const land = smoother(clamp01(t / 0.38));
      const x = lerp(7, 3.5, land), y = lerp(16, 0, Math.pow(clamp01(t / 0.38), 0.8)), z = lerp(11, 11, land);
      b.position.set(x, y, z);
      b.rotation.y = lerp(0.5, -0.5, land);
      const f = R.feather;
      if (t < 0.42) {
        f.visible = true;
        f.position.set(x, y + 3.6, z); f.rotation.set(Math.PI / 2 - 0.12, 0, 0);
        f.scale.setScalar(1.15);
        R.armL.rotation.x = -3.05; R.armR.rotation.x = -3.05;
        R.legL.rotation.x = 0.25; R.legR.rotation.x = 0.25;
      } else {
        // feather rests across his back/shoulder; he waves up with the right hand
        f.visible = true;
        f.position.set(x - 0.4, y + 2.2, z - 0.5); f.rotation.set(0.3, 0.4, 1.15); f.scale.setScalar(0.95);
        const wv = smoother(frac(t, 0.45, 0.55));
        R.armR.rotation.x = -2.9 * wv; R.armR.rotation.z = -0.3 + Math.sin(frac(t, 0.5, 1) * 22) * 0.3 * wv;
        R.armL.rotation.z = 0.35;
        R.bimaHead.rotation.x = -0.5;
      }
      // squash on touchdown
      const sq = Math.sin(clamp01((t - 0.36) / 0.14) * Math.PI);
      if (t > 0.34 && t < 0.52) { b.scale.y = 1 - 0.16 * sq; b.position.y -= 0.12 * sq; }
      const k = smoother(t);
      return {
        pos: lerp3([x + 7, 8, z + 8], [22, 5.5, 29], smoother(frac(t, 0.45, 1))),
        look: lerp3([x, 2.2, z], [0, 11.5, LAD_Z], smoother(frac(t, 0.45, 1))),
      };
    },
  },
];

export function poseFrame(frame: number, R: WorldRefs, camera: THREE.Camera) {
  resetBima(R);
  R.mamaHead.rotation.set(0, 0, 0);
  let shot = SHOTS[SHOTS.length - 1];
  for (const s of SHOTS) if (frame >= s.a && frame <= s.b) { shot = s; break; }
  const t = frac(frame, shot.a, shot.b);
  const { pos, look } = shot.pose(t, R);
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  // gentle idle sway on the birds so no shot is ever frozen
  R.mama.position.y = NEST_POS[1] - 0.6 + Math.sin(frame * 0.05) * 0.05;
  R.chick1.rotation.z = Math.sin(frame * 0.11) * 0.03;
  R.chick2.rotation.z = Math.cos(frame * 0.13) * 0.03;
  void CLOUD_SEA_Y;
}
