'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, Film, Check, FileText } from 'lucide-react';
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
  script: string;
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
    script: `The AI industry needs 100 gigawatts of power. The grid can deliver a fraction of that.

Five-year interconnection queues. 98 billion dollars in delayed projects. The traditional path is broken.

Building a new data center takes five to seven years to energize. AI cannot wait that long.

Unless you go to where the power already is.

Across the Upper Midwest, hundreds of renewable energy sites sit with available capacity. Nodiac brings compute to the power.

42 sites across Minnesota, Iowa, and Wisconsin. Over 340 megawatts. Connected to existing grid infrastructure.

Pilot sites at Hay River and Walleye are already in development. Modular data centers on trailers. Energized in months.

50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028.

The fastest path to distributed AI compute in the Upper Midwest. Nodiac.`,
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
    script: `42 sites. 3 states. 348 megawatts. Every single one.

Let's visit every site in Nodiac's Upper Midwest Regional Hub. Each site collocated with existing renewable energy infrastructure. Existing grid connections. Pre-permitted land. Ready for compute.

Minnesota — 23 sites across the state, from Ridgewind to Rochester. Each site sits behind the meter at a Greenbacker generation facility.

Iowa — 4 high-capacity sites with major transmission access. Elk, Hawkeye, Rippey — each site 37 to 50 megawatts.

Wisconsin — 15 sites across cooperative territory. Pilot sites at Hay River and Walleye. First movers in a new model. Dunn Energy Cooperative partnership. Modular pods on trailers.

Every site adds capacity. Every site strengthens the network. 42 sites. 348 megawatts. The fastest path to distributed AI compute.

Nodiac. Distributed power infrastructure for AI compute.`,
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
    script: `AI needs power. There are two paths.

The traditional approach: build massive centralized data centers. Environmental reviews. State permits. Federal approvals. Three to five years before a single rack powers on.

The distributed approach: go to where the power already is. Existing sites. Pre-permitted land. Behind-the-meter deployment. Zero new permits required.

Construction: traditional means billions in concrete and steel. Years of work. Distributed means Armada compute pods on trailers. Deployed in weeks, not years.

Reliability: one centralized facility means one point of failure. A distributed network absorbs failures. Nodes go down, the network heals. 99.999 percent uptime. No backup generators needed.

Time to revenue: traditional takes five to seven years. Distributed: first revenue in months. 39 million by Q4 2026. 780 million plus by 2028.

The verdict is clear. 42 sites. 348 megawatts. Months to deploy. $780K per megawatt per year.

Distributed power infrastructure for AI compute. Nodiac.`,
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
    script: `It starts with two nodes. Hay River and Walleye. Then the network grows. Site by site. Node by node.

42 nodes across three states. A living network of distributed compute. 348 megawatts of capacity, pulsing through the Upper Midwest. Every node connected. Every node contributing.

99.999 percent uptime. Not through backup generators. Through the network itself. Nodes fail. The network heals. Distributed N-plus-1. Validated by 200,000 Monte Carlo simulations.

The network does not just survive. It grows. 50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028. Each new node strengthens the whole. 780 million dollars in annual revenue at scale.

Distributed power infrastructure for AI compute. Nodiac.`,
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
    script: `Nodiac. Distributed power infrastructure for AI compute.

AI's bottleneck is not chips. It is speed to power. 100 gigawatts of demand. 5-year queues. 98 billion in delayed projects.

Nodiac deploys compute where power already exists. Collocated with renewable energy sites. Energized in months, not years.

Upper Midwest Regional Hub: 42 sites across Minnesota, Iowa, and Wisconsin. 348 megawatts. Pilots at Hay River and Walleye in active development.

$780K revenue per megawatt per year. $700K EBITDA. Triple-net lease. 5 to 10 year contracts with Tier-1 hyperscaler counterparties.

50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028. 780 million dollars in annual recurring revenue.

Faster to market. Cleaner compute. Lower grid burden. Repeatable deployments. Built by the team behind Greenbacker — 3 billion in renewable assets under management.

The fastest path to distributed AI compute in the Upper Midwest.`,
  },
];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CompareStylesPage() {
  const [selected, setSelected] = useState(videos[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Update current time on playback
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDur);
    };
  }, [selected]);

  const handleSelect = (video: VideoOption) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    setSelected(video);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 0);
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * (videoRef.current.duration || 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

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
            Each video tells the Upper Midwest Regional Hub story differently &mdash; different structure, narrative, and visual approach. Subtitles are baked into each video; full script shown below.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video player + script */}
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
                <div className="p-4 bg-gray-900 space-y-3">
                  {/* Timeline */}
                  <div
                    ref={timelineRef}
                    className="group relative h-2 rounded-full bg-white/10 cursor-pointer"
                    onClick={handleTimelineClick}
                  >
                    {/* Progress */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-nodiac-secondary transition-[width] duration-100"
                      style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                    {/* Hover expand */}
                    <div className="absolute inset-0 -top-1 -bottom-1 rounded-full group-hover:bg-white/5" />
                    {/* Scrub handle */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-nodiac-secondary opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0' }}
                    />
                  </div>

                  {/* Button row */}
                  <div className="flex items-center gap-2">
                    {/* Restart */}
                    <button
                      onClick={restart}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Restart"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                    </button>

                    {/* Back 10s */}
                    <button
                      onClick={() => skip(-10)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Back 10s (J or ←)"
                    >
                      <SkipBack className="w-4 h-4 text-white" />
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                      title="Play/Pause (Space or K)"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>

                    {/* Forward 10s */}
                    <button
                      onClick={() => skip(10)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Forward 10s (L or →)"
                    >
                      <SkipForward className="w-4 h-4 text-white" />
                    </button>

                    {/* Mute */}
                    <button
                      onClick={toggleMute}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Mute (M)"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Time display */}
                    <span className="text-xs text-gray-400 font-mono ml-1">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    {/* Script toggle */}
                    <button
                      onClick={() => setShowScript(!showScript)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        showScript ? 'bg-nodiac-secondary/20 text-nodiac-secondary' : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Script
                    </button>

                    {/* Video label */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Film className="w-4 h-4" />
                      <span className="font-medium text-white">{selected.label}</span>
                    </div>
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

              {/* Script panel (always visible below, toggleable) */}
              {showScript && (
                <div className="mt-4 p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-nodiac-secondary" />
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Voiceover Script &mdash; {selected.label}
                    </h3>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {selected.script}
                  </div>
                </div>
              )}
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
