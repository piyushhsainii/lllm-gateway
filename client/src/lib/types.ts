export interface User {
  id: string; name: string; email: string; company: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  createdAt: string; byokTier: 1 | 2 | 3;
}
export interface ApiKey {
  id: string; name: string; key: string;
  monthlyBudgetUsd: number; requestsPerMinute: number;
  allowedModels: string[]; createdAt: string; lastUsedAt: string;
  status: 'active' | 'revoked'; totalSpendUsd: number; totalRequests: number;
}
export interface RequestRecord {
  id: string; timestamp: string; model: string;
  provider: 'openai' | 'anthropic' | 'google';
  promptTokens: number; completionTokens: number; totalTokens: number;
  costUsd: number; latencyMs: number;
  status: 200 | 402 | 429 | 500 | 503;
  cached: boolean; fallbackUsed: boolean; fallbackFrom?: string;
  keyId: string; keyName: string;
}
export interface ProviderHealth {
  provider: string; status: 'healthy' | 'degraded' | 'down';
  errorRate: number; p99LatencyMs: number; lastChecked: string;
}
export interface DailySpend { date: string; spendUsd: number; requestCount: number; }
export interface ModelBreakdown {
  model: string; provider: string; requestCount: number;
  tokenCount: number; spendUsd: number; percentage: number;
}
export interface WebhookAttempt {
  id: string; timestamp: string; event: string; status: 200 | 500; url: string;
}
export interface Invoice { id: string; date: string; amount: number; status: 'paid'; period: string; }
