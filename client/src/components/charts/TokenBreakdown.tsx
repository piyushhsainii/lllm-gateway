'use client'

// components/charts/TokenBreakdown.tsx
import { PROVIDER_COLORS } from '../../lib/constants'
import type { ModelBreakdown } from '../../lib/types'

interface TokenBreakdownProps {
  data: ModelBreakdown[]
}

export function TokenBreakdown({ data }: TokenBreakdownProps) {
  const total = data.reduce((sum, m) => sum + m.spendUsd, 0)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const color = PROVIDER_COLORS[item.provider as keyof typeof PROVIDER_COLORS] || '#9c9890'
        return (
          <div key={item.model}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-xs text-[#1c1b18]">{item.model}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#9c9890]">
                  {item.requestCount.toLocaleString()} reqs
                </span>
                <span className="font-mono text-xs font-medium text-[#1c1b18]">
                  ${item.spendUsd.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-[#f4f3f0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#9c9890] mt-0.5">{item.percentage}% of spend</div>
          </div>
        )
      })}
    </div>
  )
}
