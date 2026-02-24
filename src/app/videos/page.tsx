'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, ArrowLeft, Film, Download, FileText } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

interface VideoEntry {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'ready' | 'draft';
  thumbnail?: string;
}

const videos: VideoEntry[] = [
  {
    id: 'upper-midwest-hub',
    title: 'Upper Midwest Regional Hub',
    description:
      'Promo video showcasing the Upper Midwest Regional Hub — 42 sites across Minnesota, Iowa, and Wisconsin delivering 340+ MW of distributed AI compute capacity.',
    duration: '1:16',
    status: 'ready',
  },
];

export default function VideosPage() {
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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Promo Videos
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Marketing and investor-facing video assets for Nodiac regional hubs and site presentations.
            </p>
          </div>

          {/* Video grid */}
          <div className="grid gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-sm hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="relative w-full md:w-96 h-56 md:h-auto bg-gradient-to-br from-nodiac-primary/20 to-nodiac-secondary/20 flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    {/* Status badge */}
                    <div
                      className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        video.status === 'ready'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {video.status === 'ready' ? 'Ready' : 'Draft'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {video.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                      {video.description}
                    </p>
                    <div className="flex gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <Play className="w-3 h-3" /> Preview
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <Download className="w-3 h-3" /> Render MP4
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <FileText className="w-3 h-3" /> Transcript
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
