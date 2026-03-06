export default function HubsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-12 bg-zinc-200 dark:bg-[#1a1a2e] rounded-lg w-full" />
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-200 dark:bg-[#1a1a2e] rounded" />
        ))}
      </div>
    </div>
  )
}
