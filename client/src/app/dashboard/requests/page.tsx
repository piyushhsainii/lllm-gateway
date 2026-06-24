"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "../../../context/DashboardDataContext";
import type { UsageRecord, Provider } from "../../../context/DashboardDataContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<Provider, string> = {
    openai: "#2563eb",
    anthropic: "#7c3aed",
    google: "#16a34a",
};

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtCost(n: number) {
    if (n === 0) return "—";
    if (n < 0.001) return `$${n.toFixed(6)}`;
    return `$${n.toFixed(4)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ record }: { record: UsageRecord }) {
    if (record.cached) return (
        <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "var(--font-mono,monospace)", fontWeight: 500, borderRadius: "4px", padding: "2px 6px", fontSize: "9.5px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
            CACHED
        </span>
    );
    if (record.fallback_used) return (
        <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "var(--font-mono,monospace)", fontWeight: 500, borderRadius: "4px", padding: "2px 6px", fontSize: "9.5px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
            FALLBACK
        </span>
    );
    const map: Record<number, [string, string, string]> = {
        200: ["#f0fdf4", "#16a34a", "rgba(22,163,74,0.2)"],
        429: ["#fffbeb", "#b45309", "#fde68a"],
        402: ["#fef2f2", "#dc2626", "#fecaca"],
        502: ["#fef2f2", "#dc2626", "#fecaca"],
    };
    const [bg, color, border] = map[record.status_code] ?? ["#f4f3f0", "#9c9890", "#e4e2dd"];
    return (
        <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "var(--font-mono,monospace)", fontWeight: 500, borderRadius: "4px", padding: "2px 6px", fontSize: "9.5px", background: bg, color, border: `1px solid ${border}` }}>
            {record.status_code}
        </span>
    );
}

function LatencyCell({ ms, cached }: { ms: number; cached: boolean }) {
    if (cached) return <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#2563eb" }}>{ms}ms</span>;
    const color = ms < 300 ? "#16a34a" : ms < 1000 ? "#d97706" : "#dc2626";
    return <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color }}>{ms}ms</span>;
}

function SlideOver({ record, onClose }: { record: UsageRecord; onClose: () => void }) {
    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40, backdropFilter: "blur(2px)" }}
            />
            <div
                style={{ position: "fixed", right: 0, top: 0, height: "100vh", width: "400px", background: "white", borderLeft: "1px solid #e4e2dd", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)", animation: "slideIn 0.18s ease-out" }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e4e2dd", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                        Request detail
                    </span>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c9890", padding: "4px", borderRadius: "6px" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                    {/* Status + ID */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <StatusBadge record={record} />
                        <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890" }}>{record.id}</span>
                    </div>

                    {/* Meta grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                        {[
                            ["Timestamp", fmtDate(record.created_at)],
                            ["Key", record.key_name],
                            ["Model", record.model],
                            ["Provider", record.provider],
                        ].map(([label, value]) => (
                            <div key={label} style={{ background: "#fafaf9", borderRadius: "8px", padding: "10px 12px" }}>
                                <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px", color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>{label}</div>
                                <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#1c1b18", wordBreak: "break-all" }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tokens */}
                    <div style={{ background: "#fafaf9", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                        <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px", color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Tokens</div>
                        {[
                            ["Prompt", record.prompt_tokens.toLocaleString()],
                            ["Completion", record.completion_tokens.toLocaleString()],
                            ["Total", (record.prompt_tokens + record.completion_tokens).toLocaleString()],
                        ].map(([label, value], i, arr) => (
                            <div key={label}>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                                    <span style={{ fontSize: "12px", color: i === arr.length - 1 ? "#1c1b18" : "#6b6860", fontWeight: i === arr.length - 1 ? 500 : 300 }}>{label}</span>
                                    <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "12px", color: "#1c1b18", fontWeight: i === arr.length - 1 ? 500 : 400 }}>{value}</span>
                                </div>
                                {i < arr.length - 1 && <div style={{ height: "1px", background: "#e4e2dd", margin: "2px 0" }} />}
                            </div>
                        ))}
                    </div>

                    {/* Performance */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ background: "#fafaf9", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px", color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Latency</div>
                            <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "20px", fontWeight: 500, color: record.latency_ms < 300 ? "#16a34a" : record.latency_ms < 1000 ? "#d97706" : "#dc2626" }}>
                                {record.latency_ms}ms
                            </div>
                        </div>
                        <div style={{ background: "#fafaf9", borderRadius: "8px", padding: "10px 12px" }}>
                            <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px", color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Cost</div>
                            <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "20px", fontWeight: 500, color: "#1c1b18" }}>
                                {fmtCost(record.cost_usd)}
                            </div>
                        </div>
                    </div>

                    {/* Fallback info */}
                    {record.fallback_used && (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
                            <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "9px", color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Fallback used</div>
                            <div style={{ fontSize: "12px", color: "#92400e", fontWeight: 300 }}>
                                {record.fallback_from} was unavailable. Routed to {record.provider}.
                            </div>
                        </div>
                    )}

                    {/* Privacy note */}
                    <div style={{ background: "#f4f3f0", borderRadius: "8px", padding: "10px 14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px", color: "#9c9890" }}>
                            <path d="M7 1L12.5 3.5v4C12.5 10.5 9.5 13 7 13 4.5 13 1.5 10.5 1.5 7.5v-4L7 1Z" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        <p style={{ fontSize: "10px", color: "#9c9890", fontStyle: "italic", lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                            Prompt content is never logged. Only metadata is stored.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div style={{ background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ background: "#f4f3f0", padding: "10px 16px", borderBottom: "1px solid #e4e2dd", display: "flex", gap: "24px" }}>
                {["w-16", "w-24", "w-20", "w-16", "w-12", "w-14", "w-12", "w-16"].map((w, i) => (
                    <div key={i} style={{ height: "10px", borderRadius: "4px", background: "#e4e2dd", width: w === "w-16" ? "64px" : w === "w-24" ? "96px" : w === "w-20" ? "80px" : w === "w-12" ? "48px" : "56px" }} />
                ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: i < 7 ? "1px solid #e4e2dd" : undefined, display: "flex", gap: "24px", alignItems: "center" }}>
                    {[80, 120, 100, 80, 60, 64, 48, 60].map((w, j) => (
                        <div key={j} style={{ height: "10px", borderRadius: "4px", background: i % 2 === 0 ? "#f4f3f0" : "#fafaf9", width: `${w}px`, opacity: 0.6 + Math.random() * 0.4 }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RequestsPage() {
    const { data, state } = useDashboardData();

    // Filters
    const [search, setSearch] = useState("");
    const [modelF, setModelF] = useState("all");
    const [statusF, setStatusF] = useState("all");
    const [providerF, setProviderF] = useState("all");
    const [keyF, setKeyF] = useState("all");
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<UsageRecord | null>(null);
    const [sortCol, setSortCol] = useState<"created_at" | "cost_usd" | "latency_ms" | "tokens">("created_at");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const models = useMemo(() => data ? [...new Set(data.records.map(r => r.model))].sort() : [], [data]);
    const keyNames = useMemo(() => data ? [...new Set(data.records.map(r => r.key_name))].sort() : [], [data]);

    const filtered = useMemo(() => {
        if (!data) return [];
        let rows = data.records;
        if (search) rows = rows.filter(r => r.model.includes(search) || r.key_name.toLowerCase().includes(search.toLowerCase()) || r.provider.includes(search));
        if (modelF !== "all") rows = rows.filter(r => r.model === modelF);
        if (providerF !== "all") rows = rows.filter(r => r.provider === providerF);
        if (keyF !== "all") rows = rows.filter(r => r.key_name === keyF);
        if (statusF === "200") rows = rows.filter(r => r.status_code === 200 && !r.cached && !r.fallback_used);
        else if (statusF === "cached") rows = rows.filter(r => r.cached);
        else if (statusF === "fallback") rows = rows.filter(r => r.fallback_used);
        else if (statusF === "error") rows = rows.filter(r => r.status_code >= 400);
        else if (statusF === "429") rows = rows.filter(r => r.status_code === 429);
        else if (statusF === "402") rows = rows.filter(r => r.status_code === 402);

        rows = [...rows].sort((a, b) => {
            let av: number, bv: number;
            if (sortCol === "created_at") { av = new Date(a.created_at).getTime(); bv = new Date(b.created_at).getTime(); }
            else if (sortCol === "tokens") { av = a.prompt_tokens + a.completion_tokens; bv = b.prompt_tokens + b.completion_tokens; }
            else { av = a[sortCol] as number; bv = b[sortCol] as number; }
            return sortDir === "desc" ? bv - av : av - bv;
        });
        return rows;
    }, [data, search, modelF, statusF, providerF, keyF, sortCol, sortDir]);

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleSort = (col: typeof sortCol) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("desc"); }
    };

    const resetFilters = () => { setSearch(""); setModelF("all"); setStatusF("all"); setProviderF("all"); setKeyF("all"); setPage(0); };
    const hasFilters = search || modelF !== "all" || statusF !== "all" || providerF !== "all" || keyF !== "all";

    const inputStyle: React.CSSProperties = {
        border: "1px solid #e4e2dd", borderRadius: "8px", padding: "7px 11px",
        fontSize: "13px", fontWeight: 300, fontFamily: "inherit", background: "white",
        color: "#1c1b18", outline: "none", transition: "border-color 0.15s",
    };
    const selectStyle: React.CSSProperties = {
        ...inputStyle, fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#6b6860", cursor: "pointer",
    };
    const SortIcon = ({ col }: { col: typeof sortCol }) => (
        <span style={{ marginLeft: "4px", opacity: sortCol === col ? 1 : 0.35, fontSize: "10px" }}>
            {sortCol === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
        </span>
    );

    return (
        <div style={{ padding: "32px 40px 64px", maxWidth: "1200px" }}>

            {/* Page header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 className="font-semibold text-[#1c1b18]" style={{ fontSize: "22px", letterSpacing: "-0.04em", marginBottom: "4px" }}>
                    Requests
                </h1>
                <p style={{ fontSize: "13px", color: "#9c9890", fontWeight: 300 }}>
                    {state === "success" && data
                        ? `${data.records.length.toLocaleString()} requests in the last 30 days`
                        : "Loading request log…"}
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {/* Search */}
                <div style={{ position: "relative", flex: "1", minWidth: "180px", maxWidth: "260px" }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
                        style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9c9890", pointerEvents: "none" }}>
                        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
                        <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <input
                        style={{ ...inputStyle, paddingLeft: "30px", width: "100%" }}
                        placeholder="Search model, key, provider…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        onFocus={e => e.target.style.borderColor = "#c94f1a"}
                        onBlur={e => e.target.style.borderColor = "#e4e2dd"}
                    />
                </div>

                {/* Dropdowns */}
                {[
                    { val: modelF, set: setModelF, opts: [["all", "All models"], ...models.map(m => [m, m])] },
                    { val: providerF, set: setProviderF, opts: [["all", "All providers"], ["openai", "OpenAI"], ["anthropic", "Anthropic"], ["google", "Google"]] },
                    { val: statusF, set: setStatusF, opts: [["all", "All statuses"], ["200", "200 OK"], ["cached", "Cached"], ["fallback", "Fallback"], ["429", "429 Rate limited"], ["402", "402 Budget"], ["error", "Errors"]] },
                    { val: keyF, set: setKeyF, opts: [["all", "All keys"], ...keyNames.map(k => [k, k])] },
                ].map(({ val, set, opts }, i) => (
                    <select key={i} value={val}
                        style={selectStyle}
                        onChange={e => { set(e.target.value); setPage(0); }}
                        onFocus={e => e.target.style.borderColor = "#c94f1a"}
                        onBlur={e => e.target.style.borderColor = "#e4e2dd"}
                    >
                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                ))}

                {hasFilters && (
                    <button onClick={resetFilters}
                        style={{ ...inputStyle, color: "#9c9890", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Clear filters
                    </button>
                )}

                {/* Result count */}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#9c9890", whiteSpace: "nowrap" }}>
                    {filtered.length.toLocaleString()} results
                </span>
            </div>

            {/* Table */}
            {state === "loading" && <TableSkeleton />}

            {state === "success" && (
                <div style={{ background: "white", border: "1px solid #e4e2dd", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f4f3f0", borderBottom: "1px solid #e4e2dd" }}>
                                {[
                                    { label: "Time", col: "created_at" as const, sortable: true },
                                    { label: "Key", col: null, sortable: false },
                                    { label: "Model", col: null, sortable: false },
                                    { label: "Tokens", col: "tokens" as const, sortable: true },
                                    { label: "Cost", col: "cost_usd" as const, sortable: true },
                                    { label: "Latency", col: "latency_ms" as const, sortable: true },
                                    { label: "Status", col: null, sortable: false },
                                ].map(({ label, col, sortable }) => (
                                    <th key={label}
                                        onClick={() => sortable && col && handleSort(col)}
                                        style={{
                                            textAlign: "left", padding: "9px 14px",
                                            fontFamily: "var(--font-mono,monospace)", fontSize: "9.5px", fontWeight: 500,
                                            color: "#9c9890", textTransform: "uppercase", letterSpacing: "0.12em",
                                            whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default",
                                            userSelect: "none",
                                        }}
                                    >
                                        {label}{sortable && col && <SortIcon col={col} />}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#9c9890", fontSize: "13px", fontWeight: 300 }}>
                                        No requests match the current filters.
                                    </td>
                                </tr>
                            ) : paged.map((r, i) => (
                                <tr key={r.id}
                                    onClick={() => setSelected(r)}
                                    style={{
                                        borderBottom: i < paged.length - 1 ? "1px solid #e4e2dd" : undefined,
                                        cursor: "pointer", transition: "background 0.1s",
                                        background: i % 2 === 0 ? "white" : "#fafaf9",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#fdf1ec")}
                                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafaf9")}
                                >
                                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono,monospace)", fontSize: "10px", color: "#9c9890", whiteSpace: "nowrap" }}>
                                        {fmtDate(r.created_at)}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{ background: "#f4f3f0", color: "#6b6860", fontFamily: "var(--font-mono,monospace)", fontSize: "9px", padding: "2px 6px", borderRadius: "4px" }}>
                                            {r.key_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: PROVIDER_COLORS[r.provider], flexShrink: 0 }} />
                                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#1c1b18" }}>{r.model}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#6b6860" }}>
                                        {(r.prompt_tokens + r.completion_tokens).toLocaleString()}
                                    </td>
                                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#1c1b18" }}>
                                        {fmtCost(r.cost_usd)}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <LatencyCell ms={r.latency_ms} cached={r.cached} />
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <StatusBadge record={r} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #e4e2dd", background: "#fafaf9" }}>
                            <span style={{ fontFamily: "var(--font-mono,monospace)", fontSize: "11px", color: "#9c9890" }}>
                                Page {page + 1} of {pages} · {filtered.length.toLocaleString()} results
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                    onClick={() => setPage(0)} disabled={page === 0}
                                    style={{ ...inputStyle, padding: "5px 10px", fontSize: "11px", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, fontFamily: "var(--font-mono,monospace)" }}
                                >«</button>
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    style={{ ...inputStyle, padding: "5px 12px", fontSize: "11px", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1 }}
                                >← Prev</button>
                                <button
                                    onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
                                    style={{ ...inputStyle, padding: "5px 12px", fontSize: "11px", cursor: page === pages - 1 ? "not-allowed" : "pointer", opacity: page === pages - 1 ? 0.4 : 1 }}
                                >Next →</button>
                                <button
                                    onClick={() => setPage(pages - 1)} disabled={page === pages - 1}
                                    style={{ ...inputStyle, padding: "5px 10px", fontSize: "11px", cursor: page === pages - 1 ? "not-allowed" : "pointer", opacity: page === pages - 1 ? 0.4 : 1, fontFamily: "var(--font-mono,monospace)" }}
                                >»</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {state === "error" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                    <p style={{ color: "#dc2626", fontSize: "14px" }}>Failed to load requests. <button onClick={() => window.location.reload()} style={{ color: "#c94f1a", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Retry</button></p>
                </div>
            )}

            {/* Slide-over */}
            {selected && <SlideOver record={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}