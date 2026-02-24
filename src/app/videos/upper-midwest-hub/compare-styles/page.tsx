'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Check, Palette } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

interface StyleOption {
  id: string;
  label: string;
  style: string;
  description: string;
  file: string;
  duration: string;
  characteristics: string[];
  accent: string;
}

const styles: StyleOption[] = [
  {
    id: 'dark-tech',
    label: 'Dark Tech',
    style: 'Data-Driven',
    description: 'Dark background, neon teal accents. Technical, metric-heavy narration that lets the numbers build the case.',
    file: '/videos/umw-dark-tech.mp4',
    duration: '1:16',
    characteristics: ['Technical', 'Neon Accents', 'Standard Pacing'],
    accent: '#4de2e4',
  },
  {
    id: 'eggplant-cinematic',
    label: 'Eggplant Cinematic',
    style: 'Cinematic Narrative',
    description: 'Deep purple gradients, orchid accents. Dramatic storytelling arc with tension, vision, and resolution.',
    file: '/videos/umw-eggplant-cinematic.mp4',
    duration: '1:24',
    characteristics: ['Dramatic', 'Brand Purple', 'Cinematic Pacing'],
    accent: '#b48fc1',
  },
  {
    id: 'clean-white',
    label: 'Clean White',
    style: 'Corporate Brief',
    description: 'Light backgrounds, minimal design. Concise, boardroom-ready investor summary.',
    file: '/videos/umw-clean-white.mp4',
    duration: '1:16',
    characteristics: ['Professional', 'Minimal', 'Standard Pacing'],
    accent: '#490f42',
  },
  {
    id: 'bold-stats',
    label: 'Bold Stats',
    style: 'Stats-Forward',
    description: 'Black background, giant green numbers. Maximum impact per word — punchy stats that land hard.',
    file: '/videos/umw-bold-stats.mp4',
    duration: '1:05',
    characteristics: ['Punchy', 'Large Numbers', 'Fast Pacing'],
    accent: '#00ff88',
  },
  {
    id: 'teal-network',
    label: 'Teal Network',
    style: 'Network Architecture',
    description: 'Deep teal palette, network-graph aesthetic. Distributed infrastructure story emphasizing interconnected resilience.',
    file: '/videos/umw-teal-network.mp4',
    duration: '1:16',
    characteristics: ['Network', 'Interconnected', 'Standard Pacing'],
    accent: '#5eead4',
  },
];

export default function CompareStylesPage() {
  const [selected, setSelected] = useState(styles[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSelect = (style: StyleOption) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setSelected(style);
    // Wait for state update then load new source
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
            Compare Video Styles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            5 visual themes, each with a distinct script tailored to the style. Pick the one that best fits the investor pitch.
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
                    <Palette className="w-4 h-4" />
                    <span className="font-medium text-white">{selected.label}</span>
                    <span className="text-gray-500">({selected.duration})</span>
                  </div>
                </div>
              </div>

              {/* Current style details */}
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
                    {selected.style}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selected.description}
                </p>
                <div className="flex gap-2 mt-3">
                  {selected.characteristics.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2.5 py-1 rounded-full bg-nodiac-secondary/10 text-nodiac-secondary font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Style selector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Select Style
              </h3>
              <div className="space-y-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSelect(style)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected.id === style.id
                        ? 'bg-nodiac-primary/10 dark:bg-nodiac-primary/20 border-nodiac-primary/40'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: style.accent }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {style.duration}
                        </span>
                        {selected.id === style.id && (
                          <Check className="w-4 h-4 text-nodiac-secondary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {style.style}
                    </p>
                    <div className="flex gap-1.5">
                      {style.characteristics.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Recommendation */}
              <div className="mt-6 p-4 rounded-xl bg-nodiac-secondary/5 border border-nodiac-secondary/20">
                <h4 className="text-sm font-semibold text-nodiac-secondary mb-2">
                  Recommendation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  For investor-facing presentations, <strong>Eggplant Cinematic</strong> brings
                  the most gravitas with its dramatic pacing and brand-native purple palette.
                  For a data-forward pitch, <strong>Bold Stats</strong> delivers maximum impact.
                  For a clean boardroom setting, <strong>Clean White</strong> is the safest bet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
