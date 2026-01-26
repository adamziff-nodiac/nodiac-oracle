'use client'

import Link from 'next/link'
import { MessageSquare, BarChart3, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/Navigation'

const features = [
  {
    href: '/chat',
    icon: MessageSquare,
    title: 'Oracle',
    description: 'Multi-perspective AI advisor for data centers and clean energy insights',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/timeline',
    icon: BarChart3,
    title: 'Timelines',
    description: 'Create and export professional project timelines for presentations',
    color: 'from-purple-500 to-pink-500',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nodiac-dark via-slate-900 to-nodiac-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-white font-semibold text-xl hidden sm:inline">Nodiac</span>
          </Link>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Nodiac Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              AI-powered insights and professional tools for data center and clean energy professionals
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    {feature.title}
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h2>

                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
