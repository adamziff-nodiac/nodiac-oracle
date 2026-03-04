interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  sublabel?: string
}

export function MetricCard({ label, value, unit, sublabel }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-[32px] sm:text-[32px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
        {value}
        {unit && <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">{unit}</span>}
      </span>
      {sublabel && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</span>
      )}
    </div>
  )
}
