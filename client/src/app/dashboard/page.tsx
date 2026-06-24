"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Mock data shaped exactly like your API responses ────────────────────────

const OVERVIEW = {
    monthly_budget_usd: 200.0,
    current_spend_usd: 47.23,
    request_count: 8420,
    token_count: 2400000,
    cache_hit_rate: 0.124,
    fallback_rate: 0.031,
    gateway_latency_p50_ms: 9,
    gateway_latency_p99_ms: 31,
};

const PROVIDERS = [
    {
        name: "openai",
        label: "OpenAI",
        status: "healthy",
        error_rate_60s: 0.008,
        p99_latency_ms: 142,
        consecutive_failures: 0,
    },
    {
        name: "anthropic",
        label: "Anthropic",
        status: "healthy",
        error_rate_60s: 0.003,
        p99_latency_ms: 98,
        consecutive_failures: 0,
    },
    {
        name: "google",
        label: "Google",
        status: "degraded",
        error_rate_60s: 0.062,
        p99_latency_ms: 891,
        consecutive_failures: 3,
    },
];

const MODEL_BREAKDOWN = [
    { model: "gpt-4o", provider: "openai", request_count: 5894, spend_usd: 31.20, percentage: 70.0 },
    { model: "claude-sonnet-4-5", provider: "anthropic", request_count: 2020, spend_usd: 10.89, percentage: 24.0 },
    { model: "gemini-1.5-pro", provider: "google", request_count: 506, spend_usd: 5.14, percentage: 6.0 },
];

const RECENT_REQUESTS = [
    { id: "1", model: "gpt-4o", provider: "openai", tokens: 1842, cost: 0.0184, latency_ms: 142, status: 200, cached: false, ts: "2m ago" },
    { id: "2", model: "claude-sonnet-4-5", provider: "anthropic", tokens: 923, cost: 0.0092, latency_ms: 98, status: 200, cached: true, ts: "4m ago" },
    { id: "3", model: "gpt-4o", provider: "openai", tokens: 3201, cost: 0.0320, latency_ms: 891, status: 200, cached: false, ts: "7m ago" },
    { id: "4", model: "gpt-4o-mini", provider: "openai", tokens: 512, cost: 0.0008, latency_ms: 67, status: 429, cached: false, ts: "11m ago" },
    { id: "5", model: "gemini-1.5-pro", provider: "google", tokens: 2100, cost: 0.0, latency_ms: 0, status: 502, cached: false, ts: "15m ago" },
];

// Daily spend for the mini sparkline (last 14 days)
const DAILY_SPEND = [1.2, 1.8, 0.4, 2.1, 2.8, 1.9, 0.3, 2.4, 3.1, 2.7, 1.6, 3.4, 3.8, 4.1];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
    openai: "#2563eb",
    anthropic: "#7c3aed",
    google: "#16a34a",
};

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    healthy: { dot: "#16a34a", bg: "#f0fdf4", text: "#15803d", label: "Healthy" },
    degraded: { dot: "#d97706", bg: "#fffbeb", text: "#b45309", label: "Degraded" },
    down: { dot: "#dc2626", bg: "#fef2f2", text: "#b91c1c", label: "Down" },
};

function fmt(n: number, decimals = 2) {
    return n.toFixed(decimals);
}
function fmtK(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function fmtM(n: number) {
    return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : fmtK(n);
}

// ─── Sparkline (SVG, no deps) ─────────────────────────────────────────────────

function Sparkline({ data, color = "#c94f1a" }: { data: number[]; color?: string }) {
    const W = 120, H = 32, pad = 2;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = pad + (1 - (v - min) / range) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
    const areaD = `${pathD} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
            <defs>
                <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#sg-${color.replace("#", "")})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    trend,
    chart,
    accent = false,
    progress,
}: {
    label: string;
    value: string;
    sub?: string;
    trend?: { dir: "up" | "down" | "neutral"; text: string };
    chart?: React.ReactNode;
    accent?: boolean;
    progress?: { value: number; max: number };
}) {
    const pct = progress ? Math.min((progress.value / progress.max) * 100, 100) : null;
    const barColor = pct != null
        ? pct >= 95 ? "#dc2626" : pct >= 80 ? "#d97706" : "#c94f1a"
        : "#c94f1a";

    return (
        <div
            className="bg-white border rounded-xl p-5"
            style={{
                borderColor: accent ? "#c94f1a" : "#e4e2dd",
                boxShadow: accent
                    ? "0 0 0 1px #c94f1a, 0 1px 3px rgba(0,0,0,0.07)"
                    : "0 1px 3px rgba(0,0,0,0.07)",
            }}
        >
            <div className="flex items-start justify-between mb-2">
                <span
                    className="font-mono font-medium text-[#c94f1a] uppercase"
                    style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}
                >
                    {label}
                </span>
                {trend && (
                    <span
                        className="font-mono text-[11px]"
                        style={{
                            color: trend.dir === "up" ? "#16a34a" : trend.dir === "down" ? "#dc2626" : "#9c9890",
                        }}
                    >
                        {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : ""} {trend.text}
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <div
                        className="font-mono font-medium text-[#1c1b18]"
                        style={{ fontSize: "26px", letterSpacing: "-0.04em", lineHeight: 1 }}
                    >
                        {value}
                    </div>
                    {sub && (
                        <div className="text-[11px] text-[#9c9890] font-light mt-1">{sub}</div>
                    )}
                </div>
                {chart && <div style={{ marginBottom: "2px" }}>{chart}</div>}
            </div>

            {pct != null && (
                <div className="mt-3">
                    <div
                        className="rounded-full overflow-hidden"
                        style={{ height: "3px", background: "#f4f3f0" }}
                    >
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: barColor }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="font-mono text-[10px] text-[#9c9890]">
                            ${fmt(progress!.value)} spent
                        </span>
                        <span className="font-mono text-[10px] text-[#9c9890]">
                            ${fmt(progress!.max)} budget
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Provider health pill ─────────────────────────────────────────────────────

function ProviderBadge({ p }: { p: typeof PROVIDERS[0] }) {
    const s = STATUS_COLORS[p.status] ?? STATUS_COLORS.degraded;
    return (
        <div
            className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
            style={{ borderColor: "#e4e2dd", background: "#fafaf9" }}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="rounded-full flex-shrink-0"
                    style={{
                        width: "8px",
                        height: "8px",
                        background: s.dot,
                        animation: p.status !== "healthy" ? "pulse 2s infinite" : undefined,
                    }}
                />
                <span className="text-sm font-medium text-[#1c1b18]" style={{ letterSpacing: "-0.01em" }}>
                    {p.label}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#9c9890]">
                    {p.p99_latency_ms}ms P99
                </span>
                <span
                    className="font-mono text-[10px] font-medium rounded-md px-2 py-0.5"
                    style={{ background: s.bg, color: s.text }}
                >
                    {p.status === "degraded"
                        ? `${fmt(p.error_rate_60s * 100, 1)}% err`
                        : s.label}
                </span>
            </div>
        </div>
    );
}

// ─── Status badge (request log) ───────────────────────────────────────────────

function StatusBadge({ status, cached }: { status: number; cached: boolean }) {
    if (cached) {
        return (
            <span
                className="font-mono font-medium rounded px-1.5 py-0.5 border"
                style={{ fontSize: "9.5px", background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
            >
                CACHED
            </span>
        );
    }
    if (status === 200) {
        return (
            <span
                className="font-mono font-medium rounded px-1.5 py-0.5 border"
                style={{ fontSize: "9.5px", background: "#f0fdf4", color: "#16a34a", borderColor: "rgba(22,163,74,0.2)" }}
            >
                200
            </span>
        );
    }
    if (status === 429) {
        return (
            <span
                className="font-mono font-medium rounded px-1.5 py-0.5 border"
                style={{ fontSize: "9.5px", background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
            >
                429
            </span>
        );
    }
    return (
        <span
            className="font-mono font-medium rounded px-1.5 py-0.5 border"
            style={{ fontSize: "9.5px", background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}
        >
            {status}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
    const [period, setPeriod] = useState<"7d" | "30d">("30d");

    const degradedProviders = PROVIDERS.filter((p) => p.status !== "healthy");
    const spendPct = (OVERVIEW.current_spend_usd / OVERVIEW.monthly_budget_usd) * 100;

    return (
        <div className="pt-8 px-10 pb-16 max-w-5xl">

            {/* ── Degraded provider banner ── */}
            {degradedProviders.length > 0 && (
                <div
                    className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 border"
                    style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                        <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#d97706" strokeWidth="1.4" strokeLinejoin="round" />
                        <line x1="8" y1="6" x2="8" y2="9.5" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
                        <circle cx="8" cy="11.5" r="0.6" fill="#d97706" />
                    </svg>
                    <div>
                        <span className="text-sm font-medium text-amber-800" style={{ letterSpacing: "-0.01em" }}>
                            {degradedProviders.map((p) => p.label).join(", ")}{" "}
                            {degradedProviders.length === 1 ? "is" : "are"} degraded
                        </span>
                        <span className="text-sm text-amber-700 font-light">
                            {" "}— {fmt(degradedProviders[0].error_rate_60s * 100, 1)}% error rate over last 60s.
                            Requests are being routed to fallback providers.
                        </span>
                    </div>
                </div>
            )}

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Monthly spend"
                    value={`$${fmt(OVERVIEW.current_spend_usd)}`}
                    accent={spendPct >= 80}
                    progress={{ value: OVERVIEW.current_spend_usd, max: OVERVIEW.monthly_budget_usd }}
                />
                <StatCard
                    label="Requests"
                    value={fmtK(OVERVIEW.request_count)}
                    sub="this month"
                    trend={{ dir: "up", text: "+12%" }}
                    chart={<Sparkline data={DAILY_SPEND.map((v) => v * 150)} />}
                />
                <StatCard
                    label="Cache hit rate"
                    value={`${fmt(OVERVIEW.cache_hit_rate * 100, 1)}%`}
                    sub={`${fmtK(Math.round(OVERVIEW.request_count * OVERVIEW.cache_hit_rate))} saved calls`}
                    trend={{ dir: "up", text: "+2.1%" }}
                />
                <StatCard
                    label="Gateway P99"
                    value={`${OVERVIEW.gateway_latency_p99_ms}ms`}
                    sub={`${OVERVIEW.gateway_latency_p50_ms}ms P50`}
                    trend={{ dir: "neutral", text: "overhead only" }}
                />
            </div>

            {/* ── Spend chart + provider health ── */}
            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 280px" }}>

                {/* Spend over time */}
                <div
                    className="bg-white border border-[#e4e2dd] rounded-xl p-5"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span
                                className="font-mono font-medium text-[#c94f1a] uppercase block"
                                style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}
                            >
                                Spend over time
                            </span>
                            <span className="text-[11px] text-[#9c9890] font-light">Daily USD via gateway</span>
                        </div>
                        <div className="flex gap-1">
                            {(["7d", "30d"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className="font-mono rounded transition-all"
                                    style={{
                                        fontSize: "11px",
                                        padding: "3px 10px",
                                        background: period === p ? "#fdf1ec" : "none",
                                        color: period === p ? "#c94f1a" : "#9c9890",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Full-width SVG spend chart */}
                    <SpendChart data={period === "7d" ? DAILY_SPEND.slice(-7) : DAILY_SPEND} />
                </div>

                {/* Provider health */}
                <div
                    className="bg-white border border-[#e4e2dd] rounded-xl p-5"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                >
                    <span
                        className="font-mono font-medium text-[#c94f1a] uppercase block mb-4"
                        style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}
                    >
                        Provider health
                    </span>
                    <div className="flex flex-col gap-2">
                        {PROVIDERS.map((p) => (
                            <ProviderBadge key={p.name} p={p} />
                        ))}
                    </div>

                    <div
                        className="mt-4 pt-4 border-t border-[#e4e2dd] flex items-center justify-between"
                    >
                        <span className="text-[11px] text-[#9c9890] font-light">Fallback rate</span>
                        <span className="font-mono text-[11px] font-medium text-[#1c1b18]">
                            {fmt(OVERVIEW.fallback_rate * 100, 1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Model breakdown + recent requests ── */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "240px 1fr" }}>

                {/* Model breakdown */}
                <div
                    className="bg-white border border-[#e4e2dd] rounded-xl p-5"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                >
                    <span
                        className="font-mono font-medium text-[#c94f1a] uppercase block mb-4"
                        style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}
                    >
                        Models
                    </span>
                    <div className="flex flex-col gap-4">
                        {MODEL_BREAKDOWN.map((m) => {
                            const color = PROVIDER_COLORS[m.provider] ?? "#9c9890";
                            return (
                                <div key={m.model}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="rounded-full flex-shrink-0"
                                                style={{ width: "6px", height: "6px", background: color }}
                                            />
                                            <span
                                                className="font-mono text-[11px] text-[#1c1b18]"
                                                style={{ letterSpacing: "-0.01em" }}
                                            >
                                                {m.model}
                                            </span>
                                        </div>
                                        <span className="font-mono text-[11px] font-medium text-[#1c1b18]">
                                            ${fmt(m.spend_usd)}
                                        </span>
                                    </div>
                                    <div
                                        className="rounded-full overflow-hidden"
                                        style={{ height: "3px", background: "#f4f3f0" }}
                                    >
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${m.percentage}%`, background: color, opacity: 0.7 }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className="font-mono text-[10px] text-[#9c9890]">
                                            {fmtK(m.request_count)} reqs
                                        </span>
                                        <span className="font-mono text-[10px] text-[#9c9890]">
                                            {fmt(m.percentage, 0)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#e4e2dd]">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[11px] text-[#9c9890] font-light">Total tokens</span>
                            <span className="font-mono text-[12px] font-medium text-[#1c1b18]">
                                {fmtM(OVERVIEW.token_count)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent requests */}
                <div
                    className="bg-white border border-[#e4e2dd] rounded-xl overflow-hidden"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e2dd]">
                        <span
                            className="font-mono font-medium text-[#c94f1a] uppercase"
                            style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}
                        >
                            Recent requests
                        </span>
                        <Link
                            href="/dashboard/requests"
                            className="font-mono text-[11px] text-[#9c9890] hover:text-[#c94f1a] transition-colors"
                        >
                            View all →
                        </Link>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "#f4f3f0", borderBottom: "1px solid #e4e2dd" }}>
                                {["Time", "Model", "Tokens", "Cost", "Latency", "Status"].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left font-mono font-medium text-[#9c9890] uppercase whitespace-nowrap"
                                        style={{ fontSize: "9.5px", letterSpacing: "0.12em", padding: "8px 14px" }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_REQUESTS.map((r, i) => (
                                <tr
                                    key={r.id}
                                    className="transition-colors hover:bg-[#fafaf9]"
                                    style={{ borderBottom: i < RECENT_REQUESTS.length - 1 ? "1px solid #e4e2dd" : undefined }}
                                >
                                    <td className="px-3.5 py-3 font-mono text-[10px] text-[#9c9890]">{r.ts}</td>
                                    <td className="px-3.5 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="rounded-full flex-shrink-0"
                                                style={{
                                                    width: "5px", height: "5px",
                                                    background: PROVIDER_COLORS[r.provider] ?? "#9c9890",
                                                }}
                                            />
                                            <span className="font-mono text-[11px] text-[#1c1b18]">{r.model}</span>
                                        </div>
                                    </td>
                                    <td className="px-3.5 py-3 font-mono text-[11px] text-[#6b6860]">
                                        {r.tokens.toLocaleString()}
                                    </td>
                                    <td className="px-3.5 py-3 font-mono text-[11px] text-[#1c1b18]">
                                        {r.status === 200 || r.cached ? `$${fmt(r.cost, 4)}` : "—"}
                                    </td>
                                    <td className="px-3.5 py-3">
                                        <span
                                            className="font-mono text-[11px]"
                                            style={{
                                                color: r.latency_ms === 0 ? "#9c9890"
                                                    : r.latency_ms < 200 ? "#16a34a"
                                                        : r.latency_ms < 1000 ? "#d97706"
                                                            : "#dc2626",
                                            }}
                                        >
                                            {r.latency_ms === 0 ? "—" : `${r.latency_ms}ms`}
                                        </span>
                                    </td>
                                    <td className="px-3.5 py-3">
                                        <StatusBadge status={r.status} cached={r.cached} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}

// ─── Full-width spend chart ───────────────────────────────────────────────────

function SpendChart({ data }: { data: number[] }) {
    const W = 600, H = 140;
    const padL = 36, padR = 8, padT = 8, padB = 24;
    const iW = W - padL - padR;
    const iH = H - padT - padB;
    const max = Math.max(...data) || 1;

    const pts = data.map((v, i) => ({
        x: padL + (i / (data.length - 1)) * iW,
        y: padT + (1 - v / max) * iH,
        v,
    }));

    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${padT + iH} L${pts[0].x.toFixed(1)},${padT + iH} Z`;

    const yTicks = [0, 0.5, 1].map((f) => ({
        v: f * max,
        y: padT + (1 - f) * iH,
    }));

    // x-axis: show every ~4th label
    const xStep = Math.max(1, Math.floor(data.length / 5));

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto", display: "block" }}
        >
            <defs>
                <linearGradient id="spend-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c94f1a" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#c94f1a" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Y gridlines */}
            {yTicks.map((t) => (
                <g key={t.v}>
                    <line
                        x1={padL} x2={W - padR} y1={t.y} y2={t.y}
                        stroke="#e4e2dd" strokeDasharray="3 3" strokeWidth={0.8}
                    />
                    <text
                        x={padL - 5} y={t.y + 3.5}
                        textAnchor="end"
                        fill="#9c9890"
                        style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "9px" }}
                    >
                        ${t.v.toFixed(1)}
                    </text>
                </g>
            ))}

            {/* Area + line */}
            <path d={areaD} fill="url(#spend-area)" />
            <path d={pathD} fill="none" stroke="#c94f1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* X labels */}
            {pts.map((p, i) => {
                if (i % xStep !== 0 && i !== pts.length - 1) return null;
                const dayLabel = `D-${data.length - 1 - i}`;
                return (
                    <text
                        key={i}
                        x={p.x} y={H - 4}
                        textAnchor="middle"
                        fill="#9c9890"
                        style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "9px" }}
                    >
                        {i === pts.length - 1 ? "today" : dayLabel}
                    </text>
                );
            })}

            {/* Dots on first + last */}
            {[pts[0], pts[pts.length - 1]].map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c94f1a" stroke="white" strokeWidth="1.5" />
            ))}
        </svg>
    );
}