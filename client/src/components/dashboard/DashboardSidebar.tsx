"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_MAIN = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Requests",
    href: "/dashboard/requests",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <polyline
          points="1,12 5,7 9,9 14,3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const NAV_CONFIG = [
  {
    label: "API Keys",
    href: "/dashboard/api-keys",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8h6M13 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(href: string, pathname: string): boolean {
  // Exact match for /dashboard (overview), prefix match for everything else
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item.href, pathname);

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative"
      style={{
        color: active ? "#c94f1a" : "#6b6860",
        background: active ? "#fdf1ec" : "transparent",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#f4f3f0";
          e.currentTarget.style.color = "#1c1b18";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b6860";
        }
      }}
    >
      {/* Active left bar */}
      {active && (
        <span
          className="absolute rounded-r-full"
          style={{
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "2px",
            height: "20px",
            background: "#c94f1a",
          }}
        />
      )}

      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 flex flex-col bg-[#fafaf9] border-r border-[#e4e2dd] z-30"
      style={{ width: "224px", height: "100vh" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 flex-shrink-0 border-b border-[#e4e2dd]"
        style={{ height: "56px", padding: "0 16px" }}
      >
        <img src="/llmgateway-logo-nobg.png" className='h-20 ' alt="" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "12px 8px" }}>
        <div className="flex flex-col gap-0.5">
          {NAV_MAIN.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="my-3" style={{ height: "1px", background: "#e4e2dd" }} />

        <div className="flex flex-col gap-0.5">
          {NAV_CONFIG.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      {/* User area */}
      <div className="flex-shrink-0 border-t border-[#e4e2dd]" style={{ padding: "12px 8px" }}>
        <div
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer transition-colors hover:bg-[#f4f3f0]"
        >
          <div
            className="flex items-center justify-center rounded-full bg-[#1c1b18] flex-shrink-0"
            style={{ width: "28px", height: "28px" }}
          >
            <span className="font-mono font-medium text-white" style={{ fontSize: "10px" }}>
              AS
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-medium text-[#1c1b18] truncate"
              style={{ fontSize: "12px", letterSpacing: "-0.01em" }}
            >
              Aryan Sharma
            </div>
            <div className="font-mono text-[#9c9890] truncate" style={{ fontSize: "10px" }}>
              Pro plan
            </div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className="flex-shrink-0 text-[#9c9890]"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </aside>
  );
}