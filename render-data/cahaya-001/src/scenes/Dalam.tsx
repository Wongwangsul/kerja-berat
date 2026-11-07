import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Scene} from '../script';
import {COLORS, poppins} from '../theme';
import {PersonWalking} from '../components/primitives';
import {BigText, Chip, SceneShell, useSceneClock} from '../components/scene-ui';
import {fmtID, lerp, mulberry32, prog} from '../components/helpers';

const CX = 960;
const CY = 540;
const R_CORE = 150;
const R_RAD = 300;
const R_OUT = 430;

// ------------------------------------------------------------
// Jalur "jalan acak" foton di zona radiatif: digenerate sekali,
// deterministik (seed tetap), mulai dari tepi inti & merayap keluar.
// ------------------------------------------------------------
type Pt = {x: number; y: number; r: number};
const WALK_PTS: Pt[] = (() => {
  const rnd = mulberry32(20261107);
  const pts: Pt[] = [];
  let x = CX + R_CORE * Math.cos(-0.7);
  let y = CY + R_CORE * Math.sin(-0.7);
  let heading = -0.7;
  pts.push({x, y, r: R_CORE});
  for (let i = 0; i < 96; i++) {
    const outward = Math.atan2(y - CY, x - CX);
    heading = heading * 0.82 + outward * 0.18 + (rnd() - 0.5) * 1.7;
    const step = 32 + rnd() * 22;
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    const dx = x - CX;
    const dy = y - CY;
    let r = Math.hypot(dx, dy);
    // Jalan acak terjadi DI DALAM zona radiatif: batasi radius <= R_RAD - 8.
    const R_WALK_MAX = R_RAD - 8;
    if (r > R_WALK_MAX) {
      const s = R_WALK_MAX / r;
      x = CX + dx * s;
      y = CY + dy * s;
      r = R_WALK_MAX;
      heading = outward + Math.PI * (0.7 + rnd() * 0.6);
    }
    if (r < R_CORE - 6) {
      const s = (R_CORE - 6) / r;
      x = CX + dx * s;
      y = CY + dy * s;
      r = R_CORE - 6;
    }
    pts.push({x, y, r});
  }
  return pts;
})();

const WALK_D = WALK_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

const walkHead = (q: number): Pt => {
  const f = Math.min(0.9999, Math.max(0, q)) * (WALK_PTS.length - 1);
  const i = Math.floor(f);
  const fr = f - i;
  const a = WALK_PTS[i];
  const b = WALK_PTS[Math.min(WALK_PTS.length - 1, i + 1)];
  return {x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr, r: a.r};
};

/** Penampang Matahari berlapis: inti, zona radiatif, zona konveksi. */
const CrossSection: React.FC<{
  s: number; // skala radius 0..1
  frame: number;
  corePulse?: number;
  labels: number; // 0..1 kemunculan label lapis
}> = ({s, frame, corePulse = 0, labels}) => {
  const rO = R_OUT * s;
  const rR = R_RAD * s;
  const rC = R_CORE * s * (1 + corePulse * 0.05 * Math.sin(frame * 0.3));
  // Jangkar label tersebar vertikal di sisi kanan agar tidak bertumpuk.
  const labelData = [
    {text: 'zona konveksi', r: (R_OUT + R_RAD) / 2, delay: 0.55, ax: 1620, ay: 235},
    {text: 'zona radiatif', r: (R_RAD + R_CORE) / 2, delay: 0.3, ax: 1655, ay: 390},
    {text: 'inti', r: R_CORE * 0.45, delay: 0.05, ax: 1620, ay: 545},
  ];
  const anchorOf = (l: (typeof labelData)[number]) => ({
    x: CX + (l.ax - CX) * s,
    y: CY + (l.ay - CY) * s,
  });
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={CX} cy={CY} r={rO * 1.12} fill={COLORS.orange} opacity={0.12} />
        <circle cx={CX} cy={CY} r={rO} fill={COLORS.orange} />
        {/* sel konveksi berputar pelan */}
        <g opacity={0.35} stroke={COLORS.yellow} strokeWidth={10} fill="none">
          <circle
            cx={CX}
            cy={CY}
            r={(R_OUT + R_RAD) / 2 * s}
            strokeDasharray={`${46 * s} ${58 * s}`}
            transform={`rotate(${frame * 0.25} ${CX} ${CY})`}
          />
        </g>
        <circle cx={CX} cy={CY} r={rR} fill={COLORS.yellow} />
        <circle cx={CX} cy={CY} r={rC} fill={COLORS.yellow} />
        <circle cx={CX} cy={CY} r={rC * 0.52} fill={COLORS.white} opacity={0.92} />
        {/* garis penunjuk label */}
        {labelData.map((l, i) => {
          const a = (-38 * Math.PI) / 180;
          const x1 = CX + Math.cos(a) * l.r * s;
          const y1 = CY + Math.sin(a) * l.r * s;
          const an = anchorOf(l);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={an.x - 14}
              y2={an.y + 16}
              stroke={COLORS.white}
              strokeWidth={3}
              opacity={0.65 * prog(labels, l.delay, l.delay + 0.25)}
            />
          );
        })}
      </svg>
      {labelData.map((l, i) => {
        const an = anchorOf(l);
        return (
          <Chip key={i} x={an.x} y={an.y} size={28} bg={i === 2 ? COLORS.white : i === 1 ? COLORS.yellow : COLORS.orange} opacity={prog(labels, l.delay, l.delay + 0.25)}>
            {l.text}
          </Chip>
        );
      })}
    </>
  );
};

/** Jalur zigzag jalan acak; progress 0..1 menggambar jalurnya. */
const WalkPath: React.FC<{
  progress: number;
  stroke?: string;
  width?: number;
  opacity?: number;
  highlightBackward?: boolean;
  head?: boolean;
}> = ({progress, stroke = COLORS.navy, width = 5, opacity = 1, highlightBackward = false, head = true}) => {
  const headPt = walkHead(progress);
  const drawnCount = Math.floor(progress * (WALK_PTS.length - 1));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} viewBox="0 0 1920 1080">
      <path d={WALK_D} fill="none" stroke={stroke} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} opacity={opacity} />
      {highlightBackward
        ? WALK_PTS.slice(1, drawnCount + 1).map((p, i) =>
            p.r < WALK_PTS[i].r - 2 ? (
              <line key={i} x1={WALK_PTS[i].x} y1={WALK_PTS[i].y} x2={p.x} y2={p.y} stroke={COLORS.white} strokeWidth={width + 3} strokeLinecap="round" opacity={0.95} />
            ) : null,
          )
        : null}
      {head && progress > 0 ? (
        <>
          <circle cx={headPt.x} cy={headPt.y} r={15} fill={COLORS.white} stroke={COLORS.navy} strokeWidth={3} />
          <circle cx={headPt.x} cy={headPt.y} r={30} fill={COLORS.white} opacity={0.22} />
        </>
      ) : null}
    </svg>
  );
};

export const DalamScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, at, cp} = useSceneClock(scene);
  const [c1, c2, c3, c4, c5, c6, c7] = scene.clauses;

  const particles = useMemo(() => {
    const rnd = mulberry32(5);
    return Array.from({length: 46}, (_, i) => {
      const a = rnd() * Math.PI * 2;
      const r = R_CORE + 14 + rnd() * (R_RAD - R_CORE - 26);
      return {x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, rad: 4 + rnd() * 6, key: i};
    });
  }, []);

  const sparkles = useMemo(() => Array.from({length: 14}, (_, i) => i / 14), []);

  // ---------- Klausa 6: counter 0 -> 170.000 tahun ----------
  if (at >= c6.start && at < c7.start) {
    const p = cp(c6);
    const val = lerp(p, [0, 1], [0, 170000]);
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <div style={{position: 'absolute', left: -340, top: -191, width: 2600, height: 1462, opacity: 0.13}}>
            <WalkPath progress={1} stroke={COLORS.yellow} width={4} head={false} />
          </div>
          <BigText x={0} y={330} width={1920} align="center" size={190} color={COLORS.yellow} appear={prog(at, c6.start + 0.2, c6.start + 0.9)}>
            {fmtID(val)}
          </BigText>
          <Chip x={878} y={560} size={40} opacity={prog(at, c6.start + 1.2, c6.start + 2)}>
            TAHUN
          </Chip>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 660,
              textAlign: 'center',
              fontFamily: poppins,
              fontSize: 31,
              fontWeight: 500,
              color: COLORS.white,
              opacity: 0.78 * prog(at, c6.start + 1.8, c6.start + 2.6),
            }}
          >
            perkiraan model, bukan stopwatch
          </div>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 7: zigzag raksasa vs garis lurus kecil "8 menit" ----------
  if (at >= c7.start) {
    const p = cp(c7);
    return (
      <SceneShell scene={scene}>
        <AbsoluteFill>
          <div style={{position: 'absolute', left: -560, top: -60, width: 2160, height: 1215, opacity: 0.96}}>
            <WalkPath progress={Math.min(1, p * 1.15)} stroke={COLORS.yellow} width={4.5} head={false} />
          </div>
          <Chip x={130} y={880} size={36} opacity={prog(at, c7.start + 1, c7.start + 1.8)}>
            170.000 TAHUN
          </Chip>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <line x1={1420} y1={430} x2={1420 + 190 * prog(at, c7.start + 0.8, c7.start + 1.6)} y2={430} stroke={COLORS.white} strokeWidth={7} strokeLinecap="round" />
            {p > 0.35 ? <circle cx={1610} cy={430} r={13} fill={COLORS.white} /> : null}
          </svg>
          <Chip x={1400} y={330} size={36} bg={COLORS.white} opacity={prog(at, c7.start + 1.2, c7.start + 2)}>
            8 MENIT
          </Chip>
        </AbsoluteFill>
      </SceneShell>
    );
  }

  // ---------- Klausa 1–5: penampang Matahari ----------
  const inWalk = at >= c3.start;
  const shrink = at >= c5.start ? lerp(cp(c5), [0, 0.25], [1, 0.66]) : 1;
  const liftY = at >= c5.start ? lerp(cp(c5), [0, 0.25], [0, -150]) : 0;
  const walkProgress = inWalk ? prog(at, c3.start, c5.end) : 0;

  return (
    <SceneShell scene={scene}>
      <AbsoluteFill>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${liftY}px) scale(${shrink})`, transformOrigin: '960px 540px'}}>
          <CrossSection
            s={at < c2.start ? lerp(cp(c1), [0, 1], [0.34, 1]) : 1}
            frame={frame}
            corePulse={at >= c2.start && at < c3.start ? 1 : 0}
            labels={at < c2.start ? prog(at, c1.start + 4.5, c1.start + 8.5) : 1}
          />
          {/* percikan fusi dari inti (klausa 2) */}
          {at >= c2.start && at < c3.start ? (
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              {sparkles.map((off, i) => {
                const cyc = (frame * 0.009 + off) % 1;
                const a = (i * Math.PI * 2) / 14 + 0.4;
                const rr = R_CORE + cyc * (R_RAD - R_CORE - 12);
                return <circle key={i} cx={CX + Math.cos(a) * rr} cy={CY + Math.sin(a) * rr} r={7} fill={COLORS.white} opacity={0.9 * (1 - cyc)} />;
              })}
            </svg>
          ) : null}
          {/* partikel padat zona radiatif (klausa 3+) */}
          {inWalk ? (
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              {particles.map((pt) => (
                <circle key={pt.key} cx={pt.x} cy={pt.y} r={pt.rad} fill={COLORS.navy} opacity={0.35} />
              ))}
            </svg>
          ) : null}
          {/* jalur jalan acak */}
          {inWalk ? <WalkPath progress={walkProgress} highlightBackward={at >= c4.start} /> : null}
        </div>

        {at >= c2.start && at < c3.start ? (
          <Chip x={120} y={120} size={36} opacity={prog(at, c2.start + 0.6, c2.start + 1.4)}>
            INTI — TEMPAT FUSI
          </Chip>
        ) : null}

        {/* klausa 5: orang mabuk jalan pulang di strip bawah */}
        {at >= c5.start ? (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <path
                d="M120 968 Q 360 930, 600 968 T 1080 968 T 1560 968 T 1860 950"
                fill="none"
                stroke={COLORS.white}
                strokeWidth={4}
                strokeDasharray="12 12"
                pathLength={1}
                strokeDashoffset={1 - prog(at, c5.start, c5.end)}
                opacity={0.6}
              />
              <line x1={0} y1={986} x2={1920} y2={986} stroke={COLORS.white} strokeWidth={3} opacity={0.2} />
            </svg>
            <PersonWalking
              x={180 + prog(at, c5.start, c5.end) * 1150}
              y={782 + Math.sin(frame * 0.11) * 7}
              size={185}
              lean={Math.sin(frame * 0.09) * 8}
            />
            <Chip x={820} y={130} size={38} bg={COLORS.orange} opacity={prog(at, c5.start + 1.4, c5.start + 2.2)}>
              JALAN ACAK
            </Chip>
          </>
        ) : null}
      </AbsoluteFill>
    </SceneShell>
  );
};
