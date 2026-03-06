'use client'

import Link from 'next/link'
import { ArrowRight, Map, FileSearch, ClipboardList, MessageSquare, BarChart3 } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoLink } from '@/components/LogoLink'

const pipeline = [
  {
    href: '/regional-hubs',
    icon: Map,
    title: 'Score',
    description: 'Analyze US counties for distributed data center potential using grid, fiber, and permitting data',
    color: 'from-nodiac-soft-orchid to-nodiac-primary',
    step: 1,
  },
  {
    href: '/screening',
    icon: FileSearch,
    title: 'Screen',
    description: 'Import IPP portfolios, score individual sites, and qualify top candidates for development',
    color: 'from-nodiac-primary to-nodiac-secondary',
    step: 2,
  },
  {
    href: '/tracker',
    icon: ClipboardList,
    title: 'Develop',
    description: 'Track sites through qualification, control, power, permitting, fiber, engineering, and construction',
    color: 'from-nodiac-secondary to-emerald-500',
    step: 3,
  },
]

const utilities = [
  {
    href: '/chat',
    icon: MessageSquare,
    title: 'Oracle Chat',
    description: 'Multi-perspective AI advisor for data center strategy',
  },
  {
    href: '/timeline',
    icon: BarChart3,
    title: 'Timelines',
    description: 'Create project timelines for presentations',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-gradient-to-br dark:from-[#0f0f1a] dark:via-[#16162a] dark:to-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
              Oracle
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Development pipeline for distributed AI compute infrastructure
            </p>
          </div>

          {/* Pipeline Flow */}
          <div className="mb-16">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center mb-6">
              Development Pipeline
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto relative">
              {/* Connecting arrows (visible on md+) */}
              <div className="hidden md:flex absolute top-1/2 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
              </div>
              <div className="hidden md:flex absolute top-1/2 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
              </div>

              {pipeline.map((stage) => {
                const Icon = stage.icon
                return (
                  <Link
                    key={stage.href}
                    href={stage.href}
                    className="group relative overflow-hidden rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 hover:border-nodiac-secondary/50 dark:hover:border-nodiac-secondary/30 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 duration-200"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stage.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity`} />

                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/10 text-[12px] font-bold text-zinc-400 dark:text-zinc-500">
                        {stage.step}
                      </span>
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stage.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1.5">
                      {stage.title}
                    </h2>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {stage.description}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Utilities */}
          <div className="max-w-3xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center mb-4">
              Utilities
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {utilities.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex items-center gap-3 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 py-3 hover:border-zinc-300 dark:hover:border-white/20 transition-all"
                  >
                    <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-nodiac-secondary transition-colors" />
                    <div>
                      <span className="text-[13px] font-medium text-zinc-900 dark:text-white">{tool.title}</span>
                      <span className="text-[12px] text-zinc-400 dark:text-zinc-500 ml-2">{tool.description}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
