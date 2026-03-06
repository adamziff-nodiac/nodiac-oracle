'use client'

interface FunnelStage {
  label: string
  value: number
  color: string
}

interface FunnelChartProps {
  stages: FunnelStage[]
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.value / maxValue) * 100, 8)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-36 text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">{stage.label}</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="h-6 rounded-r-md transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color,
                  minWidth: '2rem',
                }}
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                {stage.value.toLocaleString()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
