export default function DepositsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-zinc-200 dark:bg-[#1a1a2e] rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-zinc-200 dark:bg-[#1a1a2e] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
