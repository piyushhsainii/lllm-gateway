'use client'

// components/charts/SpendChart.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import type { DailySpend } from '../../lib/types'

interface SpendChartProps {
  data: DailySpend[]
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4e2dd] rounded-lg px-3 py-2 shadow-lg">
        <p className="font-mono text-[10px] text-[#9c9890] mb-1">{label}</p>
        <p className="font-mono text-sm font-medium text-[#1c1b18]">
          ${payload[0]?.value?.toFixed(2)}
        </p>
        {payload[1] && (
          <p className="font-mono text-[10px] text-[#6b6860]">
            {payload[1]?.value?.toLocaleString()} reqs
          </p>
        )}
      </div>
    )
  }
  return null
}

export function SpendChart({ data, height = 200 }: SpendChartProps) {
  const formatted = data.map(d => ({
    ...d,
    dateShort: d.date.slice(5), // MM-DD
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c94f1a" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#c94f1a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e4e2dd" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="dateShort"
          tick={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fill: '#9c9890' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fill: '#9c9890' }}
          tickFormatter={(v) => `$${v}`}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="spendUsd"
          stroke="#c94f1a"
          strokeWidth={1.5}
          fill="url(#spendGradient)"
          dot={false}
          activeDot={{ r: 3, fill: '#c94f1a', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
