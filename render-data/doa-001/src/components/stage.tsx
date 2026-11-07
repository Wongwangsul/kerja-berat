import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {clamp01} from './helpers';

// ============================================================
// Panggung ruang makan + tokoh anak PEREMPUAN BERHIJAB.
// Semua vektor datar SVG/CSS, tanpa gambar luar. Tokoh tanpa
// wajah (faceless): oval wajah polos di dalam bingkai jilbab.
// Palet: jilbab hijau #1F7A4D (kontras di atas krem), gaun
// oranye #FB8500, kulit/oval wajah krem #FFF7E6.
// ============================================================

type Pt = {x: number; y: number};
const lp = (a: Pt, b: Pt, t: number): Pt => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
const rot = (p: Pt, c: Pt, ang: number): Pt => {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return {x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos};
};

const SKIN = COLORS.cream; // oval wajah & tangan: krem polos tanpa fitur wajah
const SLEEVE = COLORS.orange;

/**
 * Anak perempuan berhijab, tampak depan, duduk di balik meja.
 * pose: 'wave' melambai | 'stop' isyarat berhenti | 'rest' tangan di meja | 'eat' menyendok.
 * prayProgress 0..1 menggerakkan kedua tangan dari posisi rest ke posisi berdoa.
 * eatPhase 0..1 posisi siklus sendok piring -> mulut -> piring.
 */
export const ChildGirl: React.FC<{
  pose: 'wave' | 'stop' | 'rest' | 'eat';
  prayProgress?: number;
  eatPhase?: number;
}> = ({pose, prayProgress, eatPhase = 0}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame * 0.045) * 3;

  const SL: Pt = {x: 212, y: 352};
  const SR: Pt = {x: 428, y: 352};
  const restL = {e: {x: 168, y: 436}, h: {x: 178, y: 502}};
  const restR = {e: {x: 472, y: 436}, h: {x: 462, y: 502}};
  const prayL = {e: {x: 172, y: 448}, h: {x: 296, y: 350}};
  const prayR = {e: {x: 468, y: 448}, h: {x: 344, y: 350}};

  let eL = restL.e;
  let hL = restL.h;
  let eR = restR.e;
  let hR = restR.h;

  if (prayProgress !== undefined) {
    const p = clamp01(prayProgress);
    eL = lp(restL.e, prayL.e, p);
    hL = lp(restL.h, prayL.h, p);
    eR = lp(restR.e, prayR.e, p);
    hR = lp(restR.h, prayR.h, p);
  } else if (pose === 'wave') {
    const ang = Math.sin(frame * 0.16) * 0.19;
    eR = rot({x: 540, y: 292}, SR, ang);
    hR = rot({x: 560, y: 168}, SR, ang);
  } else if (pose === 'stop') {
    eR = {x: 524, y: 402};
    hR = {x: 552, y: 318};
  } else if (pose === 'eat') {
    // Sendok: piring (452,502) -> mulut (340,254) lewat titik kendali (428,318).
    // Siku ikut naik mengikuti tangan agar lengan bawah tidak memanjang absurd.
    const ph = eatPhase;
    const u = ph < 0.45 ? 1 - Math.pow(1 - ph / 0.45, 2) : ph < 0.62 ? 1 : 1 - (ph - 0.62) / 0.38;
    const P0 = {x: 452, y: 502};
    const C = {x: 428, y: 318};
    const P1 = {x: 340, y: 254};
    hR = {
      x: (1 - u) * (1 - u) * P0.x + 2 * (1 - u) * u * C.x + u * u * P1.x,
      y: (1 - u) * (1 - u) * P0.y + 2 * (1 - u) * u * C.y + u * u * P1.y,
    };
    eR = {x: 486 - 56 * u, y: 424 - 94 * u};
  }

  const praying = prayProgress !== undefined && prayProgress > 0.05;
  const spoonAngle =
    pose === 'eat' ? Math.atan2(hR.y - eR.y, hR.x - eR.x) * (180 / Math.PI) + 90 : 0;

  const arm = (s: Pt, e: Pt, h: Pt) => (
    <polyline
      points={`${s.x},${s.y} ${e.x},${e.y} ${h.x},${h.y}`}
      fill="none"
      stroke={SLEEVE}
      strokeWidth={40}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const hand = (h: Pt, side: 'L' | 'R') =>
    praying ? (
      <ellipse
        cx={h.x}
        cy={h.y}
        rx={25}
        ry={14}
        fill={SKIN}
        transform={`rotate(${side === 'L' ? -20 : 20} ${h.x} ${h.y})`}
      />
    ) : (
      <circle cx={h.x} cy={h.y} r={17} fill={SKIN} />
    );

  return (
    <div style={{position: 'absolute', left: 640, top: 205, width: 640, height: 560}}>
      <svg width={640} height={560} viewBox="0 0 640 560" style={{overflow: 'visible'}}>
        <g transform={`translate(0 ${bob})`}>
          {/* gaun longgar oranye */}
          <path
            d="M206 360 C 252 420, 260 486, 264 560 L 376 560 C 380 486, 388 420, 434 360 C 378 384, 262 384, 206 360 Z"
            fill={COLORS.orange}
          />
          <path d="M263 476 L 377 476 L 378 498 L 262 498 Z" fill={COLORS.yellow} opacity={0.85} />
          {/* jilbab hijau: lekuk kain dari kepala menutup leher & bahu */}
          <path
            d="M320 28 C 228 28, 186 118, 190 224 C 192 292, 172 344, 148 398 Q 320 364, 492 398 C 468 344, 448 292, 450 224 C 454 118, 412 28, 320 28 Z"
            fill={COLORS.green}
          />
          <path
            d="M428 118 C 446 192, 442 282, 418 352"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* oval wajah polos (faceless) */}
          <ellipse cx={320} cy={168} rx={60} ry={76} fill={SKIN} />
          {/* bros bunga kuning di sisi jilbab */}
          <g fill={COLORS.yellow}>
            {[0, 72, 144, 216, 288].map((deg) => {
              const a = (deg * Math.PI) / 180;
              return <circle key={deg} cx={238 + Math.cos(a) * 10} cy={262 + Math.sin(a) * 10} r={8} />;
            })}
            <circle cx={238} cy={262} r={6.5} fill={COLORS.orange} />
          </g>
          {/* lengan (keluar dari sisi jilbab) + tangan */}
          {arm(SL, eL, hL)}
          {arm(SR, eR, hR)}
          {pose === 'stop' ? <circle cx={hR.x} cy={hR.y} r={25} fill={SKIN} /> : hand(hR, 'R')}
          {hand(hL, 'L')}
          {/* sendok saat makan */}
          {pose === 'eat' ? (
            <g transform={`translate(${hR.x} ${hR.y}) rotate(${spoonAngle})`}>
              <line x1={0} y1={6} x2={0} y2={-36} stroke={COLORS.ink} strokeWidth={6} strokeLinecap="round" />
              <ellipse cx={0} cy={-45} rx={11} ry={15} fill={COLORS.cream} stroke={COLORS.ink} strokeWidth={3} />
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  );
};

/** Uap makanan: tiga gelombang putih yang terus naik di atas piring. */
const Steam: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {[908, 960, 1012].map((x, i) => {
        const dy = -4 - 5 * Math.sin(frame * 0.055 + i * 1.1);
        const op = 0.4 + 0.18 * Math.sin(frame * 0.055 + i * 1.1);
        return (
          <path
            key={x}
            d={`M ${x} 650 C ${x - 15} 624, ${x + 15} 608, ${x} 578`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={7}
            strokeLinecap="round"
            opacity={op}
            transform={`translate(0 ${dy})`}
          />
        );
      })}
    </svg>
  );
};

/** Jendela hangat di kiri atas + berkas cahaya bergoyang halus. */
const WindowLight: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.012) * 1.3;
  const rayRot = frame * 0.2;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(${sway} 300 420)`} fill={COLORS.yellow}>
          <polygon points="300,420 520,420 1030,770 690,770" opacity={0.1} />
          <polygon points="120,420 210,420 760,770 610,770" opacity={0.07} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 84,
          top: 72,
          width: 430,
          height: 350,
          border: `12px solid ${COLORS.wood}`,
          borderRadius: 20,
          background: 'linear-gradient(180deg, #FFE9B8 0%, #FFF6DE 100%)',
          overflow: 'hidden',
        }}
      >
        <svg width={430} height={350} style={{position: 'absolute', inset: 0}}>
          <g transform={`rotate(${rayRot} 180 148)`} stroke={COLORS.orange} strokeWidth={7} strokeLinecap="round" opacity={0.8}>
            {Array.from({length: 8}, (_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={180 + Math.cos(a) * 66}
                  y1={148 + Math.sin(a) * 66}
                  x2={180 + Math.cos(a) * 88}
                  y2={148 + Math.sin(a) * 88}
                />
              );
            })}
          </g>
          <circle cx={180} cy={148} r={50} fill={COLORS.yellow} />
          <ellipse cx={110} cy={286} rx={120} ry={30} fill="#FFFFFF" opacity={0.55} />
          <ellipse cx={300} cy={306} rx={140} ry={34} fill="#FFFFFF" opacity={0.45} />
        </svg>
      </div>
    </>
  );
};

/** Meja kayu + piring nasi + mangkuk lauk + gelas jus, di depan tokoh. */
const TableFood: React.FC = () => {
  return (
    <>
      {/* permukaan + badan meja */}
      <div style={{position: 'absolute', left: 360, top: 688, width: 1200, height: 34, backgroundColor: COLORS.wood, borderRadius: 14}} />
      <div style={{position: 'absolute', left: 384, top: 722, width: 1152, height: 148, backgroundColor: COLORS.wood, borderRadius: '0 0 18px 18px'}} />
      <div style={{position: 'absolute', left: 384, top: 722, width: 1152, height: 148, backgroundColor: 'rgba(0,0,0,0.13)', borderRadius: '0 0 18px 18px'}} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* piring + nasi */}
        <ellipse cx={960} cy={700} rx={152} ry={34} fill="#FFFFFF" stroke="rgba(38,50,56,0.15)" strokeWidth={3} />
        <ellipse cx={960} cy={697} rx={110} ry={22} fill="#FFFDF6" stroke="rgba(38,50,56,0.08)" strokeWidth={2} />
        <ellipse cx={960} cy={686} rx={92} ry={25} fill="#FFFFFF" stroke="rgba(38,50,56,0.10)" strokeWidth={2} />
        <g fill="rgba(38,50,56,0.12)">
          <circle cx={930} cy={680} r={3.4} />
          <circle cx={972} cy={676} r={3.4} />
          <circle cx={995} cy={686} r={3.4} />
          <circle cx={950} cy={690} r={3.4} />
        </g>
        {/* mangkuk lauk */}
        <path d="M640 684 A60 30 0 0 0 760 684 Z" fill={COLORS.orange} />
        <ellipse cx={700} cy={684} rx={60} ry={14} fill={COLORS.green} />
        <g fill={COLORS.yellow}>
          <circle cx={678} cy={681} r={5} />
          <circle cx={706} cy={686} r={5} />
          <circle cx={726} cy={680} r={5} />
        </g>
        {/* gelas jus jeruk */}
        <rect x={1206} y={612} width={54} height={84} rx={9} fill="rgba(255,255,255,0.6)" stroke="rgba(38,50,56,0.25)" strokeWidth={3} />
        <rect x={1211} y={642} width={44} height={49} rx={6} fill={COLORS.orange} opacity={0.55} />
      </svg>
      <Steam />
    </>
  );
};

/**
 * Panggung lengkap ruang makan: dinding krem, lantai, jendela bercahaya,
 * tokoh (diberikan pemanggil), lalu meja & makanan di depannya.
 * Varian 'berdoa': tanpa jendela (diganti cahaya lembut kiri atas) agar
 * teks Arab satu baris di bagian atas tidak menabrak kusen jendela;
 * tokoh digeser turun figureY px agar teks tidak menabrak jilbab.
 */
export const DiningStage: React.FC<{
  figure: React.ReactNode;
  variant?: 'full' | 'berdoa';
  figureY?: number;
}> = ({figure, variant = 'full', figureY = 0}) => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.cream}}>
      {/* lantai */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 872, bottom: 0, backgroundColor: 'rgba(251,133,0,0.10)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 866, height: 6, backgroundColor: 'rgba(141,110,99,0.35)'}} />
      {variant === 'berdoa' ? (
        <div
          style={{
            position: 'absolute',
            left: -160,
            top: -180,
            width: 620,
            height: 620,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,183,3,0.35) 0%, rgba(255,183,3,0) 68%)',
          }}
        />
      ) : (
        <WindowLight />
      )}
      <div style={{transform: figureY ? `translateY(${figureY}px)` : undefined}}>{figure}</div>
      <TableFood />
    </AbsoluteFill>
  );
};

/** Matahari kecil cerah (adegan tutup): cakram kuning + sinar berputar pelan. */
export const SmallSun: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => {
  const frame = useCurrentFrame();
  const rot = frame * 0.25;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <circle cx={cx} cy={cy} r={r * 1.5} fill={COLORS.yellow} opacity={0.18} />
      <g transform={`rotate(${rot} ${cx} ${cy})`} stroke={COLORS.orange} strokeWidth={r * 0.09} strokeLinecap="round">
        {Array.from({length: 8}, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * (r * 1.18)}
              y1={cy + Math.sin(a) * (r * 1.18)}
              x2={cx + Math.cos(a) * (r * 1.62)}
              y2={cy + Math.sin(a) * (r * 1.62)}
            />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={COLORS.yellow} />
    </svg>
  );
};
