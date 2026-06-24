"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "../../../context/DashboardDataContext";
import type { Provider, DailyPoint } from "../../../context/DashboardDataContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<Provider, string> = {
    openai: "#2563eb",
    anthropic: "#7c3aed",
    google: "#16a34a",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(n: number) { return `$${n.toFixed(2)}`; }
function fmtNum(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function AreaChart({
    data,
    valueKey,
    color = "#c94f1a",
    height = 160,
    formatY = (v: number) => String(Math.round(v)),
}: {
    data: DailyPoint[];
    valueKey: keyof DailyPoint;
    color?: string;
    height?: number;
    formatY?: (v: number) => string;
}) {
    const [tooltip, setTooltip] = useState<{ i: number } | null>(null);
    const W = 700, H = height;
    const padL = 44, padR = 12, padT = 8, padB = 28;
    const iW = W - padL - padR, iH = H - padT - padB;
    const vals = data.map(d => d[valueKey] as number);
    const max = Math.max(...vals) || 1;
    const pts = vals.map((v, i) => ({
        x: padL + (i / Math.max(data.length - 1, 1)) * iW,
        y: padT + (1 - v / max) * iH,
        v, d: data[i],
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${padT + iH} L${pts[0].x.toFixed(1)},${padT + iH} Z`;
    const yTicks = [0, 0.5, 1].map(f => ({ v: f * max, y: padT + (1 - f) * iH }));
    const xStep = Math.max(1, Math.floor(data.length / 6));
    const gradId = `area-${color.replace("#", "")}`;

    return (
        <div style={{ position: "relative" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.14" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {yTicks.map(t => (
                    <g key={t.v}>
                        <line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke="#e4e2dd" strokeDasharray="3 3" strokeWidth={0.8} />
                        <text x={padL - 5} y={t.y + 3.5} textAnchor="end" fill="#9c9890"
                            style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px" }}>
                            {formatY(t.v)}
                        </text>
                    </g>
                ))}
                <path d={areaD} fill={`url(#${gradId})`} />
                <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                    i % xStep === 0 || i === pts.length - 1 ? (
                        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="#9c9890"
                            style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px" }}>
                            {i === pts.length - 1 ? "today" : p.d.date.slice(5)}
                        </text>
                    ) : null
                ))}
                {/* Hover zones */}
                {pts.map((p, i) => (
                    <rect key={i}
                        x={p.x - iW / data.length / 2} y={padT}
                        width={iW / data.length} height={iH}
                        fill="transparent"
                        onMouseEnter={() => setTooltip({ i })}
                        onMouseLeave={() => setTooltip(null)}
                    />
                ))}
                {tooltip !== null && (
                    <circle cx={pts[tooltip.i].x} cy={pts[tooltip.i].y} r="3.5"
                        fill={color} stroke="white" strokeWidth="1.5" />
                )}
            </svg>
            {tooltip !== null && (() => {
                const p = pts[tooltip.i];
                const pctX = (p.x / W) * 100;
                return (
                    <div style={{
                        position: "absolute", top: "8px",
                        left: pctX > 70 ? undefined : `calc(${pctX}% + 10px)`,
                        right: pctX > 70 ? `calc(${100 - pctX}% + 10px)` : undefined,
                        background: "white", border: "1px solid #e4e2dd", borderRadius: "8px",
                        padding: "8px 12px", fontFamily: "var(--font-mono,monospace)", fontSize: "11px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
                    }}>
                        <div style={{ color: "#9c9890", fontSize: "10px", marginBottom: "2px" }}>{p.d.date}</div>
                        <div style={{ color: "#1c1b18", fontWeight: 500 }}>{formatY(p.v)}</div>
                    </div>
                );
            })()}
        </div>
    );
}

function BarChart({
    data,
    valueKey,
    color = "#c94f1a",
    height = 140,
    formatY = (v: number) => String(Math.round(v)),
}: {
    data: DailyPoint[];
    valueKey: keyof DailyPoint;
    color?: string;
    height?: number;
    formatY?: (v: number) => string;
}) {
    const [hovered, setHovered] = useState<number | null>(null);
    const W = 700, H = height;
    const padL = 44, padR = 12, padT = 8, padB = 28;
    const iW = W - padL - padR, iH = H - padT - padB;
    const vals = data.map(d => d[valueKey] as number);
    const max = Math.max(...vals) || 1;
    const barW = (iW / data.length) * 0.55;
    const xStep = Math.max(1, Math.floor(data.length / 6));

    return (
        <div style={{ position: "relative" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
                {[0, 0.5, 1].map(f => {
                    const y = padT + (1 - f) * iH;
                    return (
                        <g key={f}>
                            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#e4e2dd" strokeDasharray="3 3" strokeWidth={0.8} />
                            <text x={padL - 5} y={y + 3.5} textAnchor="end" fill="#9c9890"
                                style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px" }}>
                                {formatY(f * max)}
                            </text>
                        </g>
                    );
                })}
                {data.map((d, i) => {
                    const v = d[valueKey] as number;
                    const x = padL + (i / data.length) * iW + (iW / data.length - barW) / 2;
                    const bh = (v / max) * iH;
                    const y = padT + iH - bh;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={bh}
                                fill={color} opacity={hovered === i ? 0.85 : 0.55} rx="2"
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: "default" }}
                            />
                            {(i % xStep === 0 || i === data.length - 1) && (
                                <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill="#9c9890"
                                    style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px" }}>
                                    {i === data.length - 1 ? "today" : d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            {hovered !== null && (() => {
                const d = data[hovered];
                const pctX = ((padL + (hovered / data.length) * iW + barW / 2) / W) * 100;
                return (
                    <div style={{
                        position: "absolute", top: "8px",
                        left: pctX > 70 ? undefined : `calc(${pctX}% + 10px)`,
                        right: pctX > 70 ? `calc(${100 - pctX}% + 10px)` : undefined,
                        background: "white", border: "1px solid #e4e2dd", borderRadius: "8px",
                        padding: "8px 12px", fontFamily: "var(--font-mono,monospace)", fontSize: "11px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
                    }}>
                        <div style={{ color: "#9c9890", fontSize: "10px", marginBottom: "2px" }}>{d.date}</div>
                        <div style={{ color: "#1c1b18", fontWeight: 500 }}>{formatY(d[valueKey] as number)}</div>
                    </div>
                );
            })()}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton({ h = 180 }: { h?: number }) {
    return (
        <div style={{
            background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", height: `${h}px`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)", overflow: "hidden", position: "relative"
        }}>
            <div style={{
                position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(244,243,240,0.6) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%"
            }} />
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Period = "7d" | "30d";

export default function AnalyticsPage() {
    const { data, state, refresh, lastFetched } = useDashboardData();
    const [period, setPeriod] = useState<Period>("30d");
    const [sortCol, setSortCol] = useState<"request_count" | "spend_usd" | "token_count" | "avg_latency_ms">("spend_usd");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const dailySlice = useMemo(() => {
        if (!data) return [];
        return period === "7d" ? data.daily.slice(-7) : data.daily;
    }, [data, period]);

    const sortedModels = useMemo(() => {
        if (!data) return [];
        return [...data.models].sort((a, b) =>
            sortDir === "desc" ? b[sortCol] - a[sortCol] : a[sortCol] - b[sortCol]
        );
    }, [data, sortCol, sortDir]);

    const handleSort = (col: typeof sortCol) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("desc"); }
    };

    const card = (children: React.ReactNode, opts?: { span?: number }) => (
        <div style={{
            background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            ...(opts?.span ? { gridColumn: `span ${opts.span}` } : {}),
        }}>
            {children}
        </div>
    );

    const sectionLabel = (text: string) => (
        <span style={{
            fontFamily: "var(--font-mono,monospace)", fontSize: "10.5px", fontWeight: 500,
            color: "#c94f1a", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: "16px"
        }}>
            {text}
        </span>
    );

    const SortIcon = ({ col }: { col: typeof sortCol }) => (
        <span style={{ marginLeft: "4px", opacity: sortCol === col ? 1 : 0.35, fontSize: "10px" }}>
            {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
        </span>
    );

    if (state === "loading") {
        return (
            <div style={{ padding: "32px 40px 64px", maxWidth: "1200px" }}>
                <div style={{ height: "28px", width: "120px", background: "#f4f3f0", borderRadius: "6px", marginBottom: "8px" }} />
                <div style={{ height: "14px", width: "200px", background: "#f4f3f0", borderRadius: "4px", marginBottom: "32px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
                    {[1, 2, 3, 4].map(i => <CardSkeleton key={i} h={100} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <CardSkeleton h={220} /><CardSkeleton h={220} />
                </div>
                <CardSkeleton h={200} />
            </div>
        );
    }

    if (state === "error" || !data) {
        return (
            <div style={{ padding: "32px 40px" }}>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                    <p style={{ color: "#dc2626", fontSize: "14px" }}>
                        Failed to load analytics.{" "}
                        <button onClick={refresh} style={{ color: "#c94f1a", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
                            Retry
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    const { summary, providers, keys } = data;

    return (
        <div style={{ padding: "32px 40px 64px", maxWidth: "1200px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
                <div>
                    <h1 className="font-semibold text-[#1c1b18]" style={{ fontSize: "22px", letterSpacing: "-0.04em", marginBottom: "4px" }}>
                        Analytics
                    </h1>
                    <p style={{ fontSize: "13px", color: "#9c9890", fontWeight: 300 }}>
                        Aggregated usage, spend, and performance across all keys.
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {lastFetched && (
                        <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>
                            Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    <button onClick={refresh} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        border: "1px solid #e4e2dd", color: "#6b6860", borderRadius: "8px",
                        padding: "6px 12px", fontSize: "12px", fontWeight: 300, background: "none", cursor: "pointer",
                    }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Refresh
                    </button>
                    {/* Period toggle */}
                    <div style={{ display: "flex", background: "#f4f3f0", borderRadius: "8px", padding: "3px", gap: "2px" }}>
                        {(["7d", "30d"] as Period[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} style={{
                                fontFamily: "var(--font-mono,monospace)", fontSize: "11px", padding: "4px 12px", borderRadius: "6px",
                                border: "none", cursor: "pointer", transition: "all 0.15s",
                                background: period === p ? "white" : "transparent",
                                color: period === p ? "#c94f1a" : "#9c9890",
                                boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                            }}>{p}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Row 1: KPI cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>
                {[
                    {
                        label: "Total spend",
                        value: fmtUsd(summary.total_spend_usd),
                        sub: `of ${fmtUsd(summary.budget_usd)} budget`,
                        progress: summary.total_spend_usd / summary.budget_usd,
                    },
                    {
                        label: "Total requests",
                        value: fmtNum(summary.total_requests),
                        sub: `${fmtNum(summary.total_tokens)} tokens`,
                    },
                    {
                        label: "Cache hit rate",
                        value: fmtPct(summary.cache_hit_rate),
                        sub: `${fmtNum(Math.round(summary.total_requests * summary.cache_hit_rate))} calls saved`,
                    },
                    {
                        label: "Fallback rate",
                        value: fmtPct(summary.fallback_rate),
                        sub: `${fmtNum(Math.round(summary.total_requests * summary.fallback_rate))} rerouted`,
                    },
                ].map(({ label, value, sub, progress }) => (
                    <div key={label} style={{ background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                        <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10.5px", fontWeight: 500, color: "#c94f1a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                            {label}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "24px", fontWeight: 500, color: "#1c1b18", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "4px" }}>
                            {value}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9c9890", fontWeight: 300 }}>{sub}</div>
                        {progress != null && (
                            <div style={{ marginTop: "10px", height: "3px", background: "#f4f3f0", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: "2px", background: progress >= 0.95 ? "#dc2626" : progress >= 0.80 ? "#d97706" : "#c94f1a", width: `${Math.min(progress * 100, 100)}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Row 2: Latency KPIs ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
                {[
                    { label: "P50 latency (gateway)", value: `${summary.p50_latency_ms}ms`, sub: "Median overhead added" },
                    { label: "P99 latency (gateway)", value: `${summary.p99_latency_ms}ms`, sub: "Worst-case overhead" },
                    { label: "Error rate", value: fmtPct(data.records.filter(r => r.status_code >= 400).length / data.records.length), sub: "4xx + 5xx responses" },
                ].map(({ label, value, sub }) => (
                    <div key={label} style={{ background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                        <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10.5px", fontWeight: 500, color: "#c94f1a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>{label}</div>
                        <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "24px", fontWeight: 500, color: "#1c1b18", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "4px" }}>{value}</div>
                        <div style={{ fontSize: "11px", color: "#9c9890", fontWeight: 300 }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Row 3: Spend chart + Request volume ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {card(
                    <>
                        {sectionLabel("Spend over time")}
                        <AreaChart data={dailySlice} valueKey="spend_usd" color="#c94f1a" height={160} formatY={v => `$${v.toFixed(1)}`} />
                    </>
                )}
                {card(
                    <>
                        {sectionLabel("Request volume")}
                        <BarChart data={dailySlice} valueKey="request_count" color="#2563eb" height={160} formatY={v => fmtNum(Math.round(v))} />
                    </>
                )}
            </div>

            {/* ── Row 4: Cache + Fallback sparklines ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {card(
                    <>
                        {sectionLabel("Cache hits / day")}
                        <BarChart data={dailySlice} valueKey="cache_hits" color="#16a34a" height={120} formatY={v => String(Math.round(v))} />
                    </>
                )}
                {card(
                    <>
                        {sectionLabel("Fallbacks / day")}
                        <BarChart data={dailySlice} valueKey="fallbacks" color="#d97706" height={120} formatY={v => String(Math.round(v))} />
                    </>
                )}
            </div>

            {/* ── Row 5: Model breakdown table ── */}
            <div style={{ background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", marginBottom: "16px" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e2dd" }}>
                    {sectionLabel("Model breakdown")}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f4f3f0", borderBottom: "1px solid #e4e2dd" }}>
                            {[
                                { label: "Model", col: null, sortable: false },
                                { label: "Requests", col: "request_count", sortable: true },
                                { label: "% of total", col: null, sortable: false },
                                { label: "Tokens", col: "token_count", sortable: true },
                                { label: "Spend", col: "spend_usd", sortable: true },
                                { label: "Avg latency", col: "avg_latency_ms", sortable: true },
                            ].map(({ label, col, sortable }) => (
                                <th key={label}
                                    onClick={() => sortable && col && handleSort(col as typeof sortCol)}
                                    style={{
                                        textAlign: "left", padding: "9px 16px",
                                        fontFamily: "var(--font-mono,monospace)", fontSize: "9.5px", fontWeight: 500,
                                        color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.12em",
                                        whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none",
                                    }}>
                                    {label}{sortable && col && <SortIcon col={col as typeof sortCol} />}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedModels.map((m, i) => {
                            const color = PROVIDER_COLORS[m.provider] ?? "#9c9890";
                            return (
                                <tr key={m.model}
                                    style={{ borderBottom: i < sortedModels.length - 1 ? "1px solid #e4e2dd" : undefined, background: i % 2 === 0 ? "white" : "#fafaf9" }}>
                                    <td style={{ padding: "11px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "12px", color: "#1c1b18" }}>{m.model}</span>
                                            <span style={{ fontSize: "10px", color: "#9c9890", fontWeight: 300, textTransform: "capitalize" }}>{m.provider}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono,monospace)", fontSize: "12px", color: "#1c1b18" }}>
                                        {m.request_count.toLocaleString()}
                                    </td>
                                    <td style={{ padding: "11px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ flex: 1, maxWidth: "80px", height: "4px", background: "#f4f3f0", borderRadius: "2px", overflow: "hidden" }}>
                                                <div style={{ height: "100%", background: color, opacity: 0.7, borderRadius: "2px", width: `${m.percentage}%` }} />
                                            </div>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#6b6860" }}>{m.percentage}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono,monospace)", fontSize: "12px", color: "#6b6860" }}>
                                        {fmtNum(m.token_count)}
                                    </td>
                                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono,monospace)", fontSize: "12px", fontWeight: 500, color: "#1c1b18" }}>
                                        {fmtUsd(m.spend_usd)}
                                    </td>
                                    <td style={{ padding: "11px 16px" }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono,monospace)", fontSize: "12px",
                                            color: m.avg_latency_ms < 300 ? "#16a34a" : m.avg_latency_ms < 1000 ? "#d97706" : "#dc2626"
                                        }}>
                                            {m.avg_latency_ms}ms
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Row 6: Key breakdown + Provider health ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                {/* Per-key spend */}
                {card(
                    <>
                        {sectionLabel("Spend by key")}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {keys.map(k => {
                                const pct = k.budget_usd > 0 ? Math.min((k.spend_usd / k.budget_usd) * 100, 100) : 0;
                                const barColor = pct >= 95 ? "#dc2626" : pct >= 80 ? "#d97706" : "#c94f1a";
                                return (
                                    <div key={k.key_id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 500, color: "#1c1b18", letterSpacing: "-0.01em" }}>{k.key_name}</span>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>
                                                    {k.request_count.toLocaleString()} reqs
                                                </span>
                                                <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "12px", fontWeight: 500, color: "#1c1b18" }}>
                                                    {fmtUsd(k.spend_usd)}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ height: "4px", background: "#f4f3f0", borderRadius: "2px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", borderRadius: "2px", background: barColor, width: `${pct}%`, transition: "width 0.4s ease" }} />
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>
                                                {fmtNum(k.token_count)} tokens
                                            </span>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>
                                                {fmtUsd(k.budget_usd)} budget
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Provider health */}
                {card(
                    <>
                        {sectionLabel("Provider health")}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                            {providers.map(p => {
                                const statusColors = {
                                    healthy: { dot: "#16a34a", bg: "#f0fdf4", text: "#15803d", label: "Healthy" },
                                    degraded: { dot: "#d97706", bg: "#fffbeb", text: "#b45309", label: "Degraded" },
                                    down: { dot: "#dc2626", bg: "#fef2f2", text: "#b91c1c", label: "Down" },
                                }[p.status];
                                return (
                                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafaf9", border: "1px solid #e4e2dd", borderRadius: "8px", padding: "10px 12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{
                                                width: "8px", height: "8px", borderRadius: "50%", background: statusColors.dot, flexShrink: 0,
                                                animation: p.status !== "healthy" ? "pulse 2s infinite" : undefined
                                            }} />
                                            <span style={{ fontSize: "13px", fontWeight: 500, color: "#1c1b18", letterSpacing: "-0.01em" }}>{p.label}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#9c9890" }}>
                                                {p.p99_latency_ms}ms P99
                                            </span>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", fontWeight: 500, borderRadius: "4px", padding: "2px 8px", background: statusColors.bg, color: statusColors.text }}>
                                                {p.status === "degraded"
                                                    ? `${(p.error_rate_60s * 100).toFixed(1)}% err`
                                                    : statusColors.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mini latency histogram */}
                        {sectionLabel("Latency distribution")}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {[
                                { label: "< 300ms", count: data.records.filter(r => r.latency_ms < 300).length, color: "#16a34a" },
                                { label: "300–1000ms", count: data.records.filter(r => r.latency_ms >= 300 && r.latency_ms < 1000).length, color: "#d97706" },
                                { label: "> 1000ms", count: data.records.filter(r => r.latency_ms >= 1000).length, color: "#dc2626" },
                            ].map(({ label, count, color }) => {
                                const pct = (count / data.records.length) * 100;
                                return (
                                    <div key={label}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#6b6860" }}>{label}</span>
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>
                                                {count.toLocaleString()} ({pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div style={{ height: "4px", background: "#f4f3f0", borderRadius: "2px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", background: color, borderRadius: "2px", width: `${pct}%`, opacity: 0.7 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}