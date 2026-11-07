import React from 'react';
import {Composition} from 'remotion';
import {CahayaMatahari} from './CahayaMatahari';
import {FPS, TOTAL_SECONDS} from './script';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CahayaMatahari"
      component={CahayaMatahari}
      durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
