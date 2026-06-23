// components/ui/Badge.tsx

interface BadgeProps {
  variant: 'ok' | 'cached' | 'fallback' | 'error' | 'rate-limited' | 'plan' | 'status-active' | 'status-revoked' | 'degraded' | 'healthy' | 'down'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center font-mono font-medium rounded'

  const variants: Record<string, string> = {
    'ok': 'bg-[#f0fdf4] text-[#16a34a] border border-[rgba(22,163,74,0.2)] text-[9.5px] px-1.5 py-0.5',
    'cached': 'bg-blue-50 text-blue-600 border border-blue-200 text-[9.5px] px-1.5 py-0.5',
    'fallback': 'bg-orange-50 text-orange-700 border border-orange-200 text-[9.5px] px-1.5 py-0.5',
    'error': 'bg-red-50 text-red-600 border border-red-200 text-[9.5px] px-1.5 py-0.5',
    'rate-limited': 'bg-red-50 text-red-600 border border-red-200 text-[9.5px] px-1.5 py-0.5',
    'plan': 'text-[#c94f1a] bg-[#fdf1ec] border border-[#f0cabb] text-[10px] px-2.5 py-0.5 uppercase tracking-[0.1em]',
    'status-active': 'bg-[#f0fdf4] text-[#16a34a] border border-[rgba(22,163,74,0.2)] text-[9.5px] px-1.5 py-0.5',
    'status-revoked': 'bg-[#f4f3f0] text-[#9c9890] border border-[#e4e2dd] text-[9.5px] px-1.5 py-0.5',
    'degraded': 'bg-amber-50 text-amber-700 border border-amber-200 text-[9.5px] px-1.5 py-0.5',
    'healthy': 'bg-[#f0fdf4] text-[#16a34a] border border-[rgba(22,163,74,0.2)] text-[9.5px] px-1.5 py-0.5',
    'down': 'bg-red-50 text-red-600 border border-red-200 text-[9.5px] px-1.5 py-0.5',
  }

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
