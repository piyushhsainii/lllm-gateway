import { useState } from 'react'
import { useRouter } from 'next/router'
import s from './Shell.module.css'
import { useApp } from '@/store/AppContext'
import { PROVIDER_COLORS } from '@/lib/constants'

const TITLES: Record<string, string> = {
  '/app/dashboard': 'Overview', '/app/requests': 'Requests',
  '/app/analytics': 'Analytics', '/app/keys': 'API Keys',
  '/app/settings': 'Settings', '/app/billing': 'Billing', '/onboarding': 'Get started',
}

export default function Topnav() {
  const { user, plan, providerHealth, sidebarCollapsed } = useApp()
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)
  const title = TITLES[router.pathname] || 'Dashboard'
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const providers = [
    { key: 'openai' as const, label: 'OpenAI' },
    { key: 'anthropic' as const, label: 'Anthropic' },
    { key: 'google' as const, label: 'Google' },
  ]

  return (
    <header className={`${s.topnav} ${sidebarCollapsed ? s.topnavCollapsed : s.topnavExpanded}`}>
      <span className={s.topnavTitle}>{title}</span>
      <div className={s.topnavRight}>
        <div className={s.providerDots}>
          {providers.map(({ key, label }) => {
            const h = providerHealth[key]
            const ok = h.status === 'healthy'
            return (
              <div key={key} style={{ position: 'relative' }}
                onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}>
                <div className={`${s.providerDot} ${!ok ? s.providerDotPulse : ''}`}
                  style={{ backgroundColor: ok ? PROVIDER_COLORS[key] : '#f59e0b' }} />
                {hovered === key && (
                  <div className={s.providerTooltip}>
                    <div className={s.providerTooltipArrow} />
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{label}</div>
                    <div style={{ color: '#9c9890' }}>{h.status} · {(h.errorRate * 100).toFixed(1)}% errors · {h.p99LatencyMs}ms P99</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className={s.divider} />
        <span className={s.planBadge}>{plan}</span>
        <div className={s.avatar}>{initials}</div>
      </div>
    </header>
  )
}
