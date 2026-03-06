'use client'

import Link from 'next/link'
import {
  Map,
  FileSearch,
  GitBranch,
  ClipboardList,
  MessageSquare,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoLink } from '@/components/LogoLink'

const pipeline = [
  {
    href: '/regional-hubs',
    icon: Map,
    title: 'Score',
    description: 'Rank counties by infrastructure fit',
    step: 1,
  },
  {
    href: '/screening',
    icon: FileSearch,
    title: 'Screen',
    description: 'Import and qualify partner sites',
    step: 2,
  },
  {
    href: '/pipeline',
    icon: GitBranch,
    title: 'Pipeline',
    description: 'Track deal flow across partners',
    step: 3,
  },
  {
    href: '/tracker',
    icon: ClipboardList,
    title: 'Develop',
    description: 'Manage sites through construction',
    step: 4,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-zinc-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <LogoLink />
          <div className="flex items-center gap-2 min-w-0">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero - minimal, left-aligned */}
          <div className="mb-20">
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              Oracle
            </h1>
            <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">
              Development pipeline for distributed AI compute
            </p>
          </div>

          {/* Pipeline - Connected horizontal flow (desktop) */}
          <div className="mb-24">
            {/* Desktop: horizontal pipeline with connecting track */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Continuous connecting line through all nodes */}
                <div className="absolute top-9 left-[12.5%] right-[12.5%] h-px bg-zinc-200 dark:bg-zinc-800" />

                <div className="grid grid-cols-4 gap-0">
                  {pipeline.map((stage, i) => {
                    const Icon = stage.icon
                    return (
                      <Link
                        key={stage.href}
                        href={stage.href}
                        className="group relative flex flex-col items-center text-center px-4"
                      >
                        {/* Node on the track */}
                        <div className="relative z-10 flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-2xl bg-white dark:bg-[#161625] border border-zinc-200 dark:border-zinc-800 group-hover:border-nodiac-secondary/50 dark:group-hover:border-nodiac-secondary/40 transition-all duration-200 group-hover:shadow-[0_0_0_4px_rgba(77,226,228,0.08)] dark:group-hover:shadow-[0_0_0_4px_rgba(77,226,228,0.06)]">
                          <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-nodiac-secondary transition-colors duration-200" />
                        </div>

                        {/* Label below node */}
                        <div className="mt-5">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                            Step {stage.step}
                          </span>
                          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5 tracking-tight">
                            {stage.title}
                          </h2>
                          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">
                            {stage.description}
                          </p>
                        </div>

                        {/* Small arrow between nodes */}
                        {i < pipeline.length - 1 && (
                          <div className="absolute top-9 right-0 translate-x-1/2 -translate-y-1/2 z-20">
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: vertical pipeline with connecting track */}
            <div className="md:hidden">
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute top-9 bottom-9 left-9 w-px bg-zinc-200 dark:bg-zinc-800" />

                <div className="flex flex-col gap-0">
                  {pipeline.map((stage) => {
                    const Icon = stage.icon
                    return (
                      <Link
                        key={stage.href}
                        href={stage.href}
                        className="group relative flex items-start gap-5 py-5 px-1"
                      >
                        {/* Node */}
                        <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-2xl bg-white dark:bg-[#161625] border border-zinc-200 dark:border-zinc-800 group-hover:border-nodiac-secondary/50 dark:group-hover:border-nodiac-secondary/40 transition-all duration-200">
                          <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-nodiac-secondary transition-colors duration-200" />
                        </div>

                        {/* Text */}
                        <div className="pt-2">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                            Step {stage.step}
                          </span>
                          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5 tracking-tight">
                            {stage.title}
                          </h2>
                          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                            {stage.description}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Utilities - minimal row at bottom */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <Link
              href="/chat"
              className="group flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors py-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Oracle Chat</span>
            </Link>
            <Link
              href="/timeline"
              className="group flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors py-2"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Timelines</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
