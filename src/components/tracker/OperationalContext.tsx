import type { SiteNotes } from '@/lib/tracker/types'

interface OperationalContextProps {
  notes: SiteNotes | null
}

export function OperationalContext({ notes }: OperationalContextProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Summary */}
      <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Summary
        </div>
        <div className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {notes?.summary || <span className="text-zinc-400 dark:text-zinc-600 italic">No summary</span>}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Next Steps
        </div>
        {notes?.next_steps?.length ? (
          <ul className="space-y-1">
            {notes.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{step}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">No next steps</span>
        )}
      </div>

      {/* Blockers */}
      <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Blockers
        </div>
        {notes?.blockers?.length ? (
          <ul className="space-y-1">
            {notes.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                <span className="text-[13px] text-red-600 dark:text-red-400">
                  {b.issue}
                  {b.contact && <span className="text-zinc-500"> ({b.contact})</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">No blockers</span>
        )}
      </div>

      {/* Waiting On */}
      <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Waiting On
        </div>
        {notes?.waiting_on?.length ? (
          <ul className="space-y-1">
            {notes.waiting_on.map((w, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span className="text-[13px] text-amber-600 dark:text-amber-400">
                  {w.who}: {w.what}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">Not waiting on anything</span>
        )}
      </div>
    </div>
  )
}
