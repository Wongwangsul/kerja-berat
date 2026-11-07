import React from 'react';
import {AbsoluteFill, spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {Camera} from '../components/Camera';
import {EarthDisc, MoonDisc, Sun} from '../components/primitives';
import {BigText, Chip, SceneShell, useSceneClock} from '../components/scene-ui';
import {fmtDec1, lerp, prog} from '../components/helpers';

const EARTH = {x: 430, y: 570, r: 120};
const MOON = {x: 1520, y: 420, r: 54};

export const CepatScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, at, cp} = useSceneClock(scene);
  const [c1, c2, c3, c4, c5] = scene.clauses;
  const p1 = cp(c1);
  const p2 = cp(c2);
  const p3 = cp(c3);
  const p4 = cp(c4);
  const p5 = cp(c5);

  // ---------- Klausa 4–5: Bumi–Bulan + zoom-out kontinu ----------
  if (at >= c4.start) {
    const moonIn = spring({frame: Math.floor(Math.max(0, at - c4.start) * fps), fps, config: {damping: 16, stiffness: 120}});
    const photonQ = p4;
    const px = EARTH.x + 140 + (MOON.x - 70 - (EARTH.x + 140)) * photonQ;
    const py = EARTH.y - 60 + (MOON.y + 20 - (EARTH.y - 60)) * photonQ;
    const zoom = at >= c5.start ? lerp(p5, [0, 1], [1, 0.45]) : 1;
    return (
      <SceneShell scene={scene}>
        <Camera scale={zoom} originX={EARTH.x} originY={EARTH.y}>
          <AbsoluteFill>
            <EarthDisc cx={EARTH.x} cy={EARTH.y} r={EARTH.r} glow={0.7} />
            <div style={{transform: `scale(${Math.max(0.01, moonIn)})`, transformOrigin: `${MOON.x}px ${MOON.y}px`, position: 'absolute', inset: 0}}>
              <MoonDisc cx={MOON.x} cy={MOON.y} r={MOON.r} />
            </div>
            {/* garis pemandu + foton yang berjalan Bumi -> Bulan */}
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <line x1={EARTH.x + 140} y1={EARTH.y - 60} x2={MOON.x - 70} y2={MOON.y + 20} stroke={COLORS.white} strokeWidth={3} strokeDasharray="8 14" opacity={0.35} />
              {at < c5.start ? (
                <>
                  <circle cx={px} cy={py} r={14} fill={COLORS.yellow} />
                  <circle cx={px} cy={py} r={30} fill={COLORS.yellow} opacity={0.25} />
                </>
              ) : null}
              {/* jejak titik-titik menuju Matahari nun jauh (klausa 5) */}
              {at >= c5.start ? (
                <g fill={COLORS.yellow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <circle
                      key={i}
                      cx={MOON.x + 130 + i * 78}
                      cy={MOON.y - 40 - i * 46}
                      r={9 - i}
                      opacity={prog(at, c5.start + i * 0.9, c5.start + i * 0.9 + 0.5)}
                    />
                  ))}
                </g>
              ) : null}
            </svg>
            {at >= c5.start && p5 > 0.45 ? <Sun cx={1855} cy={110} r={30} frame={frame} rays={false} /> : null}
          </AbsoluteFill>
        </Camera>
        {at < c5.start ? (
          <BigText x={0} y={110} width={1920} align="center" size={88} color={COLORS.yellow} appear={prog(at, c4.start + 0.3, c4.start + 1)}>
            {fmtDec1(p4 * 1.3)} detik
          </BigText>
        ) : (
          <BigText x={0} y={110} width={1920} align="center" size={80} color={COLORS.white} appear={prog(at, c5.start + 0.4, c5.start + 1.2)}>
            …dan itu baru Bulan
          </BigText>
        )}
      </SceneShell>
    );
  }

  // ---------- Klausa 1: titik cahaya melesat, angka menyusul ----------
  if (at < c2.start) {
    const lapFloat = p1 * 3;
    const lap = Math.floor(lapFloat);
    const lapP = lapFloat - lap;
    const dotX = -120 + lapP * 2160;
    const dotY = 470 + lap * 110 + Math.sin(lapP * Math.PI) * -30;
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {[240, 380, 640, 790].map((y, i) => (
              <line key={i} x1={0} y1={y} x2={1920} y2={y} stroke={COLORS.white} strokeWidth={3} strokeDasharray="60 90" strokeDashoffset={-frame * (14 + i * 3)} opacity={0.13} />
            ))}
            {Array.from({length: 9}, (_, i) => (
              <circle key={i} cx={dotX - i * 34} cy={dotY} r={16 - i * 1.4} fill={COLORS.yellow} opacity={0.85 - i * 0.09} />
            ))}
            <circle cx={dotX} cy={dotY} r={40} fill={COLORS.yellow} opacity={0.22} />
          </svg>
          <BigText x={0} y={150} width={1920} align="center" size={118} color={COLORS.yellow} appear={prog(at, c1.start + 5, c1.start + 6.6)}>
            300.000 km/detik
          </BigText>
          <Chip x={806} y={308} size={32} opacity={prog(at, c1.start + 5.6, c1.start + 6.8)}>
            KECEPATAN CAHAYA
          </Chip>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 2: cahaya mengelilingi Bumi 7,5 kali ----------
  if (at < c3.start) {
    const angle = -Math.PI / 2 + p2 * 7.5 * Math.PI * 2;
    const orbitR = 305;
    const cx = 960;
    const cy = 545;
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke={COLORS.white} strokeWidth={2} strokeDasharray="6 12" opacity={0.3} />
            {Array.from({length: 42}, (_, i) => {
              const a = angle - i * 0.085;
              return (
                <circle
                  key={i}
                  cx={cx + Math.cos(a) * orbitR}
                  cy={cy + Math.sin(a) * orbitR}
                  r={13 - i * 0.26}
                  fill={COLORS.yellow}
                  opacity={0.9 - i * 0.02}
                />
              );
            })}
          </svg>
          <EarthDisc cx={cx} cy={cy} r={172} glow={0.8} />
          <BigText x={0} y={92} width={1920} align="center" size={104} color={COLORS.yellow} appear={prog(at, c2.start + 0.3, c2.start + 1)}>
            {fmtDec1(p2 * 7.5)}× putaran
          </BigText>
          <Chip x={836} y={228} size={32} opacity={prog(at, c2.start + 0.8, c2.start + 1.6)}>
            DALAM 1 DETIK
          </Chip>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 3: peta Jakarta – Surabaya ----------
  const flashQ = prog(at, c3.start, c3.start + 0.9);
  const fx = 330 + (1560 - 330) * flashQ;
  const fy = 462 + (458 - 462) * flashQ;
  const arrived = p3 > 0.12;
  return (
    <SceneShell scene={scene}>
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {/* siluet pulau Jawa yang disederhanakan */}
          <path
            d="M120 500 L360 448 L640 470 L920 442 L1180 478 L1440 452 L1800 492 L1800 560 L1440 528 L1180 552 L920 520 L640 548 L360 522 L120 566 Z"
            fill={COLORS.white}
            opacity={0.13}
          />
          <path d="M120 500 L360 448 L640 470 L920 442 L1180 478 L1440 452 L1800 492" fill="none" stroke={COLORS.white} strokeWidth={4} opacity={0.45} />
          <line x1={330} y1={462} x2={1560} y2={458} stroke={COLORS.yellow} strokeWidth={4} strokeDasharray="12 12" opacity={0.55} />
          <circle cx={330} cy={462} r={17} fill={COLORS.earthBlue} stroke={COLORS.white} strokeWidth={4} />
          <circle cx={1560} cy={458} r={17} fill={COLORS.orange} stroke={COLORS.white} strokeWidth={4} />
          {arrived ? (
            <circle cx={1560} cy={458} r={30 + 16 * Math.abs(Math.sin(frame * 0.2))} fill="none" stroke={COLORS.yellow} strokeWidth={4} opacity={0.7} />
          ) : null}
          <circle cx={fx} cy={fy} r={15} fill={COLORS.yellow} />
          <circle cx={fx} cy={fy} r={32} fill={COLORS.yellow} opacity={0.25} />
        </svg>
        <Chip x={238} y={520} size={34}>
          JAKARTA
        </Chip>
        <Chip x={1440} y={516} size={34} bg={COLORS.orange}>
          SURABAYA
        </Chip>
        <BigText x={0} y={150} width={1920} align="center" size={104} color={COLORS.yellow} appear={prog(at, c3.start + 1.1, c3.start + 2)}>
          &lt; 3 milidetik
        </BigText>
      </AbsoluteFill>
    </SceneShell>
  );
};
