export const PROVIDER_COLORS = { openai: '#2563eb', anthropic: '#7c3aed', google: '#16a34a' } as const

export const PLANS = {
  free:       { name: 'Free',       price: 0,  requestLimit: 10000,    keyLimit: 3,        features: ['3 API keys', '10k requests/mo', 'Tier 1 BYOK only', 'Community support'] },
  pro:        { name: 'Pro',        price: 19, requestLimit: Infinity, keyLimit: 20,       features: ['20 API keys', 'Unlimited requests', 'All BYOK tiers', 'Email support', 'Webhooks'] },
  team:       { name: 'Team',       price: 49, requestLimit: Infinity, keyLimit: Infinity, features: ['Unlimited keys', 'Unlimited requests', 'All BYOK tiers', 'Priority support', 'SSO'] },
  enterprise: { name: 'Enterprise', price: 0,  requestLimit: Infinity, keyLimit: Infinity, features: ['Everything in Team', 'Custom contracts', 'SLA guarantees', 'Dedicated support'] },
} as const

export const BYOK_TIERS = [
  { tier: 1 as const, name: 'Standard',      guarantee: 'Keys encrypted at rest',      forWho: 'Most projects and individual developers',           description: 'Your provider keys are encrypted at rest with AES-256. Decrypted in-memory only at request time.' },
  { tier: 2 as const, name: 'Isolated',       guarantee: 'Per-key vault isolation',      forWho: 'Production workloads, regulated industries',         description: 'Each key is stored in an isolated secret vault. Envelope encryption with per-key KEKs.' },
  { tier: 3 as const, name: 'Zero-knowledge', guarantee: 'Keys never touch our servers', forWho: 'Enterprise, HIPAA, SOC 2 Type II requirements',      description: 'Your keys never leave your infrastructure. Gateway fetches from your own secrets manager at runtime.' },
]

export const MODELS = ['gpt-4o','gpt-4o-mini','gpt-4-turbo','claude-sonnet-4-5','claude-opus-4','claude-haiku-3-5','gemini-1.5-pro','gemini-1.5-flash']
