import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Clause, Scene} from '../script';
import {COLORS, poppins} from '../theme';
import {clamp01, prog} from './helpers';

/** Konteks waktu di dalam satu adegan (frame lokal Sequence). */
export const useSceneClock = (scene: Scene) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lt = frame / fps; // detik lokal sejak awal adegan
  const at = scene.start + lt; // detik absolut dalam video
  /** Progres 0..1 sebuah klausa pada waktu lokal sekarang. */
  const cp = (clause: Clause): number => prog(at, clause.start, clause.end);
  /** Klausa yang sedang aktif di adegan ini. */
  const active = scene.clauses.find((c) => at >= c.start && at < c.end) ?? scene.clauses[scene.clauses.length - 1];
  return {frame, fps, lt, at, cp, active};
};

/**
 * Kerangka adegan: transisi masuk/keluar berupa ZOOM (bukan fade hitam).
 * Masuk: scale 1.16 -> 1. Keluar: scale 1 -> 1.08 (mendorong ke adegan berikut).
 */
export const SceneShell: React.FC<{scene: Scene; children: React.ReactNode}> = ({scene, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const durFrames = (scene.end - scene.start) * fps;
  const scale = interpolate(
    frame,
    [0, 0.7 * fps, durFrames - 0.6 * fps, durFrames],
    [1.16, 1, 1, 1.08],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
  );
  return <AbsoluteFill style={{transform: `scale(${scale})`}}>{children}</AbsoluteFill>;
};

/** Label kecil berbentuk pil. */
export const Chip: React.FC<{
  x?: number;
  y?: number;
  children: React.ReactNode;
  size?: number;
  bg?: string;
  fg?: string;
  opacity?: number;
  scale?: number;
}> = ({x, y, children, size = 34, bg = COLORS.yellow, fg = COLORS.navy, opacity = 1, scale = 1}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
        backgroundColor: bg,
        color: fg,
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.15,
        padding: `${size * 0.28}px ${size * 0.55}px`,
        borderRadius: 999,
        opacity,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** Teks besar Poppins Bold (judul/angka) yang muncul dengan spring. */
export const BigText: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  appear: number; // 0..1 progres kemunculan
  align?: 'left' | 'center';
  width?: number;
}> = ({x, y, children, size = 92, color = COLORS.white, appear, align = 'left', width}) => {
  const shown = interpolate(appear, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.6)),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: `scale(${0.6 + 0.4 * shown})`,
        transformOrigin: align === 'center' ? 'center top' : 'left top',
        opacity: clamp01(appear * 3),
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.08,
        color,
        textAlign: align,
        whiteSpace: width ? 'normal' : 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** Timer MM:SS bergaya stopwatch di dalam pil gelap. */
export const TimerBadge: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  opacity?: number;
  accent?: string;
}> = ({x, y, text, size = 84, opacity = 1, accent = COLORS.yellow}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        backgroundColor: 'rgba(4, 12, 28, 0.82)',
        border: `3px solid ${accent}`,
        borderRadius: 22,
        padding: '10px 30px',
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 2,
        color: COLORS.white,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {text}
    </div>
  );
};
