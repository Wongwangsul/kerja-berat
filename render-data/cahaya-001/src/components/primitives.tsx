import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {mulberry32} from './helpers';

// ============================================================
// Primitif visual: SEMUA vektor datar SVG/CSS. Tanpa gambar
// eksternal, tanpa foto. Tokoh = siluet sederhana tanpa wajah.
// ============================================================

/** Lapisan bintang statis dengan kelip halus (deterministik). */
export const Stars: React.FC<{count?: number; seed?: number}> = ({count = 130, seed = 42}) => {
  const frame = useCurrentFrame();
  const stars = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({length: count}, (_, i) => ({
      x: rnd() * 1920,
      y: rnd() * 1080,
      r: 1 + rnd() * 2.2,
      phase: rnd() * Math.PI * 2,
      speed: 0.02 + rnd() * 0.05,
      key: i,
    }));
  }, [count, seed]);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {stars.map((s) => (
        <circle
          key={s.key}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={COLORS.white}
          opacity={0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase))}
        />
      ))}
    </svg>
  );
};

/** Matahari: cakram kuning-oranye + halo + sinar berputar pelan. */
export const Sun: React.FC<{
  cx: number;
  cy: number;
  r: number;
  frame: number;
  opacity?: number;
  rays?: boolean;
  dimmed?: boolean;
}> = ({cx, cy, r, frame, opacity = 1, rays = true, dimmed = false}) => {
  const rayLen = r * 0.55;
  const rot = frame * 0.15;
  const main = dimmed ? COLORS.white : COLORS.yellow;
  const outer = dimmed ? COLORS.white : COLORS.orange;
  return (
    <svg
      width={1920}
      height={1080}
      style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}
    >
      <circle cx={cx} cy={cy} r={r * (rays ? 1.9 : 1.45)} fill={outer} opacity={dimmed ? 0.05 : 0.1} />
      <circle cx={cx} cy={cy} r={r * (rays ? 1.4 : 1.22)} fill={main} opacity={dimmed ? 0.08 : 0.16} />
      {rays ? (
        <g transform={`rotate(${rot} ${cx} ${cy})`} stroke={main} strokeWidth={r * 0.07} strokeLinecap="round" opacity={dimmed ? 0.25 : 0.85}>
          {Array.from({length: 8}, (_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = cx + Math.cos(a) * (r * 1.2);
            const y1 = cy + Math.sin(a) * (r * 1.2);
            const x2 = cx + Math.cos(a) * (r * 1.2 + rayLen);
            const y2 = cy + Math.sin(a) * (r * 1.2 + rayLen);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      ) : null}
      <circle cx={cx} cy={cy} r={r} fill={main} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill={dimmed ? COLORS.white : COLORS.yellow} opacity={dimmed ? 0.5 : 0.9} />
    </svg>
  );
};

/** Cakram Bumi: biru #219EBC + gumpalan daratan putih transparan. */
export const EarthDisc: React.FC<{cx: number; cy: number; r: number; glow?: number}> = ({
  cx,
  cy,
  r,
  glow = 0,
}) => {
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {glow > 0 ? <circle cx={cx} cy={cy} r={r * 1.45} fill={COLORS.earthBlue} opacity={0.18 * glow} /> : null}
      <circle cx={cx} cy={cy} r={r} fill={COLORS.earthBlue} />
      <g fill={COLORS.white} opacity={0.4}>
        <ellipse cx={cx - r * 0.35} cy={cy - r * 0.3} rx={r * 0.34} ry={r * 0.2} />
        <ellipse cx={cx + r * 0.3} cy={cy + r * 0.05} rx={r * 0.28} ry={r * 0.22} />
        <ellipse cx={cx - r * 0.05} cy={cy + r * 0.48} rx={r * 0.22} ry={r * 0.13} />
        <ellipse cx={cx + r * 0.45} cy={cy - r * 0.5} rx={r * 0.16} ry={r * 0.11} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.white} strokeWidth={Math.max(2, r * 0.03)} opacity={0.5} />
    </svg>
  );
};

/** Cakram Bulan: putih + kawah navy transparan. */
export const MoonDisc: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => {
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <circle cx={cx} cy={cy} r={r * 1.3} fill={COLORS.white} opacity={0.08} />
      <circle cx={cx} cy={cy} r={r} fill={COLORS.white} />
      <g fill={COLORS.navy} opacity={0.14}>
        <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.18} />
        <circle cx={cx + r * 0.25} cy={cy + r * 0.3} r={r * 0.13} />
        <circle cx={cx + r * 0.1} cy={cy - r * 0.45} r={r * 0.1} />
      </g>
    </svg>
  );
};

/** Siluet orang duduk bersila (berjemur) — tanpa wajah. Ukuran lewat prop size. */
export const PersonSitting: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
  flip?: boolean;
}> = ({x, y, size = 220, color = COLORS.white, flip = false}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <g fill={color}>
        <circle cx="100" cy="38" r="23" />
        <path d="M100 58 C 84 88, 79 116, 85 142 L 127 142 C 131 114, 123 86, 112 62 Z" />
        <path d="M110 76 C 138 92, 148 114, 144 140 L 127 135 C 129 114, 120 96, 103 85 Z" />
        <path d="M38 170 C 58 147, 88 152, 104 161 C 120 150, 150 148, 166 170 C 152 184, 54 184, 38 170 Z" />
      </g>
    </svg>
  );
};

/** Siluet orang berjalan (untuk "orang mabuk jalan pulang"). */
export const PersonWalking: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
  lean?: number;
}> = ({x, y, size = 200, color = COLORS.white, lean = 0}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      style={{position: 'absolute', left: x, top: y, transform: `rotate(${lean}deg)`}}
    >
      <g fill={color}>
        <circle cx="102" cy="30" r="21" />
        <path d="M102 48 C 92 78, 90 104, 94 128 L 110 128 C 112 102, 112 76, 110 52 Z" />
        <path d="M96 124 L 66 176 L 58 208 L 74 212 L 84 182 L 104 146 Z" />
        <path d="M106 126 L 138 158 L 168 172 L 174 158 L 146 142 L 118 116 Z" />
        <path d="M98 62 C 76 76, 64 92, 60 108 L 74 114 C 80 98, 90 84, 104 74 Z" />
        <path d="M108 62 C 128 70, 140 82, 146 96 L 132 104 C 126 90, 116 80, 102 72 Z" />
      </g>
    </svg>
  );
};

/** Siluet pesawat (tampak samping, hidung ke kanan). */
export const PlaneSilhouette: React.FC<{x: number; y: number; width?: number; color?: string}> = ({
  x,
  y,
  width = 260,
  color = COLORS.white,
}) => {
  return (
    <svg
      width={width}
      height={width * 0.36}
      viewBox="0 0 260 94"
      style={{position: 'absolute', left: x, top: y}}
    >
      <path
        fill={color}
        d="M14 58 C14 50 24 46 40 45 L160 42 C196 41 232 46 244 53 C252 58 246 65 230 66 L150 69 L86 69 C48 69 14 66 14 58 Z M30 46 L52 14 C56 8 64 8 65 15 L60 44 Z M138 68 L108 92 C104 96 96 95 98 88 L112 68 Z M36 67 L18 82 L30 82 L50 69 Z"
      />
    </svg>
  );
};

/** Siluet mobil (tampak samping). */
export const CarSilhouette: React.FC<{x: number; y: number; width?: number; color?: string}> = ({
  x,
  y,
  width = 280,
  color = COLORS.white,
}) => {
  return (
    <svg
      width={width}
      height={width * 0.42}
      viewBox="0 0 280 118"
      style={{position: 'absolute', left: x, top: y}}
    >
      <path
        fill={color}
        d="M8 78 L20 48 Q24 36 40 34 L84 32 L112 12 Q119 5 132 5 L178 5 Q192 5 202 14 L228 36 Q248 38 256 50 L266 68 Q272 78 262 78 L238 78 A30 30 0 0 0 178 78 L104 78 A30 30 0 0 0 44 78 L18 78 Q6 78 8 78 Z"
      />
      <circle cx="74" cy="78" r="24" fill={color} />
      <circle cx="208" cy="78" r="24" fill={color} />
      <circle cx="74" cy="78" r="10" fill={COLORS.navy} />
      <circle cx="208" cy="78" r="10" fill={COLORS.navy} />
    </svg>
  );
};

/** Panah animasi (garis + kepala panah) dari titik A ke B; progress 0..1 menggambar garisnya. */
export const AnimatedArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}> = ({x1, y1, x2, y2, progress, color = COLORS.yellow, width = 6, dashed = false}) => {
  const ex = x1 + (x2 - x1) * progress;
  const ey = y1 + (y2 - y1) * progress;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 26;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <line
        x1={x1}
        y1={y1}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '14 12' : undefined}
      />
      {progress > 0.92 ? (
        <polygon
          points={`${ex},${ey} ${ex - ah * Math.cos(ang - 0.42)},${ey - ah * Math.sin(ang - 0.42)} ${ex - ah * Math.cos(ang + 0.42)},${ey - ah * Math.sin(ang + 0.42)}`}
          fill={color}
        />
      ) : null}
    </svg>
  );
};
