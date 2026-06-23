import Link from 'next/link'
import { useRouter } from 'next/router'
import s from './Shell.module.css'
import { useApp } from '@/store/AppContext'

const NAV = [
  { label: 'Overview', href: '/app/dashboard', icon: <GridIcon /> },
  { label: 'Requests', href: '/app/requests', icon: <ListIcon /> },
  { label: 'Analytics', href: '/app/analytics', icon: <ChartIcon /> },
]
const NAV2 = [
  { label: 'API Keys', href: '/app/keys', icon: <KeyIcon /> },
  { label: 'Settings', href: '/app/settings', icon: <GearIcon /> },
  { label: 'Billing', href: '/app/billing', icon: <CardIcon /> },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const router = useRouter()
  const active = (href: string) => router.pathname === href

  return (
    <aside className={`${s.sidebar} ${sidebarCollapsed ? s.sidebarCollapsed : s.sidebarExpanded}`}>
      <div className={s.logo}>
        <div className={s.logoIcon}><DiamondIcon /></div>
        {!sidebarCollapsed && <span className={s.logoText}>llm-gateway</span>}
      </div>

      <nav className={s.nav}>
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className={`${s.navItem} ${active(item.href) ? s.navItemActive : ''}`}>
            <span className={s.navIcon}>{item.icon}</span>
            {!sidebarCollapsed && <span className={s.navLabel}>{item.label}</span>}
          </Link>
        ))}
        <div className={s.navDivider} />
        {NAV2.map(item => (
          <Link key={item.href} href={item.href} className={`${s.navItem} ${active(item.href) ? s.navItemActive : ''}`}>
            <span className={s.navIcon}>{item.icon}</span>
            {!sidebarCollapsed && <span className={s.navLabel}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className={s.navBottom}>
        <a href="https://docs.llmgateway.io" target="_blank" rel="noopener noreferrer" className={s.navBottomItem}>
          <span className={s.navIcon}><DocIcon /></span>
          {!sidebarCollapsed && <span className={s.navLabel}>Docs ↗</span>}
        </a>
        <a href="https://github.com/llmgateway" target="_blank" rel="noopener noreferrer" className={s.navBottomItem}>
          <span className={s.navIcon}><GithubIcon /></span>
          {!sidebarCollapsed && <span className={s.navLabel}>GitHub ↗</span>}
        </a>
        <button className={s.navBottomItem} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <span className={s.navIcon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {sidebarCollapsed
                ? <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </span>
          {!sidebarCollapsed && <span className={s.navLabel}>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

function DiamondIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 7L7 13L1 7Z" stroke="white" strokeWidth="1.5" /><circle cx="7" cy="7" r="2" fill="white" /></svg>
}
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
}
function ListIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}
function ChartIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="1,12 5,7 9,9 14,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function KeyIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M9 8h6M13 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}
function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}
function CardIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" /></svg>
}
function DocIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3" /><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
}
function GithubIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C4.13 1 1 4.13 1 8c0 3.09 2.01 5.72 4.79 6.65.35.06.48-.15.48-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.62 1.07 1.63.76 2.03.58.06-.45.24-.76.44-.93-1.56-.18-3.2-.78-3.2-3.47 0-.77.27-1.4.72-1.89-.07-.18-.31-.9.07-1.87 0 0 .59-.19 1.93.72A6.7 6.7 0 018 4.72c.6 0 1.2.08 1.76.23 1.34-.91 1.93-.72 1.93-.72.38.97.14 1.69.07 1.87.45.49.72 1.12.72 1.89 0 2.7-1.64 3.29-3.2 3.47.25.22.47.65.47 1.31v1.94c0 .19.13.4.48.34A7.002 7.002 0 0015 8c0-3.87-3.13-7-7-7z" /></svg>
}
