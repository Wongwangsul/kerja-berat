import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {SceneShell, TimerBadge, useSceneClock} from '../components/scene-ui';
import {mulberry32, prog} from '../components/helpers';

/**
 * JEDA NAPAS — adegan tenang: sinar masuk lewat jendela, lingkaran
 * napas membesar-mengecil. Klausa 2 menambahkan lencana timer 08:20
 * dengan panah putar-balik (ceritanya mundur lebih jauh).
 */
export const JedaScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, at} = useSceneClock(scene);
  const [c1, c2] = scene.clauses;

  const motes = useMemo(() => {
    const rnd = mulberry32(99);
    return Array.from({length: 26}, (_, i) => ({
      x: 640 + rnd() * 560,
      y: 200 + rnd() * 560,
      r: 2 + rnd() * 3.4,
      ph: rnd() * Math.PI * 2,
      sp: 0.008 + rnd() * 0.02,
      key: i,
    }));
  }, []);

  const sway = Math.sin(frame * 0.018) * 1.6;
  // Dua siklus napas penuh selama klausa 1 (masuk 0..0.5, keluar 0.5..1 per siklus).
  const breath = 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, (at - c1.start) / (c1.end - c1.start))) * Math.PI * 4);
  const ringScale = 0.82 + breath * 0.38;

  const showTimer = at >= c2.start;
  const rewindRot = -((frame * 3) % 360);

  return (
    <SceneShell scene={scene}>
      <AbsoluteFill>
        {/* cahaya matahari dari luar jendela (kanan atas) */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -160,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,183,3,0.5) 0%, rgba(251,133,0,0.18) 45%, rgba(251,133,0,0) 72%)`,
          }}
        />
        {/* berkas sinar masuk jendela, bergoyang halus */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <g transform={`rotate(${sway} 1360 130)`} fill={COLORS.yellow}>
            <polygon points="1010,130 1180,130 760,880 560,880" opacity={0.1} />
            <polygon points="1230,130 1330,130 1010,880 880,880" opacity={0.13} />
            <polygon points="820,130 900,130 480,760 380,760" opacity={0.07} />
          </g>
          {motes.map((m) => (
            <circle
              key={m.key}
              cx={m.x + Math.sin(frame * m.sp + m.ph) * 16}
              cy={m.y + Math.cos(frame * m.sp * 0.8 + m.ph) * 12}
              r={m.r}
              fill={COLORS.white}
              opacity={0.35}
            />
          ))}
        </svg>

        {/* kusen jendela */}
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: 110,
            width: 840,
            height: 780,
            border: `10px solid ${COLORS.white}`,
            borderRadius: 26,
            opacity: 0.55,
          }}
        />
        <div style={{position: 'absolute', left: 950, top: 110, width: 9, height: 780, backgroundColor: COLORS.white, opacity: 0.4}} />
        <div style={{position: 'absolute', left: 540, top: 492, width: 840, height: 9, backgroundColor: COLORS.white, opacity: 0.4}} />

        {/* lingkaran napas */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 150,
            top: 500 - 150,
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: `6px solid ${COLORS.yellow}`,
            opacity: 0.85,
            transform: `scale(${ringScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 960 - 150,
            top: 500 - 150,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,183,3,${0.1 + breath * 0.14}) 0%, rgba(255,183,3,0) 70%)`,
            transform: `scale(${ringScale})`,
          }}
        />

        {/* klausa 2: timer 08:20 + panah putar balik */}
        {showTimer ? (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <g transform={`rotate(${rewindRot} 450 884)`}>
                <path d="M 450 744 A 140 140 0 1 1 310 884" fill="none" stroke={COLORS.orange} strokeWidth={9} strokeLinecap="round" />
                <polygon points="302,854 292,898 336,888" fill={COLORS.orange} />
              </g>
            </svg>
            <div style={{opacity: prog(at, c2.start + 0.3, c2.start + 1.1)}}>
              <TimerBadge x={330} y={838} text="08:20" size={56} accent={COLORS.orange} />
            </div>
          </>
        ) : null}
      </AbsoluteFill>
    </SceneShell>
  );
};
