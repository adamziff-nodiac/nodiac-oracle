import React from 'react';
import { Composition } from 'remotion';
import { UpperMidwestVideo } from './UpperMidwestVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="UpperMidwestHub"
        component={UpperMidwestVideo}
        durationInFrames={2280}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
