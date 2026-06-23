// components/ui/StatCard.tsx

interface StatCardProps {
  label: string
  value: string
  sub?: string
  progress?: {
    value: number
    max: number
    label?: string
  }
  trend?: {
    direction: 'up' | 'down'
    label: string
  }
}

export function StatCard({ label, value, sub, progress, trend }: StatCardProps) {
  const progressPct = progress ? Math.min((progress.value / (progress.max || 1)) * 100, 100) : 0
  const isAmber = progressPct >= 80 && progressPct < 95
  const isRed = progressPct >= 95
  const barColor = isRed ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-[#c94f1a]'

  return (
    <div className="bg-white border border-[#e4e2dd] rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10.5px] font-medium text-[#c94f1a] uppercase tracking-[0.12em] block">
          {label}
        </span>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-mono ${trend.direction === 'up' ? 'text-[#16a34a]' : 'text-red-500'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>
      <div className="font-mono font-medium text-2xl tracking-tight text-[#1c1b18] mb-1">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[#9c9890] font-light mt-0.5">{sub}</div>
      )}
      {progress && (
        <div className="mt-3">
          <div className="h-1 bg-[#f4f3f0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progress.label && (
            <div className="text-[10px] font-mono text-[#9c9890] mt-1">{progress.label}</div>
          )}
        </div>
      )}
    </div>
  )
}
