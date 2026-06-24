"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

// ─── Types (shaped to match your API responses exactly) ───────────────────────

export type Provider = "openai" | "anthropic" | "google";

export type UsageRecord = {
    id: string;
    key_id: string;
    key_name: string;
    model: string;
    provider: Provider;
    prompt_tokens: number;
    completion_tokens: number;
    cost_usd: number;
    latency_ms: number;
    status_code: number;
    cached: boolean;
    fallback_used: boolean;
    fallback_from?: string;
    created_at: string;
};

export type DailyPoint = {
    date: string;
    spend_usd: number;
    request_count: number;
    token_count: number;
    cache_hits: number;
    fallbacks: number;
};

export type ModelStat = {
    model: string;
    provider: Provider;
    request_count: number;
    spend_usd: number;
    token_count: number;
    avg_latency_ms: number;
    percentage: number;
};

export type KeyStat = {
    key_id: string;
    key_name: string;
    request_count: number;
    spend_usd: number;
    token_count: number;
    budget_usd: number;
};

export type ProviderHealth = {
    name: Provider;
    label: string;
    status: "healthy" | "degraded" | "down";
    error_rate_60s: number;
    p99_latency_ms: number;
    consecutive_failures: number;
};

export type Summary = {
    total_spend_usd: number;
    total_requests: number;
    total_tokens: number;
    cache_hit_rate: number;
    fallback_rate: number;
    p50_latency_ms: number;
    p99_latency_ms: number;
    budget_usd: number;
};

export type DashboardData = {
    summary: Summary;
    records: UsageRecord[];
    daily: DailyPoint[];
    models: ModelStat[];
    keys: KeyStat[];
    providers: ProviderHealth[];
};

type LoadState = "idle" | "loading" | "success" | "error";

type ContextValue = {
    data: DashboardData | null;
    state: LoadState;
    error: string | null;
    refresh: () => void;
    lastFetched: Date | null;
};

// ─── Mock data (swap fetch() calls for real endpoints later) ──────────────────

function buildMockData(): DashboardData {
    const providers: Provider[] = ["openai", "anthropic", "google"];
    const models = [
        { model: "gpt-4o", provider: "openai" as Provider },
        { model: "gpt-4o-mini", provider: "openai" as Provider },
        { model: "claude-sonnet-4-5", provider: "anthropic" as Provider },
        { model: "gemini-1.5-pro", provider: "google" as Provider },
    ];
    const keys = [
        { key_id: "k1", key_name: "Production" },
        { key_id: "k2", key_name: "Staging" },
        { key_id: "k3", key_name: "Dev" },
    ];

    // 200 usage records spread over 30 days
    const records: UsageRecord[] = Array.from({ length: 200 }, (_, i) => {
        const m = models[Math.floor(Math.random() * models.length)];
        const k = keys[Math.floor(Math.random() * keys.length)];
        const daysAgo = Math.random() * 30;
        const ts = new Date(Date.now() - daysAgo * 86400000);
        const prompt = Math.floor(Math.random() * 3000) + 200;
        const completion = Math.floor(Math.random() * 1500) + 100;
        const statusRoll = Math.random();
        const status_code =
            statusRoll < 0.03 ? 429
                : statusRoll < 0.05 ? 402
                    : statusRoll < 0.06 ? 502
                        : 200;
        const cached = status_code === 200 && Math.random() < 0.12;
        const fallback_used = status_code === 200 && !cached && Math.random() < 0.04;
        const pricePer1k =
            m.model === "gpt-4o" ? 0.005
                : m.model === "gpt-4o-mini" ? 0.00015
                    : m.model === "claude-sonnet-4-5" ? 0.006
                        : 0.00125;
        const cost_usd =
            status_code === 200
                ? parseFloat((((prompt + completion) / 1000) * pricePer1k).toFixed(6))
                : 0;

        return {
            id: `req_${i.toString().padStart(4, "0")}`,
            key_id: k.key_id,
            key_name: k.key_name,
            model: m.model,
            provider: m.provider,
            prompt_tokens: prompt,
            completion_tokens: completion,
            cost_usd,
            latency_ms: cached ? Math.floor(Math.random() * 15) + 2
                : Math.floor(Math.random() * 1800) + 80,
            status_code,
            cached,
            fallback_used,
            fallback_from: fallback_used ? providers.find(p => p !== m.provider) : undefined,
            created_at: ts.toISOString(),
        };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Aggregate daily points (last 30 days)
    const daily: DailyPoint[] = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayRecords = records.filter(r => r.created_at.startsWith(dateStr));
        return {
            date: dateStr,
            spend_usd: parseFloat(dayRecords.reduce((s, r) => s + r.cost_usd, 0).toFixed(4)),
            request_count: dayRecords.length,
            token_count: dayRecords.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0),
            cache_hits: dayRecords.filter(r => r.cached).length,
            fallbacks: dayRecords.filter(r => r.fallback_used).length,
        };
    });

    // Model stats
    const modelMap = new Map<string, ModelStat>();
    for (const r of records) {
        const existing = modelMap.get(r.model);
        if (!existing) {
            modelMap.set(r.model, {
                model: r.model, provider: r.provider,
                request_count: 1, spend_usd: r.cost_usd,
                token_count: r.prompt_tokens + r.completion_tokens,
                avg_latency_ms: r.latency_ms, percentage: 0,
            });
        } else {
            existing.request_count++;
            existing.spend_usd += r.cost_usd;
            existing.token_count += r.prompt_tokens + r.completion_tokens;
            existing.avg_latency_ms = Math.round(
                (existing.avg_latency_ms * (existing.request_count - 1) + r.latency_ms) / existing.request_count
            );
        }
    }
    const totalSpend = Array.from(modelMap.values()).reduce((s, m) => s + m.spend_usd, 0);
    const modelStats = Array.from(modelMap.values()).map(m => ({
        ...m,
        spend_usd: parseFloat(m.spend_usd.toFixed(4)),
        percentage: parseFloat(((m.spend_usd / totalSpend) * 100).toFixed(1)),
    })).sort((a, b) => b.spend_usd - a.spend_usd);

    // Key stats
    const keyMap = new Map<string, KeyStat>();
    const budgets: Record<string, number> = { k1: 200, k2: 50, k3: 10 };
    for (const r of records) {
        const existing = keyMap.get(r.key_id);
        if (!existing) {
            keyMap.set(r.key_id, {
                key_id: r.key_id, key_name: r.key_name,
                request_count: 1, spend_usd: r.cost_usd,
                token_count: r.prompt_tokens + r.completion_tokens,
                budget_usd: budgets[r.key_id] ?? 100,
            });
        } else {
            existing.request_count++;
            existing.spend_usd += r.cost_usd;
            existing.token_count += r.prompt_tokens + r.completion_tokens;
        }
    }
    const keyStats = Array.from(keyMap.values()).map(k => ({
        ...k,
        spend_usd: parseFloat(k.spend_usd.toFixed(4)),
    }));

    const successRecords = records.filter(r => r.status_code === 200);
    const summary: Summary = {
        total_spend_usd: parseFloat(totalSpend.toFixed(4)),
        total_requests: records.length,
        total_tokens: records.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0),
        cache_hit_rate: parseFloat((records.filter(r => r.cached).length / records.length).toFixed(4)),
        fallback_rate: parseFloat((records.filter(r => r.fallback_used).length / records.length).toFixed(4)),
        p50_latency_ms: (() => {
            const lats = successRecords.map(r => r.latency_ms).sort((a, b) => a - b);
            return lats[Math.floor(lats.length * 0.5)] ?? 0;
        })(),
        p99_latency_ms: (() => {
            const lats = successRecords.map(r => r.latency_ms).sort((a, b) => a - b);
            return lats[Math.floor(lats.length * 0.99)] ?? 0;
        })(),
        budget_usd: 200,
    };

    return {
        summary,
        records,
        daily,
        models: modelStats,
        keys: keyStats,
        providers: [
            { name: "openai", label: "OpenAI", status: "healthy", error_rate_60s: 0.008, p99_latency_ms: 142, consecutive_failures: 0 },
            { name: "anthropic", label: "Anthropic", status: "healthy", error_rate_60s: 0.003, p99_latency_ms: 98, consecutive_failures: 0 },
            { name: "google", label: "Google", status: "degraded", error_rate_60s: 0.062, p99_latency_ms: 891, consecutive_failures: 3 },
        ],
    };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DashboardDataContext = createContext<ContextValue | null>(null);

export function useDashboardData() {
    const ctx = useContext(DashboardDataContext);
    if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
    return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DashboardDataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [state, setState] = useState<LoadState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetch_ = useCallback(async () => {
        setState("loading");
        setError(null);
        try {
            // Simulate network latency — delete this when wiring real endpoints
            await new Promise(r => setTimeout(r, 400));

            // ─── Real implementation (uncomment when backend is ready) ───────────
            // const [usageRes, providersRes] = await Promise.all([
            //   fetch("/admin/usage?granularity=day&from=<30-days-ago>"),
            //   fetch("/admin/providers"),
            // ]);
            // if (!usageRes.ok || !providersRes.ok) throw new Error("Failed to fetch");
            // const usage = await usageRes.json();
            // const providers = await providersRes.json();
            // setData(transformApiResponse(usage, providers));
            // ─────────────────────────────────────────────────────────────────────

            setData(buildMockData());
            setState("success");
            setLastFetched(new Date());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
            setState("error");
        }
    }, []);

    // Fetch once on mount
    useEffect(() => {
        fetch_();
    }, [fetch_]);

    return (
        <DashboardDataContext.Provider value={{ data, state, error, refresh: fetch_, lastFetched }}>
            {children}
        </DashboardDataContext.Provider>
    );
}