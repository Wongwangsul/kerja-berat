import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';

export const Root: React.FC = () => {
  return (
    <Composition
      id="JanganMenilai"
      component={Video}
      durationInFrames={1026}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
