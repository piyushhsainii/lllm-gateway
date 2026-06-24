"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
    "/dashboard/api-keys": "API Keys",
    "/dashboard/analytics": "Analytics",
    "/dashboard/requests": "Requests",
    "/dashboard/settings": "Settings",
    "/dashboard/billing": "Billing",
};

export function DashboardBreadcrumb() {
    const pathname = usePathname();
    const label = LABELS[pathname] ?? "Overview";

    return (
        <div className="flex items-center gap-2 text-sm text-[#9c9890] font-light">
            <span>Dashboard</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span className="text-[#1c1b18]">{label}</span>
        </div>
    );
}