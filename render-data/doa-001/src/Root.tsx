import React from 'react';
import {Composition} from 'remotion';
import {DoaSebelumMakan} from './DoaSebelumMakan';
import {FPS, TOTAL_SECONDS} from './script';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DoaSebelumMakan"
      component={DoaSebelumMakan}
      durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
