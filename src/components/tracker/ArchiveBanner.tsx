import { Archive } from 'lucide-react'

interface ArchiveBannerProps {
  archivedAt: string
  archivedReason: string | null
}

export function ArchiveBanner({ archivedAt, archivedReason }: ArchiveBannerProps) {
  const date = new Date(archivedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] text-zinc-600 dark:text-zinc-400">
      <Archive className="w-4 h-4 text-zinc-400 shrink-0" />
      <span>
        Archived on {date}
        {archivedReason && <> &mdash; {archivedReason}</>}
      </span>
    </div>
  )
}
