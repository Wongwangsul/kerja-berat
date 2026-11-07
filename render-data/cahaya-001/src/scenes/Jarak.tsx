import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {AnimatedArrow, CarSilhouette, EarthDisc, PlaneSilhouette, Sun} from '../components/primitives';
import {BigText, Chip, SceneShell, TimerBadge, useSceneClock} from '../components/scene-ui';
import {fmtID, mulberry32, prog} from '../components/helpers';

export const JarakScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, at, cp} = useSceneClock(scene);
  const [c1, c2, c3, c4, c5, c6, c7] = scene.clauses;

  const moons390 = useMemo(() => {
    const cols = 30;
    const rows = 13;
    return Array.from({length: cols * rows}, (_, i) => ({
      x: 44 + (i % cols) * 62,
      y: 210 + Math.floor(i / cols) * 56,
      key: i,
    }));
  }, []);

  const earthStrip = useMemo(() => {
    const rnd = mulberry32(7);
    return Array.from({length: 235}, (_, i) => ({
      x: 90 + i * 64,
      y: 520 + (rnd() - 0.5) * 26,
      key: i,
    }));
  }, []);

  // ---------- Klausa 1: panah raksasa Bumi -> Matahari, label menyusul ----------
  if (at < c2.start) {
    const p = cp(c1);
    const sunIn = prog(at, c1.start + 4, c1.start + 5.4);
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <EarthDisc cx={240} cy={540} r={78} glow={0.7} />
          <AnimatedArrow x1={350} y1={540} x2={1550} y2={540} progress={prog(at, c1.start + 0.8, c1.start + 4.4)} width={8} />
          {sunIn > 0 ? <Sun cx={1700} cy={540} r={112 * Math.max(0.01, sunIn)} frame={frame} /> : null}
          <Chip x={168} y={660} size={30} opacity={prog(at, c1.start + 0.4, c1.start + 1)}>
            BUMI
          </Chip>
          <Chip x={1608} y={692} size={30} bg={COLORS.orange} opacity={sunIn}>
            MATAHARI
          </Chip>
          <BigText x={0} y={158} width={1920} align="center" size={112} color={COLORS.yellow} appear={prog(at, c1.start + 5.2, c1.start + 6.5)}>
            ±150 juta km
          </BigText>
          <div style={{display: 'none'}}>{p}</div>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 2: 390 Bulan dijejer ----------
  if (at < c3.start) {
    const count = Math.floor(cp(c2) * 390);
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <BigText x={0} y={64} width={1920} align="center" size={88} color={COLORS.yellow} appear={prog(at, c2.start + 0.3, c2.start + 1)}>
            {fmtID(count)}× jarak Bumi–Bulan
          </BigText>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            {moons390.slice(0, count).map((m) => (
              <g key={m.key}>
                <circle cx={m.x} cy={m.y} r={17} fill={COLORS.white} opacity={0.92} />
                <circle cx={m.x - 5} cy={m.y - 4} r={4.5} fill={COLORS.navy} opacity={0.15} />
              </g>
            ))}
          </svg>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 3: 11.800 Bumi berjejer, kamera menyusuri ----------
  if (at < c4.start) {
    const p = cp(c3);
    const stripW = 15190;
    const panX = -p * (stripW - 1920);
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <div style={{position: 'absolute', left: 0, top: 0, width: stripW, height: 1080, transform: `translateX(${panX}px)`}}>
            <svg width={stripW} height={1080}>
              <line x1={40} y1={520} x2={stripW - 60} y2={520} stroke={COLORS.white} strokeWidth={3} strokeDasharray="10 16" opacity={0.3} />
              {earthStrip.map((e) => (
                <g key={e.key}>
                  <circle cx={e.x} cy={e.y} r={25} fill={COLORS.earthBlue} />
                  <ellipse cx={e.x - 8} cy={e.y - 7} rx={9} ry={5.5} fill={COLORS.white} opacity={0.4} />
                </g>
              ))}
            </svg>
          </div>
          <div style={{position: 'absolute', right: 0, top: 0, width: 260, height: 1080, background: `linear-gradient(to right, rgba(11,29,58,0), ${COLORS.navy})`}} />
          <BigText x={0} y={120} width={1820} align="center" size={104} color={COLORS.yellow} appear={prog(at, c3.start + 0.3, c3.start + 1)}>
            {fmtID(p * 11800)} Bumi
          </BigText>
          <Chip x={820} y={248} size={32} opacity={prog(at, c3.start + 0.8, c3.start + 1.6)}>
            BERJEJER SAMPAI MATAHARI
          </Chip>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 4–5: pesawat & mobil (latar sama: rute menuju Matahari) ----------
  if (at < c6.start) {
    const isPlane = at < c5.start;
    const clause = isPlane ? c4 : c5;
    const p = cp(clause);
    const years = isPlane ? p * 19 : p * 170;
    const travel = isPlane ? p * 640 : p * 300;
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <Sun cx={1770} cy={250} r={58} frame={frame} rays={false} />
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <line x1={110} y1={600} x2={1800} y2={600} stroke={COLORS.white} strokeWidth={4} strokeDasharray="14 14" opacity={0.35} />
            <line x1={110} y1={600} x2={110 + travel + 240} y2={600} stroke={COLORS.yellow} strokeWidth={6} opacity={0.85} />
          </svg>
          <EarthDisc cx={110} cy={600} r={34} />
          {isPlane ? (
            <PlaneSilhouette x={155 + travel} y={520} width={250} />
          ) : (
            <CarSilhouette x={155 + travel} y={512} width={250} />
          )}
          <BigText x={0} y={130} width={1920} align="center" size={108} color={COLORS.yellow} appear={prog(at, clause.start + 0.3, clause.start + 1)}>
            {fmtID(years)}
            {!isPlane && p > 0.97 ? '+' : ''} tahun
          </BigText>
          <Chip x={isPlane ? 770 : 796} y={262} size={34} bg={isPlane ? COLORS.yellow : COLORS.orange} opacity={prog(at, clause.start + 0.7, clause.start + 1.5)}>
            {isPlane ? 'PESAWAT · 900 km/jam' : 'MOBIL · 100 km/jam'}
          </Chip>
          <Chip x={1640} y={330} size={28} bg={COLORS.white} opacity={0.9}>
            MATAHARI
          </Chip>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 6: cahaya sekejap + timer 08:20 ----------
  if (at < c7.start) {
    const p = cp(c6);
    const beamQ = prog(at, c6.start, c6.start + 0.7);
    const bx = 350 + (1560 - 350) * beamQ;
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <EarthDisc cx={240} cy={540} r={78} glow={0.7} />
          <Sun cx={1700} cy={540} r={100} frame={frame} />
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <line x1={350} y1={540} x2={1560} y2={540} stroke={COLORS.yellow} strokeWidth={5} strokeDasharray="16 16" opacity={0.4} />
            <circle cx={bx} cy={540} r={16} fill={COLORS.yellow} />
            <circle cx={bx} cy={540} r={34 + 8 * Math.abs(Math.sin(frame * 0.25))} fill={COLORS.yellow} opacity={0.22} />
          </svg>
          <BigText x={0} y={150} width={1920} align="center" size={100} color={COLORS.white} appear={prog(at, c6.start + 0.9, c6.start + 1.8)}>
            500 detik
          </BigText>
          <div style={{opacity: prog(at, c6.start + 1.4, c6.start + 2.2), transform: `scale(${0.85 + 0.15 * prog(at, c6.start + 1.4, c6.start + 2.2)})`, position: 'absolute', inset: 0}}>
            <TimerBadge x={742} y={300} text="08:20" size={104} />
          </div>
          <div style={{display: 'none'}}>{p}</div>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 7: orbit lonjong + dua penanda ----------
  const p = cp(c7);
  const a = Math.PI * 0.12 + p * Math.PI * 1.45;
  const ex = 900 + 640 * Math.cos(a);
  const ey = 540 + 252 * Math.sin(a);
  return (
    <SceneShell scene={scene}>
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <ellipse cx={900} cy={540} rx={640} ry={252} fill="none" stroke={COLORS.white} strokeWidth={4} strokeDasharray="12 12" opacity={0.5} />
          <circle cx={260} cy={540} r={13} fill={COLORS.yellow} />
          <circle cx={1540} cy={540} r={13} fill={COLORS.orange} />
        </svg>
        <Sun cx={700} cy={540} r={74} frame={frame} />
        <EarthDisc cx={ex} cy={ey} r={36} glow={0.6} />
        <Chip x={120} y={392} size={36} opacity={prog(at, c7.start + 2.4, c7.start + 3.2)}>
          8 menit 10 detik
        </Chip>
        <Chip x={1330} y={392} size={36} bg={COLORS.orange} opacity={prog(at, c7.start + 4.6, c7.start + 5.4)}>
          8 menit 27 detik
        </Chip>
        <BigText x={0} y={110} width={1920} align="center" size={72} color={COLORS.white} appear={prog(at, c7.start + 0.3, c7.start + 1.1)}>
          Orbit Bumi agak lonjong
        </BigText>
      </AbsoluteFill>
    </SceneShell>
  );
};
