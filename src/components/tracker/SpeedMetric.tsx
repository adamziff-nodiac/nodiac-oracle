import { cn } from '@/lib/utils'

interface SpeedMetricProps {
  label: string
  value: number | null
  isRunning: boolean
}

export function SpeedMetric({ label, value, isRunning }: SpeedMetricProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3">
      <span className={cn(
        'text-2xl font-bold tabular-nums',
        value === null
          ? 'text-zinc-400 dark:text-zinc-600'
          : isRunning
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-zinc-900 dark:text-zinc-100'
      )}>
        {value !== null ? (
          <span className="inline-flex items-center gap-1">
            {value}
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </span>
        ) : '--'}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">
        {label}
      </span>
    </div>
  )
}
