'use client'

// components/charts/LatencyChart.tsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface LatencyChartProps {
  p50: number
  p95: number
  p99: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4e2dd] rounded-lg px-3 py-2 shadow-lg">
        <p className="font-mono text-[10px] text-[#9c9890] mb-1">{label} latency</p>
        <p className="font-mono text-sm font-medium text-[#1c1b18]">
          {payload[0]?.value}ms
        </p>
      </div>
    )
  }
  return null
}

export function LatencyChart({ p50, p95, p99 }: LatencyChartProps) {
  const data = [
    { label: 'P50', value: p50 },
    { label: 'P95', value: p95 },
    { label: 'P99', value: p99 },
  ]

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#e4e2dd" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fill: '#9c9890' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fill: '#9c9890' }}
          tickFormatter={(v) => `${v}ms`}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#c94f1a" opacity={0.7} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
