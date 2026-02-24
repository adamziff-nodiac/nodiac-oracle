'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Check } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

interface VoiceOption {
  id: string;
  label: string;
  voice: string;
  provider: string;
  description: string;
  file: string;
  characteristics: string[];
}

const voices: VoiceOption[] = [
  {
    id: 'onyx',
    label: 'Onyx',
    voice: 'onyx',
    provider: 'OpenAI tts-1-hd',
    description: 'Deep, authoritative male — documentary narrator quality',
    file: '/videos/voiceover-samples/1-openai-onyx-final.mp4',
    characteristics: ['Deep', 'Authoritative', 'Gravitas'],
  },
  {
    id: 'nova',
    label: 'Nova',
    voice: 'nova',
    provider: 'OpenAI tts-1-hd',
    description: 'Warm, professional female — polished corporate tone',
    file: '/videos/voiceover-samples/2-openai-nova-final.mp4',
    characteristics: ['Warm', 'Professional', 'Polished'],
  },
  {
    id: 'echo',
    label: 'Echo',
    voice: 'echo',
    provider: 'OpenAI tts-1-hd',
    description: 'Mid-range male — natural and conversational',
    file: '/videos/voiceover-samples/3-openai-echo-final.mp4',
    characteristics: ['Natural', 'Conversational', 'Clear'],
  },
  {
    id: 'alloy',
    label: 'Alloy',
    voice: 'alloy',
    provider: 'OpenAI tts-1-hd',
    description: 'Neutral, balanced — clean modern sound',
    file: '/videos/voiceover-samples/4-openai-alloy-final.mp4',
    characteristics: ['Neutral', 'Balanced', 'Modern'],
  },
  {
    id: 'samantha',
    label: 'Samantha',
    voice: 'Samantha',
    provider: 'macOS (free)',
    description: 'Built-in system voice — free baseline for comparison',
    file: '/videos/voiceover-samples/5-macos-samantha-final.mp4',
    characteristics: ['Free', 'Local', 'Baseline'],
  },
];

export default function CompareVoicesPage() {
  const [selected, setSelected] = useState(voices[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      setIsPlaying(false);
    }
  }, [selected]);

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
            Compare Voiceover Options
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            5 TTS versions of the Upper Midwest Hub video. Pick the voice that best fits the investor pitch.
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
                    <Volume2 className="w-4 h-4" />
                    <span className="font-medium text-white">{selected.label}</span>
                    <span className="text-gray-500">({selected.provider})</span>
                  </div>
                </div>
              </div>

              {/* Current voice details */}
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selected.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selected.provider}
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

            {/* Voice selector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Select Voice
              </h3>
              <div className="space-y-3">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelected(voice)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected.id === voice.id
                        ? 'bg-nodiac-primary/10 dark:bg-nodiac-primary/20 border-nodiac-primary/40'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {voice.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {voice.provider}
                        </span>
                        {selected.id === voice.id && (
                          <Check className="w-4 h-4 text-nodiac-secondary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {voice.description}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {voice.characteristics.map((c) => (
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
                  For investor-facing content, <strong>Onyx</strong> or{' '}
                  <strong>Nova</strong> typically perform best. Onyx brings
                  documentary-style gravitas; Nova brings warm professionalism.
                  For a more modern/tech feel, try <strong>Alloy</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
