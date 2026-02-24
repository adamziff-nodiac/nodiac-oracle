'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  Volume2,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  TRANSCRIPT_SEGMENTS,
  TOTAL_SITES,
  UPPER_MIDWEST_SITES,
} from '@/remotion/data';

const VideoPlayer = dynamic(() => import('@/components/videos/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-black/50 rounded-xl flex items-center justify-center">
      <div className="text-gray-400">Loading player...</div>
    </div>
  ),
});

const TOTAL_CAPACITY = Math.round(
  UPPER_MIDWEST_SITES.reduce((s, site) => s + site.capacityMW, 0)
);

export default function UpperMidwestHubVideoPage() {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-gradient-to-br dark:from-nodiac-dark dark:via-slate-900 dark:to-nodiac-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-xl hidden sm:inline">
              Nodiac
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Videos
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Upper Midwest Regional Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Investor-facing promo video &mdash; {TOTAL_SITES} sites, {TOTAL_CAPACITY}+ MW across MN, IA, WI
          </p>

          {/* Video Player */}
          <div className="mb-8">
            <VideoPlayer />
          </div>

          {/* Info grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Key Stats */}
            <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Key Stats
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Sites', value: `${TOTAL_SITES}` },
                  { label: 'Total Capacity', value: `${TOTAL_CAPACITY}+ MW` },
                  { label: 'States', value: 'MN, IA, WI' },
                  { label: 'Duration', value: '1:16' },
                  { label: 'Resolution', value: '1920x1080' },
                  { label: 'Frame Rate', value: '30 fps' },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenes */}
            <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Scenes
              </h3>
              <div className="space-y-2">
                {[
                  { time: '0:00', name: 'Logo Reveal' },
                  { time: '0:04', name: 'Problem Statement' },
                  { time: '0:09', name: 'Solution & Map Zoom' },
                  { time: '0:14', name: 'Regional Hub Map' },
                  { time: '0:30', name: 'Pilot Sites' },
                  { time: '0:42', name: 'Distributed Reliability' },
                  { time: '0:53', name: 'Value Props & Scaling' },
                  { time: '1:04', name: 'Closing CTA' },
                ].map((scene) => (
                  <div
                    key={scene.time}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-nodiac-secondary font-mono font-medium w-10">
                      {scene.time}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {scene.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Export & Render
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Render to MP4 via Remotion CLI:
                </p>
                <div className="bg-gray-100 dark:bg-black/30 rounded-lg p-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                  bunx remotion render UpperMidwestHub --codec h264
                </div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-3">
                  TTS Options
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">ElevenLabs</span>{' '}
                    &mdash; Best quality, $5/mo starter
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">OpenAI TTS</span>{' '}
                    &mdash; Good quality, pay-per-use via API
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Google Cloud TTS</span>{' '}
                    &mdash; Neural voices, $4/1M chars
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">macOS say</span>{' '}
                    &mdash; Free, local, lower quality
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Voiceover Transcript
                </h3>
              </div>
              {showTranscript ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showTranscript && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-white/10 pt-4">
                <div className="space-y-3">
                  {TRANSCRIPT_SEGMENTS.filter((s) => s.text).map((segment, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-nodiac-secondary font-mono text-sm w-16 flex-shrink-0">
                        {Math.floor(segment.start / 60)}:
                        {String(segment.start % 60).padStart(2, '0')}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
