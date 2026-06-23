'use client'

// components/charts/RequestVolumeChart.tsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { DailySpend } from '../../lib/types'

interface RequestVolumeChartProps {
  data: DailySpend[]
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4e2dd] rounded-lg px-3 py-2 shadow-lg">
        <p className="font-mono text-[10px] text-[#9c9890] mb-1">{label}</p>
        <p className="font-mono text-sm font-medium text-[#1c1b18]">
          {payload[0]?.value?.toLocaleString()} requests
        </p>
      </div>
    )
  }
  return null
}

export function RequestVolumeChart({ data, height = 200 }: RequestVolumeChartProps) {
  const formatted = data.map(d => ({
    ...d,
    dateShort: d.date.slice(5),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="requestCount" fill="#c94f1a" opacity={0.6} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
