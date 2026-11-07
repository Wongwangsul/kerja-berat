import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
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
 * Masuk: scale 1.14 -> 1. Keluar: scale 1 -> 1.07 (mendorong ke adegan berikut).
 */
export const SceneShell: React.FC<{scene: Scene; children: React.ReactNode}> = ({scene, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const durFrames = (scene.end - scene.start) * fps;
  const scale = interpolate(
    frame,
    [0, 0.6 * fps, durFrames - 0.5 * fps, durFrames],
    [1.14, 1, 1, 1.07],
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
}> = ({x, y, children, size = 40, bg = COLORS.yellow, fg = COLORS.ink, opacity = 1, scale = 1}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        backgroundColor: bg,
        color: fg,
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.15,
        padding: `${size * 0.28}px ${size * 0.6}px`,
        borderRadius: 999,
        opacity,
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 18px rgba(38,50,56,0.18)',
      }}
    >
      {children}
    </div>
  );
};

/** Teks besar Poppins Bold yang muncul mengikuti progres kemunculan (spring di pemanggil). */
export const BigText: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  appear: number; // 0..1 progres kemunculan
  align?: 'left' | 'center';
  width?: number;
}> = ({x, y, children, size = 92, color = COLORS.ink, appear, align = 'left', width}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: `scale(${0.6 + 0.4 * clamp01(appear)})`,
        transformOrigin: align === 'center' ? 'center top' : 'left top',
        opacity: clamp01(appear * 3),
        fontFamily: poppins,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.12,
        color,
        textAlign: align,
        whiteSpace: width ? 'normal' : 'nowrap',
      }}
    >
      {children}
    </div>
  );
};
