export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-3 w-[120px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[60px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[70px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-3 w-[40px] rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
