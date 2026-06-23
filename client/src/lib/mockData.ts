import type { User, ApiKey, RequestRecord, ProviderHealth, DailySpend, ModelBreakdown, WebhookAttempt, Invoice } from './types'

export const MOCK_USER: User = {
  id: 'usr_01', name: 'Aryan Sharma', email: 'aryan@acme.dev',
  company: 'Acme AI', plan: 'pro', createdAt: '2025-01-03T09:00:00Z', byokTier: 1,
}

export const MOCK_KEYS: ApiKey[] = [
  { id: 'key_prod', name: 'Production',     key: 'gw_live_pk8x2mNrQs9tLvF4wZ', monthlyBudgetUsd: 200, requestsPerMinute: 120, allowedModels: [],                               createdAt: '2025-01-03T09:15:00Z', lastUsedAt: new Date(Date.now() - 2*60000).toISOString(),       status: 'active', totalSpendUsd: 47.23, totalRequests: 8420 },
  { id: 'key_stg',  name: 'Staging',        key: 'gw_live_sg5yRmKpT2wX9hB3cQ', monthlyBudgetUsd: 50,  requestsPerMinute: 30,  allowedModels: ['gpt-4o','claude-sonnet-4-5'], createdAt: '2025-01-10T14:30:00Z', lastUsedAt: new Date(Date.now() - 47*60000).toISOString(),      status: 'active', totalSpendUsd: 4.11,  totalRequests: 891  },
  { id: 'key_dev',  name: 'Dev (personal)', key: 'gw_live_dv3nCsJ7qY6uAe1fMp', monthlyBudgetUsd: 10,  requestsPerMinute: 10,  allowedModels: ['gpt-4o-mini'],               createdAt: '2025-01-15T11:00:00Z', lastUsedAt: new Date(Date.now() - 3*3600000).toISOString(),     status: 'active', totalSpendUsd: 1.87,  totalRequests: 203  },
]

function genRequests(): RequestRecord[] {
  const models = [
    { model: 'gpt-4o',           provider: 'openai'    as const, w: 0.70 },
    { model: 'claude-sonnet-4-5', provider: 'anthropic' as const, w: 0.20 },
    { model: 'gemini-1.5-pro',   provider: 'google'    as const, w: 0.10 },
  ]
  const keys = MOCK_KEYS
  const now = Date.now()
  const records: RequestRecord[] = []
  for (let i = 0; i < 50; i++) {
    let r = Math.random(), cum = 0, sel = models[0]
    for (const m of models) { cum += m.w; if (r <= cum) { sel = m; break } }
    const sr = Math.random()
    let status: 200|402|429|500|503 = 200, cached = false, fallbackUsed = false, fallbackFrom: string|undefined
    if      (sr < 0.03)  status = 402
    else if (sr < 0.06)  status = 429
    else if (sr < 0.07)  status = 500
    else if (sr < 0.12)  cached = true
    else if (sr < 0.17) { fallbackUsed = true; fallbackFrom = sel.provider === 'google' ? 'openai' : 'google' }
    const pt = Math.floor(Math.random()*2500)+400, ct = Math.floor(Math.random()*1500)+100
    const cpk = sel.model === 'gpt-4o' ? 0.000005 : sel.model === 'claude-sonnet-4-5' ? 0.000004 : 0.0000035
    const key = keys[Math.floor(Math.random()*3)]
    records.push({
      id: `req_${i.toString().padStart(4,'0')}`, timestamp: new Date(now - Math.random()*7*86400000).toISOString(),
      model: sel.model, provider: sel.provider, promptTokens: pt, completionTokens: ct, totalTokens: pt+ct,
      costUsd: (status===200||cached) ? parseFloat(((pt+ct)*cpk).toFixed(5)) : 0,
      latencyMs: cached ? Math.floor(Math.random()*20)+5 : Math.floor(Math.random()*2200)+120,
      status, cached, fallbackUsed, fallbackFrom, keyId: key.id, keyName: key.name,
    })
  }
  return records.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const MOCK_REQUESTS: RequestRecord[] = genRequests()

export function getMockDailySpend(days = 30): DailySpend[] {
  const result: DailySpend[] = []
  const now = new Date()
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate()-i)
    const isWE = d.getDay()===0||d.getDay()===6
    const trend = 1+((days-i)/days)*0.4, noise = 0.7+Math.random()*0.6
    result.push({ date: d.toISOString().split('T')[0], spendUsd: parseFloat((1.8*trend*(isWE?0.35:1)*noise).toFixed(2)), requestCount: Math.floor(280*trend*(isWE?0.35:1)*noise) })
  }
  return result
}

export function getMockModelBreakdown(): ModelBreakdown[] {
  return [
    { model: 'gpt-4o',            provider: 'openai',    requestCount: 5883, tokenCount: 1392000, spendUsd: 31.20, percentage: 58 },
    { model: 'claude-sonnet-4-5', provider: 'anthropic', requestCount: 2021, tokenCount: 475000,  spendUsd: 10.89, percentage: 24 },
    { model: 'gpt-4o-mini',       provider: 'openai',    requestCount: 926,  tokenCount: 318000,  spendUsd: 2.14,  percentage: 11 },
    { model: 'gemini-1.5-pro',    provider: 'google',    requestCount: 590,  tokenCount: 215000,  spendUsd: 3.10,  percentage: 7  },
  ]
}

export const MOCK_PROVIDER_HEALTH: Record<'openai'|'anthropic'|'google', ProviderHealth> = {
  openai:    { provider: 'OpenAI',    status: 'healthy',  errorRate: 0.008, p99LatencyMs: 142, lastChecked: new Date(Date.now()-45000).toISOString() },
  anthropic: { provider: 'Anthropic', status: 'healthy',  errorRate: 0.003, p99LatencyMs: 98,  lastChecked: new Date(Date.now()-32000).toISOString() },
  google:    { provider: 'Google',    status: 'degraded', errorRate: 0.062, p99LatencyMs: 891, lastChecked: new Date(Date.now()-18000).toISOString() },
}

export const MOCK_WEBHOOK_ATTEMPTS: WebhookAttempt[] = [
  { id: 'wh_01', timestamp: new Date(Date.now()-5*60000).toISOString(),       event: 'budget.80_percent',  status: 200, url: 'https://acme.dev/webhooks/llmgateway' },
  { id: 'wh_02', timestamp: new Date(Date.now()-2*3600000).toISOString(),     event: 'provider.degraded',  status: 200, url: 'https://acme.dev/webhooks/llmgateway' },
  { id: 'wh_03', timestamp: new Date(Date.now()-6*3600000).toISOString(),     event: 'provider.degraded',  status: 500, url: 'https://acme.dev/webhooks/llmgateway' },
  { id: 'wh_04', timestamp: new Date(Date.now()-24*3600000).toISOString(),    event: 'key.revoked',        status: 200, url: 'https://acme.dev/webhooks/llmgateway' },
  { id: 'wh_05', timestamp: new Date(Date.now()-48*3600000).toISOString(),    event: 'budget.80_percent',  status: 200, url: 'https://acme.dev/webhooks/llmgateway' },
]

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv_mar', date: '2025-03-01', amount: 19.00, status: 'paid', period: 'March 2025' },
  { id: 'inv_feb', date: '2025-02-01', amount: 19.00, status: 'paid', period: 'February 2025' },
  { id: 'inv_jan', date: '2025-01-01', amount: 19.00, status: 'paid', period: 'January 2025' },
]

export function getMockRequests(filter?: { model?: string; status?: string; search?: string }): RequestRecord[] {
  let r = [...MOCK_REQUESTS]
  if (filter?.model && filter.model !== 'all') r = r.filter(x => x.model === filter.model)
  if (filter?.status && filter.status !== 'all') {
    const n = parseInt(filter.status)
    if (!isNaN(n)) r = r.filter(x => x.status === n)
    else if (filter.status === 'cached')   r = r.filter(x => x.cached)
    else if (filter.status === 'fallback') r = r.filter(x => x.fallbackUsed)
  }
  if (filter?.search) { const s = filter.search.toLowerCase(); r = r.filter(x => x.model.includes(s)||x.keyName.toLowerCase().includes(s)||x.provider.includes(s)) }
  return r
}
