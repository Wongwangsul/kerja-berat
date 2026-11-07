import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {Camera} from '../components/Camera';
import {EarthDisc, PersonSitting, Sun} from '../components/primitives';
import {BigText, SceneShell, TimerBadge, useSceneClock} from '../components/scene-ui';
import {clamp01, fmtTimer, lerp, prog} from '../components/helpers';

const SUN = {x: 1560, y: 250, r: 105};
const PERSON = {x: 430, y: 622, size: 250};
const PERSON_HEAD = {x: 555, y: 655};

/** Berkas cahaya Matahari -> figur: garis putus-putus mengalir + titik foton berjalan. */
const Beam: React.FC<{frame: number; strength: number}> = ({frame, strength}) => {
  const q = (frame % 54) / 54;
  const px = SUN.x - 90 + (PERSON_HEAD.x - (SUN.x - 90)) * q;
  const py = SUN.y + 80 + (PERSON_HEAD.y - (SUN.y + 80)) * q;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: strength}}>
      <line
        x1={SUN.x - 90}
        y1={SUN.y + 80}
        x2={PERSON_HEAD.x}
        y2={PERSON_HEAD.y}
        stroke={COLORS.yellow}
        strokeWidth={5}
        strokeDasharray="16 18"
        strokeDashoffset={-frame * 7}
        strokeLinecap="round"
        opacity={0.75}
      />
      <circle cx={px} cy={py} r={13} fill={COLORS.yellow} />
      <circle cx={px} cy={py} r={26} fill={COLORS.yellow} opacity={0.25} />
    </svg>
  );
};

export const HookScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, at, cp} = useSceneClock(scene);
  const [c1, c2, c3, c4, c5, c6] = scene.clauses;

  const sunIn = spring({frame, fps, config: {damping: 200}});
  const p1 = cp(c1);
  const p2 = cp(c2);
  const p4 = cp(c4);
  const p5 = cp(c5);
  const p6 = cp(c6);

  // Matahari memudar saat klausa 4; Bumi terang muncul di klausa 5.
  const sunDim = at >= c4.start ? p4 : 0;
  const sunOpacity = at >= c4.start ? 1 - 0.82 * sunDim : 1;
  const earthIn = at >= c5.start ? spring({frame: Math.floor((at - c5.start) * fps), fps, config: {damping: 16, stiffness: 120}}) : 0;

  // Timer 08:20 berjalan selama klausa 3–5 (dari 500 detik, mundur per detik nyata).
  const showTimer = at >= c3.start && at < c6.start;
  const timerValue = 500 - Math.floor(Math.max(0, at - c3.start));

  // Zoom-out kontinu pada klausa 6.
  const zoom = at >= c6.start ? lerp(p6, [0, 1], [1, 0.58]) : 1;

  // Glow hangat di sekitar figur (klausa 2 dst).
  const glowP = at >= c2.start ? Math.min(1, p2 + 0.35) : 0;
  const glowPulse = 1 + 0.05 * Math.sin(frame * 0.12);

  const stage = (
    <AbsoluteFill>
      {/* tanah */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 866, bottom: 0, backgroundColor: COLORS.white, opacity: 0.05}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 864, height: 3, backgroundColor: COLORS.white, opacity: 0.22}} />

      {/* cahaya sisa yang bertahan sesudah Matahari "lenyap" (klausa 4–5) */}
      {at >= c4.start ? (
        <div
          style={{
            position: 'absolute',
            left: 180,
            top: 330,
            width: 900,
            height: 620,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,183,3,${0.16 * (1 - p6)}) 0%, rgba(255,183,3,0) 70%)`,
          }}
        />
      ) : null}

      <Sun cx={SUN.x} cy={SUN.y} r={SUN.r * Math.max(0.01, sunIn)} frame={frame} opacity={sunOpacity} dimmed={sunDim > 0.5} />
      <Beam frame={frame} strength={at < c4.start ? 1 : Math.max(0, 1 - p4 * 1.6)} />

      {/* glow hangat menyentuh figur */}
      {at >= c2.start ? (
        <div
          style={{
            position: 'absolute',
            left: PERSON.x - 60,
            top: PERSON.y - 40,
            width: (PERSON.size + 120) * glowPulse,
            height: (PERSON.size + 120) * glowPulse,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,183,3,${0.34 * glowP}) 0%, rgba(251,133,0,${0.16 * glowP}) 55%, rgba(251,133,0,0) 75%)`,
          }}
        />
      ) : null}

      <PersonSitting x={PERSON.x} y={PERSON.y} size={PERSON.size} />

      {/* Bumi tetap terang-benderang (klausa 5) */}
      {at >= c5.start ? (
        <div style={{transform: `scale(${Math.max(0.01, earthIn)})`, transformOrigin: '1500px 715px', position: 'absolute', inset: 0}}>
          <EarthDisc cx={1500} cy={715} r={92} glow={1} />
        </div>
      ) : null}

      {showTimer ? <TimerBadge x={90} y={84} text={fmtTimer(timerValue)} /> : null}

      {/* tanda tanya raksasa saat zoom-out (klausa 6) */}
      {at >= c6.start ? (
        <BigText x={1180} y={300} size={360} color={COLORS.yellow} appear={prog(at, c6.start + 1.2, c6.start + 2.1)}>
          ?
        </BigText>
      ) : null}

      {/* penanda skala kecil saat hook: "8 menit" sebagai pembuka cerita */}
      {at >= c3.start && at < c4.start ? (
        <BigText x={90} y={220} size={64} color={COLORS.orange} appear={prog(at, c3.start + 0.4, c3.start + 1.1)}>
          8 menit yang lalu…
        </BigText>
      ) : null}
      <div style={{display: 'none'}}>{clamp01(p1)}</div>
    </AbsoluteFill>
  );

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom} originX={960} originY={560}>
        {stage}
      </Camera>
    </SceneShell>
  );
};
