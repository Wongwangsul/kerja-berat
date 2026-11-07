import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clauseAt} from '../script';
import {COLORS, poppins} from '../theme';

/**
 * Subtitle bawah layar: SATU klausa per tampil, sinkron persis
 * dengan start/end klausa aktif di script.ts. Muncul-menghilang
 * cepat (0,18 detik) di tepi klausa — bukan fade antar-adegan.
 */
export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const clause = clauseAt(t);
  if (!clause) return null;

  const fadeIn = interpolate(frame, [clause.start * fps, clause.start * fps + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [clause.end * fps - 6, clause.end * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const rise = interpolate(opacity, [0, 1], [12, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          backgroundColor: 'rgba(4, 12, 28, 0.78)',
          border: `1px solid rgba(241, 245, 249, 0.14)`,
          borderRadius: 18,
          padding: '16px 34px',
          fontFamily: poppins,
          fontWeight: 500,
          fontSize: 41,
          lineHeight: 1.35,
          color: COLORS.white,
          textAlign: 'center',
        }}
      >
        {clause.text}
      </div>
    </div>
  );
};
