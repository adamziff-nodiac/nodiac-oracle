'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw, Film, Check } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

interface VideoOption {
  id: string;
  label: string;
  concept: string;
  description: string;
  file: string;
  duration: string;
  tags: string[];
  accent: string;
}

const videos: VideoOption[] = [
  {
    id: 'grid-is-full',
    label: 'The Grid is Full',
    concept: 'Cinematic Problem/Solution',
    description: 'Slow-burn tension: AI demand vs. power supply gap. Clock shatters, pivot to teal, US map zooms into Upper Midwest sites. Full narrative arc with scaling roadmap.',
    file: '/videos/grid-is-full.mp4',
    duration: '1:30',
    tags: ['Cinematic', '90 sec', 'Narrative Arc'],
    accent: '#4de2e4',
  },
  {
    id: 'site-flyover',
    label: '42 Sites in 42 Seconds',
    concept: 'Rapid Geographic Flyover',
    description: 'Relentless tour of every site. Camera pans across the regional map, visiting each of the 42 sites with a running counter. No fluff, all portfolio.',
    file: '/videos/site-flyover.mp4',
    duration: '1:00',
    tags: ['Fast-Paced', '60 sec', 'Geographic'],
    accent: '#6366f1',
  },
  {
    id: 'centralized-vs-distributed',
    label: 'Centralized vs. Distributed',
    concept: 'Split-Screen Comparison',
    description: 'Side-by-side debate: traditional (red, slow, fragile) vs. distributed (teal, fast, resilient). Permitting, construction, reliability, and time-to-revenue rounds. The traditional side crumbles.',
    file: '/videos/centralized-vs-distributed.mp4',
    duration: '1:15',
    tags: ['Comparison', '75 sec', 'Split-Screen'],
    accent: '#f43f5e',
  },
  {
    id: 'network-effect',
    label: 'The Network Effect',
    concept: 'Abstract Data Visualization',
    description: 'Purely visual. Network grows from 2 pilot nodes to 42, pulses with data flow, survives failures, then scales to 1 GW. No cards or chrome — just dots, lines, and gradients.',
    file: '/videos/network-effect.mp4',
    duration: '1:00',
    tags: ['Abstract', '60 sec', 'Data Viz'],
    accent: '#22d3ee',
  },
  {
    id: 'investor-brief',
    label: '60-Second Investor Brief',
    concept: 'Numbers-Only Pitch',
    description: 'Corporate-minimal kinetic typography on eggplant. Problem, thesis, portfolio, unit economics, scaling roadmap, CTA. Bloomberg meets Sequoia. Every frame is a slide.',
    file: '/videos/investor-brief.mp4',
    duration: '1:00',
    tags: ['Corporate', '60 sec', 'Investor-Ready'],
    accent: '#b48fc1',
  },
];

export default function CompareStylesPage() {
  const [selected, setSelected] = useState(videos[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSelect = (video: VideoOption) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setSelected(video);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

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
            href="/videos/upper-midwest-hub"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Video
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            5 Promo Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Each video tells the Upper Midwest Regional Hub story differently &mdash; different structure, narrative, and visual approach.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video player */}
            <div className="lg:col-span-2">
              <div className="rounded-xl overflow-hidden bg-black shadow-2xl border border-gray-200 dark:border-white/10">
                <video
                  ref={videoRef}
                  src={selected.file}
                  className="w-full aspect-video"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Controls */}
                <div className="flex items-center gap-3 p-4 bg-gray-900">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={restart}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Film className="w-4 h-4" />
                    <span className="font-medium text-white">{selected.label}</span>
                    <span className="text-gray-500">({selected.duration})</span>
                  </div>
                </div>
              </div>

              {/* Current video details */}
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: selected.accent }}
                  />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selected.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selected.concept}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selected.description}
                </p>
                <div className="flex gap-2 mt-3">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full bg-nodiac-secondary/10 text-nodiac-secondary font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Video selector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Select Video
              </h3>
              <div className="space-y-3">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelect(video)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected.id === video.id
                        ? 'bg-nodiac-primary/10 dark:bg-nodiac-primary/20 border-nodiac-primary/40'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: video.accent }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {video.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {video.duration}
                        </span>
                        {selected.id === video.id && (
                          <Check className="w-4 h-4 text-nodiac-secondary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {video.concept}
                    </p>
                    <div className="flex gap-1.5">
                      {video.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Usage guide */}
              <div className="mt-6 p-4 rounded-xl bg-nodiac-secondary/5 border border-nodiac-secondary/20">
                <h4 className="text-sm font-semibold text-nodiac-secondary mb-2">
                  When to Use Each
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">
                  <li><strong>Grid is Full</strong> &mdash; Full investor presentation with narrative arc</li>
                  <li><strong>42 Sites</strong> &mdash; Portfolio showcase, due diligence meetings</li>
                  <li><strong>Centralized vs. Distributed</strong> &mdash; When explaining the model to skeptics</li>
                  <li><strong>Network Effect</strong> &mdash; Social media, conference background, ambient</li>
                  <li><strong>Investor Brief</strong> &mdash; Cold outreach, deck supplement, quick pitch</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
