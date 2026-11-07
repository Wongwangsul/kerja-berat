import {Easing, interpolate} from 'remotion';

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Progres 0..1 dari waktu t (detik) di dalam jendela [a, b]. */
export const prog = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));

/** interpolate() dengan clamp + easing halus sebagai bawaan. */
export const lerp = (
  t: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = Easing.out(Easing.cubic),
): number =>
  interpolate(t, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** RNG deterministik (mulberry32) — bintang & jalur acak stabil antar-render. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const idFmt = new Intl.NumberFormat('id-ID');

/** Format angka ala Indonesia: 11800 -> "11.800", 170000 -> "170.000". */
export const fmtID = (n: number): string => idFmt.format(Math.round(n));

/** Format satu desimal ala Indonesia: 7.5 -> "7,5". */
export const fmtDec1 = (n: number): string =>
  n.toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1});

/** Format detik menjadi "MM:SS" (500 -> "08:20"). */
export const fmtTimer = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};
