'use client';

import { Player } from '@remotion/player';
import { UpperMidwestVideo } from '@/remotion/UpperMidwestVideo';

export default function VideoPlayer() {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
      <Player
        component={UpperMidwestVideo}
        durationInFrames={2280}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        controls
        style={{
          width: '100%',
          aspectRatio: '16/9',
        }}
        autoPlay={false}
      />
    </div>
  );
}
