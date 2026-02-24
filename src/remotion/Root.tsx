import React from 'react';
import { Composition } from 'remotion';
import { UpperMidwestVideo } from './UpperMidwestVideo';
import { ThemedVideo } from './ThemedVideo';
import { THEMES } from './themes';
import { getScriptForTheme } from './scripts';
import { GridIsFull } from './videos/GridIsFull';
import { SiteFlyover, SITE_FLYOVER_DURATION } from './videos/SiteFlyover';
import { CentralizedVsDistributed, CVD_DURATION } from './videos/CentralizedVsDistributed';
import { NetworkEffect, NETWORK_EFFECT_DURATION } from './videos/NetworkEffect';
import { InvestorBrief, INVESTOR_BRIEF_DURATION } from './videos/InvestorBrief';

// Calculate total duration for each pacing (legacy themed videos)
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

      {/* ── 5 Distinct Videos ─────────────────────────────────────────── */}

      <Composition
        id="GridIsFull"
        component={GridIsFull}
        defaultProps={{ showSubtitles: true }}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="SiteFlyover"
        component={SiteFlyover}
        defaultProps={{ showSubtitles: true }}
        durationInFrames={SITE_FLYOVER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="CentralizedVsDistributed"
        component={CentralizedVsDistributed}
        defaultProps={{ showSubtitles: true }}
        durationInFrames={CVD_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="NetworkEffect"
        component={NetworkEffect}
        defaultProps={{ showSubtitles: true }}
        durationInFrames={NETWORK_EFFECT_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="InvestorBrief"
        component={InvestorBrief}
        defaultProps={{ showSubtitles: true }}
        durationInFrames={INVESTOR_BRIEF_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* ── Legacy themed compositions ────────────────────────────────── */}
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
