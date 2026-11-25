import * as THREE from "three";
import { FastRefs } from "./worldfast";

// Fast-cut choreography: five scenes with hard cuts, matched to the
// narration beats (hook / heat / buckle / the gap / payoff).
// bounds = [endS1, endS2, endS3, endS4, total] in frames.

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (p: number) => p * p * (3 - 2 * p);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

function resetPose(refs: FastRefs) {
  refs.man.rotation.set(0, -0.3, 0);
  refs.armL.rotation.set(-0.1, 0, 0.12);
  refs.armR.rotation.set(-0.15, 0, -0.12);
  refs.legL.rotation.set(0, 0, 0);
  refs.legR.rotation.set(0, 0, 0);
  refs.headG.rotation.set(0.05, -0.3, 0);
  refs.cap.rotation.set(0, 0, 0);
  refs.sun.visible = false;
  refs.sweat.visible = false;
  for (const s of refs.segments) {
    s.rotation.y = 0;
    s.position.y = 0.24;
  }
}

function setJoint(refs: FastRefs, closeP: number) {
  const d = 0.045 * closeP;
  for (const a of refs.jointA) a.position.z = 10 - d;
  for (const b of refs.jointB) b.position.z = 5 + d;
}

function setBuckle(refs: FastRefs, p: number) {
  refs.buckleIdx.forEach((segIdx, k) => {
    const s = refs.segments[segIdx];
    const wave = Math.sin((k + 0.5) * 1.15);
    s.rotation.y = wave * 0.11 * p;
    s.position.y = 0.24 + Math.abs(wave) * 0.08 * p;
  });
}

function smoke(refs: FastRefs, frame: number, zAt: (f: number) => number) {
  for (let i = 0; i < refs.smoke.length; i++) {
    const puff = refs.smoke[i];
    const age = ((frame - i * 5) % 150 + 150) % 150;
    if (age < 78) {
      const sz = zAt(Math.max(0, frame - age));
      puff.visible = true;
      puff.position.set(
        Math.sin(i * 12.9898) * 0.3 + Math.sin(i * 7.3 + age * 0.05) * 0.22 + age * 0.006,
        2.35 + age * 0.075,
        sz + 1.55 - age * 0.012,
      );
      const sc = 0.55 + age * 0.075;
      puff.scale.set(sc, sc * 0.8, sc);
      const m = puff.material as THREE.MeshStandardMaterial;
      m.opacity = 0.34 * (1 - age / 78) * Math.min(1, age / 5 + 0.15);
      const grey = 0.55 + 0.38 * (age / 78);
      m.color.setRGB(grey, grey, grey * 0.98);
    } else {
      puff.visible = false;
    }
  }
}

export function poseFast(frame: number, refs: FastRefs, camera: THREE.PerspectiveCamera, bounds: number[]) {
  const [e1, e2, e3, e4, total] = bounds;
  resetPose(refs);
  setJoint(refs, 0);
  refs.lever.rotation.z = -0.85;
  refs.pointsL.rotation.y = 0;
  refs.pointsR.rotation.y = 0;
  refs.train.position.z = -200;

  if (frame < e1) {
    // S1 HOOK — low beside the rails; he points at the rail, then faces us
    const p = frame / Math.max(1, e1);
    camera.position.set(4.3 - p * 0.4, 1.35, 11.5 - p * 0.6);
    camera.lookAt(-0.6, 0.5, -6);
    refs.man.position.set(2.5, 0, 4.2);
    refs.man.rotation.y = -0.15;
    refs.armR.rotation.x = -0.85;
    refs.armR.rotation.z = -0.45;
    refs.armL.rotation.x = -0.3;
    const faceP = easeInOut(clamp01((p - 0.35) / 0.4));
    refs.headG.rotation.y = -0.35 + faceP * 0.55;
    refs.train.position.z = -85;
    smoke(refs, frame, () => -85);
  } else if (frame < e2) {
    // S2 HEAT — big sun, brow-wiping, sweat, the gap starts to close
    const f = frame - e1;
    const dur = Math.max(1, e2 - e1);
    const p = f / dur;
    camera.position.set(6.6, 2.7, 13.2);
    camera.lookAt(-0.6, 0.7, -10);
    refs.sun.visible = true;
    const pulse = 1 + Math.sin(frame * 0.12) * 0.03;
    refs.sun.scale.set(pulse, pulse, 1);
    refs.man.position.set(3.6, 0, 3.4);
    refs.man.rotation.y = -0.35;
    refs.armR.rotation.x = -2.0 + Math.sin(f * 0.35) * 0.16;
    refs.armR.rotation.z = -0.5;
    refs.headG.rotation.y = -0.15 + Math.sin(f * 0.05) * 0.08;
    refs.headG.rotation.x = -0.1;
    refs.sweat.visible = true;
    const dropCycle = (f % 20) / 20;
    refs.sweat.position.y = 0.12 - dropCycle * 0.55;
    refs.sweat.scale.setScalar(1 - dropCycle * 0.4);
    setJoint(refs, easeInOut(clamp01(p * 1.15)) * 0.55);
    refs.train.position.z = -72;
    smoke(refs, frame, () => -72);
  } else if (frame < e3) {
    // S3 BUCKLE — the un-gapped rail bends; he throws his hands up
    const f = frame - e2;
    const dur = Math.max(1, e3 - e2);
    const p = f / dur;
    camera.position.set(4.6, 1.9, 1.5);
    camera.lookAt(-0.5, 0.4, -11);
    setBuckle(refs, easeInOut(clamp01(p * 1.25)));
    setJoint(refs, 1);
    refs.man.position.set(2.3, 0, -8.5);
    refs.man.rotation.y = -0.5;
    const alarm = easeOut(clamp01(p * 3));
    refs.armL.rotation.x = -0.4 * alarm;
    refs.armR.rotation.x = -0.4 * alarm;
    refs.armL.rotation.z = 2.55 * alarm + Math.sin(f * 0.5) * 0.08 * alarm;
    refs.armR.rotation.z = -2.55 * alarm + Math.cos(f * 0.45) * 0.08 * alarm;
    refs.headG.rotation.y = -0.3 + Math.sin(f * 0.6) * 0.07 * alarm;
    refs.train.position.z = -72;
    smoke(refs, frame, () => -72);
  } else if (frame < e4) {
    // S4 THE GAP — close-up on the joint; he points at the deliberate gap
    const f = frame - e3;
    const dur = Math.max(1, e4 - e3);
    const p = f / dur;
    camera.position.set(2.5 - p * 0.2, 0.9, 9.8 - p * 0.3);
    camera.lookAt(0.55, 0.3, 4.8);
    setJoint(refs, 0.12);
    refs.man.position.set(2.35, 0, 6.4);
    refs.man.rotation.y = -0.7;
    refs.man.rotation.x = 0.14;
    refs.armR.rotation.x = -0.7;
    refs.armR.rotation.z = -0.35;
    refs.headG.rotation.y = -0.55;
    refs.headG.rotation.x = 0.3;
  } else {
    // S5 PAYOFF — switch already set; the train rushes the joint, thumbs up
    const f = frame - e4;
    const dur = Math.max(1, total - e4);
    const p = f / dur;
    camera.position.set(5.5, 1.9, 10.2);
    camera.lookAt(0.95, 1.0, 0.7);
    refs.lever.rotation.z = 0.75;
    refs.pointsL.rotation.y = -0.05;
    refs.pointsR.rotation.y = 0.05;
    const tz = -62 + 80 * Math.pow(p, 1.08);
    refs.train.position.z = tz;
    const dist = tz + 62;
    for (const w of refs.wheels) w.rotation.x = dist * 2.1;
    smoke(refs, frame, (ff) => -62 + 80 * Math.pow(clamp01((ff - e4) / dur), 1.08));
    const glowS = 2.0 + Math.sin(frame * 0.35) * 0.18;
    refs.lampGlow.scale.set(glowS, glowS, 1);
    refs.man.position.set(3.55, 0, 3.0);
    refs.man.rotation.y = -0.28;
    const windP = clamp01((p - 0.55) / 0.2);
    const thumbP = easeInOut(clamp01((p - 0.62) / 0.2));
    refs.armR.rotation.x = -0.2 - thumbP * 1.65;
    refs.armR.rotation.z = -0.15 - thumbP * 0.35;
    refs.armL.rotation.x = -0.15;
    refs.headG.rotation.y = -0.25 + p * 0.45;
    refs.cap.rotation.x = Math.sin(frame * 0.9) * 0.06 * windP;
    refs.man.rotation.x = -0.05 * windP;
    const shake = clamp01((p - 0.6) / 0.15) * (p > 0.95 ? 0.4 : 1);
    camera.position.x += Math.sin(frame * 1.7) * 0.02 * shake;
    camera.position.y += Math.sin(frame * 2.3) * 0.028 * shake;
  }
}
