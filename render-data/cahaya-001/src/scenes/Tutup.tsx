import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Scene} from '../script';
import {COLORS, poppins} from '../theme';
import {Camera} from '../components/Camera';
import {PersonSitting, Sun} from '../components/primitives';
import {Chip, SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp, prog} from '../components/helpers';

const SUN = {x: 1560, y: 250, r: 105};
const PERSON = {x: 430, y: 622, size: 250};

/** Set berjemur yang sama dengan Hook — penutup kembali ke awal. */
const BaskingSet: React.FC<{frame: number; glow: number; beam: boolean}> = ({frame, glow, beam}) => {
  const q = (frame % 54) / 54;
  const px = SUN.x - 90 + (555 - (SUN.x - 90)) * q;
  const py = SUN.y + 80 + (655 - (SUN.y + 80)) * q;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 866, bottom: 0, backgroundColor: COLORS.white, opacity: 0.05}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 864, height: 3, backgroundColor: COLORS.white, opacity: 0.22}} />
      <Sun cx={SUN.x} cy={SUN.y} r={SUN.r} frame={frame} />
      {beam ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <line x1={SUN.x - 90} y1={SUN.y + 80} x2={555} y2={655} stroke={COLORS.yellow} strokeWidth={5} strokeDasharray="16 18" strokeDashoffset={-frame * 7} strokeLinecap="round" opacity={0.75} />
          <circle cx={px} cy={py} r={13} fill={COLORS.yellow} />
          <circle cx={px} cy={py} r={26} fill={COLORS.yellow} opacity={0.25} />
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: PERSON.x - 60,
          top: PERSON.y - 40,
          width: PERSON.size + 120,
          height: PERSON.size + 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,183,3,${0.32 * glow}) 0%, rgba(251,133,0,${0.15 * glow}) 55%, rgba(251,133,0,0) 75%)`,
        }}
      />
      <PersonSitting x={PERSON.x} y={PERSON.y} size={PERSON.size} />
    </AbsoluteFill>
  );
};

/** Ikon garis waktu: gandum (pertanian) & lempengan (tulisan). */
const WheatIcon: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => (
  <svg width={120} height={150} style={{position: 'absolute', left: x, top: y, opacity}}>
    <line x1={60} y1={150} x2={60} y2={34} stroke={COLORS.yellow} strokeWidth={6} />
    {[0, 1, 2].map((i) => (
      <g key={i} fill={COLORS.yellow}>
        <ellipse cx={38} cy={44 + i * 26} rx={15} ry={8} transform={`rotate(-38 38 ${44 + i * 26})`} />
        <ellipse cx={82} cy={44 + i * 26} rx={15} ry={8} transform={`rotate(38 82 ${44 + i * 26})`} />
      </g>
    ))}
  </svg>
);

const TabletIcon: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => (
  <svg width={120} height={150} style={{position: 'absolute', left: x, top: y, opacity}}>
    <rect x={14} y={10} width={92} height={130} rx={12} fill={COLORS.orange} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={32} y1={42 + i * 24} x2={88} y2={42 + i * 24} stroke={COLORS.navy} strokeWidth={7} strokeLinecap="round" opacity={0.65} />
    ))}
  </svg>
);

const TIMELINE_Y = 620;
const MARKERS = [
  {fx: 0.06, label: '170.000 tahun lalu', sub: 'energi berangkat'},
  {fx: 0.52, label: '12.000 tahun lalu', sub: 'pertanian'},
  {fx: 0.78, label: '5.000 tahun lalu', sub: 'tulisan'},
  {fx: 0.97, label: 'hari ini', sub: 'kamu'},
];

export const TutupScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, at, cp} = useSceneClock(scene);
  const [c1, c2, c3, c4] = scene.clauses;

  // ---------- Klausa 4: kiriman terakhir dari masa lalu ----------
  if (at >= c4.start) {
    const p = cp(c4);
    const travel = prog(at, c4.start + 0.4, c4.start + 4.2);
    const px = SUN.x - 90 + (555 - (SUN.x - 90)) * travel;
    const py = SUN.y + 80 + (655 - (SUN.y + 80)) * travel;
    const landed = travel >= 1;
    const bloom = landed ? 1 + 0.1 * Math.sin(frame * 0.15) : 0.4;
    return (
      <SceneShell scene={scene}>
        <BaskingSet frame={frame} glow={bloom} beam={false} />
        {!landed ? (
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <circle cx={px} cy={py} r={17} fill={COLORS.yellow} />
            <circle cx={px} cy={py} r={38} fill={COLORS.yellow} opacity={0.28} />
            <circle cx={px - 60} cy={py - 26} r={9} fill={COLORS.yellow} opacity={0.5} />
            <circle cx={px - 120} cy={py - 52} r={6} fill={COLORS.yellow} opacity={0.3} />
          </svg>
        ) : null}
        <Chip x={640} y={560} size={36} bg={COLORS.orange} opacity={prog(at, c4.start + 4.4, c4.start + 5.2)}>
          kiriman dari masa lalu
        </Chip>
        <div style={{display: 'none'}}>{p}</div>
      </SceneShell>
    );
  }

  // ---------- Klausa 2–3: garis waktu peradaban ----------
  if (at >= c2.start) {
    const drawP = at < c3.start ? cp(c2) : 1;
    const zoom = at >= c3.start ? lerp(cp(c3), [0, 1], [1, 1.32]) : 1;
    const lineX2 = 140 + (1780 - 140) * drawP;
    return (
      <SceneShell scene={scene}>
        <Camera scale={zoom} originX={1690} originY={TIMELINE_Y}>
          <AbsoluteFill>
            <Sun cx={1760} cy={150} r={54} frame={frame} rays={false} />
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <line x1={140} y1={TIMELINE_Y} x2={lineX2} y2={TIMELINE_Y} stroke={COLORS.yellow} strokeWidth={6} strokeLinecap="round" />
              {MARKERS.map((m, i) => {
                const mx = 140 + (1780 - 140) * m.fx;
                const on = drawP >= m.fx;
                return on ? <circle key={i} cx={mx} cy={TIMELINE_Y} r={i === 3 ? 17 : 13} fill={i === 3 ? COLORS.orange : COLORS.white} stroke={COLORS.navy} strokeWidth={3} /> : null;
              })}
            </svg>
            {/* ikon per penanda */}
            {drawP >= MARKERS[0].fx ? (
              <svg width={90} height={90} style={{position: 'absolute', left: 192, top: TIMELINE_Y - 128}}>
                <circle cx={45} cy={45} r={26} fill={COLORS.yellow} />
                <circle cx={45} cy={45} r={36} fill={COLORS.orange} opacity={0.25} />
              </svg>
            ) : null}
            {drawP >= MARKERS[1].fx ? <WheatIcon x={925} y={TIMELINE_Y - 168} opacity={1} /> : null}
            {drawP >= MARKERS[2].fx ? <TabletIcon x={1352} y={TIMELINE_Y - 168} opacity={1} /> : null}
            {drawP >= MARKERS[3].fx ? <PersonSitting x={1648} y={TIMELINE_Y - 148} size={104} /> : null}
            {/* semua label DI BAWAH garis (ikon di atas) agar tidak bertabrakan */}
            {MARKERS.map((m, i) => {
              const mx = 140 + (1780 - 140) * m.fx;
              const show = prog(at, c2.start + 1 + i * 1.7, c2.start + 1.7 + i * 1.7);
              if (drawP < m.fx) return null;
              return (
                <React.Fragment key={i}>
                  <Chip x={Math.min(i === 3 ? 1586 : 1560, Math.max(60, mx - (i === 2 ? 158 : 130)))} y={TIMELINE_Y + 46} size={i >= 2 ? 29 : 31} bg={i === 3 ? COLORS.orange : COLORS.yellow} opacity={show}>
                    {m.label}
                  </Chip>
                  <div
                    style={{
                      position: 'absolute',
                      left: Math.min(i === 3 ? 1586 : 1560, Math.max(60, mx - (i === 2 ? 158 : 130))) + 22,
                      top: TIMELINE_Y + 112,
                      fontFamily: poppins,
                      fontSize: 28,
                      fontWeight: 500,
                      color: COLORS.white,
                      opacity: 0.8 * show,
                    }}
                  >
                    {m.sub}
                  </div>
                </React.Fragment>
              );
            })}
            {/* halo "kamu" di ujung garis waktu (klausa 3) */}
            {at >= c3.start ? (
              <div
                style={{
                  position: 'absolute',
                  left: 1690 - 95,
                  top: TIMELINE_Y - 95,
                  width: 190,
                  height: 190,
                  borderRadius: '50%',
                  border: `5px solid ${COLORS.orange}`,
                  opacity: 0.55 + 0.3 * Math.sin(frame * 0.12),
                  transform: `scale(${1 + 0.05 * Math.sin(frame * 0.12)})`,
                }}
              />
            ) : null}
          </AbsoluteFill>
        </Camera>
      </SceneShell>
    );
  }

  // ---------- Klausa 1: kembali berjemur ----------
  return (
    <SceneShell scene={scene}>
      <BaskingSet frame={frame} glow={0.55 + 0.45 * cp(c1)} beam />
    </SceneShell>
  );
};
