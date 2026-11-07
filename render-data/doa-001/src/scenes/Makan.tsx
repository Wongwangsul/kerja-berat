import React from 'react';
import {spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {Camera} from '../components/Camera';
import {BigText, Chip, SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp, prog} from '../components/helpers';
import {ChildGirl, DiningStage} from '../components/stage';

const SPARKS: {x: number; y: number; s: number; kind: 'star' | 'heart'; color: string; ph: number}[] = [
  {x: 822, y: 606, s: 30, kind: 'star', color: COLORS.yellow, ph: 0},
  {x: 1096, y: 592, s: 26, kind: 'heart', color: COLORS.orange, ph: 1.3},
  {x: 884, y: 548, s: 24, kind: 'star', color: COLORS.green, ph: 2.1},
  {x: 1050, y: 652, s: 28, kind: 'star', color: COLORS.orange, ph: 0.7},
  {x: 986, y: 536, s: 22, kind: 'heart', color: COLORS.yellow, ph: 2.8},
  {x: 786, y: 660, s: 22, kind: 'star', color: COLORS.yellow, ph: 1.8},
];

const SparkShape: React.FC<{s: number; kind: 'star' | 'heart'; color: string}> = ({s, kind, color}) => {
  if (kind === 'heart') {
    return (
      <svg width={s * 2} height={s * 2} viewBox="0 0 24 24">
        <path d="M12 21 C 5 15.5, 2 11.5, 2 7.9 C 2 4.9, 4.3 2.5, 7.2 2.5 C 9.3 2.5, 11.1 3.6, 12 5.2 C 12.9 3.6, 14.7 2.5, 16.8 2.5 C 19.7 2.5, 22 4.9, 22 7.9 C 22 11.5, 19 15.5, 12 21 Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={s * 2} height={s * 2} viewBox="0 0 24 24">
      <path d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z" fill={color} />
    </svg>
  );
};

/**
 * MAKAN — makan-1: tangan turun dari posisi berdoa dan teks Latin
 * "Bismillahirrahmanirrahim" tampil elegan di tengah sesaat.
 * makan-2: anak menyendok piring -> mulut berulang, percik
 * bintang/hati + label "Yummy!". makan-3: lencana centang hijau
 * besar muncul dengan spring dan tanda centang tergambar.
 */
export const MakanScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, lt, at} = useSceneClock(scene);
  const [c1, c2, c3] = scene.clauses;

  const zoom = lerp(lt, [0, scene.end - scene.start], [1.03, 1.09]);

  const inC1 = at < c2.start;
  const inC2 = at >= c2.start && at < c3.start;
  const prayProgress = inC1 ? 1 - prog(at, c1.start, c1.start + 0.8) : 0;
  const eatPhase = inC2 ? ((at - c2.start) % 1.05) / 1.05 : 0;

  const bismIn = spring({frame: frame - 4, fps, config: {damping: 13, stiffness: 110}});
  const bismOut = prog(at, c1.end - 0.35, c1.end);
  const bismOpacity = inC1 ? Math.max(0, Math.min(1, bismIn) - bismOut) : 0;
  const lineW = 460 * Math.min(1, bismIn) * (1 - bismOut);

  const sparkWin = prog(at, c2.start, c2.start + 0.25) * (1 - prog(at, c2.end - 0.2, c2.end));
  const yummyScale = inC2 || at >= c2.start ? spring({frame: frame - Math.round((c2.start - scene.start) * fps), fps, config: {damping: 10, stiffness: 130}}) : 0;

  const badgeScale = spring({frame: frame - Math.round((c3.start - scene.start) * fps), fps, config: {damping: 11, stiffness: 120}});
  const checkProg = prog(at, c3.start + 0.28, c3.start + 0.9);
  const pulse = (lt % 1) / 1;

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom} originY={620}>
        <DiningStage
          figure={
            inC2 ? (
              <ChildGirl pose="eat" eatPhase={eatPhase} />
            ) : (
              <ChildGirl pose="rest" prayProgress={inC1 ? prayProgress : undefined} />
            )
          }
        />

        {/* makan-1: Bismillah */}
        {inC1 ? (
          <>
            <div style={{opacity: bismOpacity}}>
              <BigText x={260} y={238} width={1400} align="center" size={70} color={COLORS.green} appear={bismIn}>
                Bismillahirrahmanirrahim
              </BigText>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 960 - lineW / 2,
                top: 348,
                width: lineW,
                height: 7,
                borderRadius: 4,
                backgroundColor: COLORS.yellow,
              }}
            />
          </>
        ) : null}

        {/* makan-2: percik + label Yummy */}
        {inC2 ? (
          <>
            {SPARKS.map((sp, i) => {
              const sc = (0.65 + 0.35 * Math.sin(frame * 0.15 + sp.ph)) * sparkWin;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: sp.x - sp.s,
                    top: sp.y - sp.s,
                    transform: `scale(${Math.max(0, sc)})`,
                    opacity: sparkWin,
                  }}
                >
                  <SparkShape s={sp.s} kind={sp.kind} color={sp.color} />
                </div>
              );
            })}
            <Chip x={1152} y={508} size={42} scale={yummyScale} opacity={sparkWin}>
              Yummy!
            </Chip>
          </>
        ) : null}

        {/* makan-3: lencana centang hijau */}
        {at >= c3.start ? (
          <div style={{position: 'absolute', left: 1376, top: 246, width: 148, height: 148}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `5px solid ${COLORS.green}`,
                transform: `scale(${1 + pulse * 0.35})`,
                opacity: 0.45 * (1 - pulse),
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: COLORS.green,
                transform: `scale(${badgeScale})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(31,122,77,0.35)',
              }}
            >
              <svg width={92} height={92} viewBox="0 0 92 92">
                <path
                  d="M22 48 L40 66 L72 28"
                  fill="none"
                  stroke={COLORS.cream}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={86}
                  strokeDashoffset={86 * (1 - checkProg)}
                />
              </svg>
            </div>
          </div>
        ) : null}
      </Camera>
    </SceneShell>
  );
};
