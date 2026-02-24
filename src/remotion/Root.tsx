import React from 'react';
import { Composition } from 'remotion';
import { UpperMidwestVideo } from './UpperMidwestVideo';
import { ThemedVideo } from './ThemedVideo';
import { THEMES } from './themes';
import { getScriptForTheme } from './scripts';

// Calculate total duration for each pacing
function calcDuration(pacing: 'standard' | 'fast' | 'cinematic') {
  const dur = (base: number) =>
    pacing === 'fast' ? Math.round(base * 0.85) :
    pacing === 'cinematic' ? Math.round(base * 1.1) : base;
  return dur(120) + dur(150) + dur(150) + dur(480) + dur(360) + dur(330) + dur(330) + dur(360);
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Original composition */}
      <Composition
        id="UpperMidwestHub"
        component={UpperMidwestVideo}
        durationInFrames={2280}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 5 themed compositions */}
      {THEMES.map(theme => {
        const script = getScriptForTheme(theme.id);
        const totalFrames = calcDuration(theme.pacing);
        return (
          <Composition
            key={theme.id}
            id={`UMW-${theme.id}`}
            component={ThemedVideo}
            defaultProps={{ theme, scriptSegments: script.segments }}
            durationInFrames={totalFrames}
            fps={30}
            width={1920}
            height={1080}
          />
        );
      })}
    </>
  );
};
