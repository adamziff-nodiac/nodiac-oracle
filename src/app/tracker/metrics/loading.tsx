export default function MetricsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-zinc-200 dark:bg-[#1a1a2e] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-zinc-200 dark:bg-[#1a1a2e] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
