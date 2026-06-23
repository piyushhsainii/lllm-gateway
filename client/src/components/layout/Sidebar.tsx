'use client'

// components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '../../store/useAppStore'

const navItems = [
  {
    group: 'main',
    items: [
      {
        label: 'Overview',
        href: '/dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        label: 'Requests',
        href: '/requests',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polyline points="1,12 5,7 9,9 14,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'config',
    items: [
      {
        label: 'API Keys',
        href: '/keys',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 8h6M13 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: 'Billing',
        href: '/billing',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
]

const bottomItems = [
  {
    label: 'Docs',
    href: 'https://docs.llmgateway.io',
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/llmgateway',
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1C4.13 1 1 4.13 1 8c0 3.09 2.01 5.72 4.79 6.65.35.06.48-.15.48-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.62 1.07 1.63.76 2.03.58.06-.45.24-.76.44-.93-1.56-.18-3.2-.78-3.2-3.47 0-.77.27-1.4.72-1.89-.07-.18-.31-.9.07-1.87 0 0 .59-.19 1.93.72A6.7 6.7 0 018 4.72c.6 0 1.2.08 1.76.23 1.34-.91 1.93-.72 1.93-.72.38.97.14 1.69.07 1.87.45.49.72 1.12.72 1.89 0 2.7-1.64 3.29-3.2 3.47.25.22.47.65.47 1.31v1.94c0 .19.13.4.48.34A7.002 7.002 0 0015 8c0-3.87-3.13-7-7-7z" fill="currentColor"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        bg-[#fafaf9] border-r border-[#e4e2dd]
        transition-all duration-200
        ${sidebarCollapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[#e4e2dd] gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 bg-[#c94f1a] rounded flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="7" cy="7" r="2" fill="white"/>
          </svg>
        </div>
        {!sidebarCollapsed && (
          <span className="font-mono text-sm font-semibold text-[#1c1b18] tracking-tight">
            llm-gateway
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-2 pt-2 border-t border-[#e4e2dd]' : ''}>
            {group.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 mx-2 px-2 py-2 rounded-lg text-xs font-medium
                    transition-all duration-150 relative
                    ${active
                      ? 'bg-[#fdf1ec] text-[#c94f1a]'
                      : 'text-[#6b6860] hover:bg-[#f4f3f0] hover:text-[#1c1b18]'
                    }
                  `}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#c94f1a] rounded-r" />
                  )}
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="tracking-[-0.01em]">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="py-3 border-t border-[#e4e2dd]">
        {bottomItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 mx-2 px-2 py-2 rounded-lg text-xs font-medium text-[#9c9890] hover:text-[#6b6860] hover:bg-[#f4f3f0] transition-all duration-150"
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && (
              <span className="tracking-[-0.01em] flex items-center gap-1">
                {item.label}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="opacity-60">
                  <path d="M2 1h6v6M8 1L1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </span>
            )}
          </a>
        ))}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center gap-3 mx-2 px-2 py-2 rounded-lg text-xs font-medium text-[#9c9890] hover:text-[#6b6860] hover:bg-[#f4f3f0] transition-all duration-150 w-[calc(100%-16px)]"
        >
          <span className="flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {sidebarCollapsed ? (
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </span>
          {!sidebarCollapsed && <span className="tracking-[-0.01em]">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
