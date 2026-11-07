import React from 'react';
import {spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS, arabicFont} from '../theme';
import {Camera} from '../components/Camera';
import {SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp, prog} from '../components/helpers';
import {ChildGirl, DiningStage} from '../components/stage';

/**
 * BERDOA — kedua tangan terangkat (tangan keluar dari sisi jilbab).
 * Teks Arab doa tampil BESAR di tengah dan TERBANGUN per klausa:
 * doa-1 menampilkan kelompok pertama, doa-2 menambahkan kelompok
 * kedua, doa-3 melengkapi. Kelompok aktif tersorot kuning dan
 * membesar dengan spring; kelompok sebelumnya tampil normal.
 * Pada sisa jendela doa-3 (ucapan selesai ±18,7 dtk) doa lengkap
 * tertahan dengan cahaya yang menguat perlahan.
 */
export const BerdoaScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, lt, at} = useSceneClock(scene);
  const [intro, d1, d2, d3] = scene.clauses;
  const doaClauses = [d1, d2, d3];

  const zoom = lerp(lt, [0, scene.end - scene.start], [1.0, 1.05]);
  const prayProgress = prog(at, intro.start + 0.2, d1.start + 0.1);

  // Cahaya lembut turun: menguat sejak doa dimulai, makin kuat saat doa lengkap tertahan.
  const holdGlow = prog(at, 18.7, 20.7);
  const glowOpacity = 0.16 + 0.22 * prog(at, d1.start, d2.start) + 0.26 * holdGlow;
  const beamOpacity = 0.05 + 0.06 * prog(at, d1.start, d2.start) + 0.08 * holdGlow;

  const visibleCount = at >= d3.start ? 3 : at >= d2.start ? 2 : at >= d1.start ? 1 : 0;
  // Kelompok aktif: klausa doa yang sedang diucapkan (doa-3 hanya sampai ±18,7 dtk).
  const activeIdx = doaClauses.findIndex((c) => at >= c.start && at < (c.id === 'doa-3' ? 18.7 : c.end));

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom} originY={360}>
        <DiningStage variant="berdoa" figureY={36} figure={<ChildGirl pose="rest" prayProgress={prayProgress} />} />

        {/* cahaya turun dari atas tengah */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 560,
            top: -320,
            width: 1120,
            height: 900,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,183,3,${glowOpacity}) 0%, rgba(255,183,3,0) 68%)`,
            pointerEvents: 'none',
          }}
        />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
          <g fill={COLORS.yellow} opacity={beamOpacity}>
            <polygon points="830,0 990,0 1180,1080 640,1080" />
            <polygon points="660,0 730,0 560,1080 380,1080" />
            <polygon points="1190,0 1260,0 1560,1080 1380,1080" />
          </g>
        </svg>

        {/* teks Arab doa SATU BARIS, terbangun per klausa */}
        {visibleCount > 0 ? (
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              left: 180,
              top: 46,
              width: 1560,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontFamily: arabicFont,
              fontSize: 88,
              lineHeight: 1.9,
              color: COLORS.ink,
            }}
          >
            {doaClauses.slice(0, visibleCount).map((c, i) => {
              const isActive = i === activeIdx;
              const startFrame = Math.round((c.start - scene.start) * fps);
              const s = isActive ? spring({frame: frame - startFrame, fps, config: {damping: 10, stiffness: 130}}) : 1;
              const popIn = spring({frame: frame - startFrame, fps, config: {damping: 14, stiffness: 120}});
              return (
                <React.Fragment key={c.id}>
                  {i > 0 ? ' ' : null}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0px 18px',
                      borderRadius: 22,
                      backgroundColor: isActive ? COLORS.yellow : 'transparent',
                      fontWeight: isActive ? 700 : 400,
                      opacity: Math.min(1, popIn * 1.6),
                      transform: `scale(${isActive ? 0.92 + 0.13 * s : 0.94 + 0.06 * popIn})`,
                    }}
                  >
                    {c.arab}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        ) : null}
      </Camera>
    </SceneShell>
  );
};
