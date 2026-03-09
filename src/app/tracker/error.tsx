'use client'

export default function TrackerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Failed to load tracker data. This sometimes happens on first load.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-nodiac-primary hover:bg-nodiac-primary-dark rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
