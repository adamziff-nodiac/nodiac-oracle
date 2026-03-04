import type { TrackerActivity } from '@/lib/tracker/types'

interface ActivityLogProps {
  entries: TrackerActivity[]
}

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className="text-[13px] text-zinc-400 dark:text-zinc-600 italic py-4 text-center">
        No activity yet
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-[#22223a] last:border-0"
        >
          <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              {entry.title}
            </div>
            {entry.summary && (
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {entry.summary}
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {entry.source && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  {entry.source}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
