import React from 'react';
import {AbsoluteFill} from 'remotion';

/**
 * <Camera> — pembungkus panggung 1920x1080 dengan scale + translate.
 * Dipakai untuk zoom-out kontinu (Hook, Seberapa Cepat) dan zoom-in
 * menembus Matahari (Di Dalam Matahari). Titik asal transformasi di
 * tengah panggung (960, 540) kecuali digeser lewat originX/originY.
 */
export const Camera: React.FC<{
  scale?: number;
  x?: number;
  y?: number;
  originX?: number;
  originY?: number;
  children: React.ReactNode;
}> = ({scale = 1, x = 0, y = 0, originX = 960, originY = 540, children}) => {
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: `${originX}px ${originY}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
