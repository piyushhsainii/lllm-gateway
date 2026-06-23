'use client'

// components/layout/Topnav.tsx
import { usePathname } from 'next/navigation'
import { useAppStore } from '../../store/useAppStore'
import { PROVIDER_COLORS } from '../../lib/constants'
import { useState } from 'react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/requests': 'Requests',
  '/analytics': 'Analytics',
  '/keys': 'API Keys',
  '/settings': 'Settings',
  '/billing': 'Billing',
  '/onboarding': 'Get started',
}

export function Topnav() {
  const pathname = usePathname()
  const { user, plan, providerHealth, sidebarCollapsed } = useAppStore()
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)

  const title = PAGE_TITLES[pathname] || 'Dashboard'

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const providers = [
    { key: 'openai' as const, color: PROVIDER_COLORS.openai, label: 'OpenAI' },
    { key: 'anthropic' as const, color: PROVIDER_COLORS.anthropic, label: 'Anthropic' },
    { key: 'google' as const, color: PROVIDER_COLORS.google, label: 'Google' },
  ]

  return (
    <header className={`
      fixed top-0 right-0 z-20 h-14
      bg-[rgba(250,250,249,0.9)] backdrop-blur-md border-b border-[#e4e2dd]
      flex items-center justify-between px-6
      transition-all duration-200
      ${sidebarCollapsed ? 'left-14' : 'left-56'}
    `}>
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-light text-[#1c1b18] tracking-[-0.02em]">
          {title}
        </h1>
      </div>

      {/* Right: provider health + plan + avatar */}
      <div className="flex items-center gap-4">
        {/* Provider health dots */}
        <div className="flex items-center gap-2">
          {providers.map(({ key, color, label }) => {
            const health = providerHealth[key]
            const isDegraded = health?.status !== 'healthy'
            return (
              <div
                key={key}
                className="relative flex items-center"
                onMouseEnter={() => setHoveredProvider(key)}
                onMouseLeave={() => setHoveredProvider(null)}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isDegraded ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: isDegraded ? '#f59e0b' : color }}
                />
                {hoveredProvider === key && (
                  <div className="absolute top-5 right-0 bg-[#1c1b18] text-white rounded-lg px-3 py-2 text-[11px] font-mono whitespace-nowrap z-50 shadow-lg">
                    <div className="font-medium mb-0.5">{label}</div>
                    <div className="text-[#9c9890]">
                      {health?.status} · {(health?.errorRate * 100).toFixed(1)}% errors · {health?.p99LatencyMs}ms P99
                    </div>
                    <div className="absolute -top-1 right-2 w-2 h-2 bg-[#1c1b18] rotate-45" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="w-px h-4 bg-[#e4e2dd]" />

        {/* Plan badge */}
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-medium text-[#c94f1a] tracking-[0.1em] uppercase border border-[#f0cabb] rounded-full bg-[#fdf1ec] px-3.5 py-1">
          {plan}
        </span>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1c1b18] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-white text-[11px] font-mono font-medium">
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
