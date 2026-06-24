# llm-gateway — System Design Reference

> Keep this doc open while building. It is the single source of truth for architecture decisions, data flow, and component contracts.

---

## What It Is

A Rust HTTP reverse proxy that sits between a customer's app and LLM providers (OpenAI, Anthropic, Gemini). Customers point their `base_url` at the gateway, send standard OpenAI-format requests, and the gateway handles auth, rate limiting, budget enforcement, provider routing, and streaming passthrough — transparently.

**Business model:** BYOK (Bring Your Own Key). Customers bring their own OpenAI/Anthropic API keys. The gateway operator carries zero financial risk. Customers pay a flat monthly SaaS fee for the gateway software, not for API access.

---

## Core Principles

- **Zero financial risk** — gateway operator never holds provider API keys or credits
- **Zero credential storage by default** — Tier 1 BYOK: provider key arrives per-request in `X-Provider-Key` header, never written to disk
- **OpenAI-compatible interface** — customers change one URL, nothing else
- **Fail fast before upstream** — auth/rate/budget checks reject before any upstream call (saves customer API credits)
- **Zero-copy streaming** — SSE bytes from upstream pass through to client without buffering

---

## Request Lifecycle (12 Stages)

Every request flows through these stages in order. Each is a Tower middleware layer. Failure at any stage short-circuits — request never proceeds further.

```
Client App
    │
    │  POST /v1/chat/completions
    │  Authorization: Bearer gw_live_abc123
    │  X-Provider-Key: sk-openai-xyz (Tier 1)
    │  Body: { "model": "gpt-4o", "messages": [...] }
    ▼
[1]  TLS + TCP accept          (Tokio TcpListener)
[2]  Request parsing           (Axum extractor — headers + body + model field)
[3]  Auth middleware           (validate gw_live_abc123 → KeyContext)
[4]  Rate limiter              (token bucket per key, in-memory DashMap)
[5]  Budget enforcer           (atomic reservation, pre-flight cost check)
[6]  Request deduplicator      (LRU cache, 5s TTL, hash of key+model+messages)
[7]  Router                    (model name → provider URL + body translation)
[8]  Upstream HTTP client      (reqwest, connection pooling, inject provider key)
[9]  Response streamer         (zero-copy SSE passthrough)
[10] Token counter             (count tokens mid-stream via tiktoken-rs)
[11] Cost recorder             (settle actual vs estimated, write to SQLite)
[12] Audit logger              (NDJSON append-only, metadata only)
    │
    │  Streaming SSE response
    ▼
Client App
```

---

## BYOK Tiers

| Tier              | How it works                               | Storage           | Who uses it               |
| ----------------- | ------------------------------------------ | ----------------- | ------------------------- |
| 1 (default, free) | `X-Provider-Key` header per request        | Never stored      | Paranoid teams, free plan |
| 2 (Pro+)          | Key stored AES-256-GCM encrypted in SQLite | Encrypted at rest | Teams wanting convenience |
| 3 (Enterprise)    | Self-hosted, customer runs the binary      | Their infra       | Large orgs                |

Encryption key for Tier 2 lives in `GATEWAY_ENCRYPTION_KEY` env var, never in DB.

---

## Key Concepts

### Gateway Key vs Provider Key

```
gw_live_abc123        ← YOU issue this. Lives in your SQLite.
                         Identifies which company is calling.
                         Means nothing to OpenAI.

sk-openai-xyz-THEIRS  ← CUSTOMER owns this. Bought from OpenAI.
                         Passed per-request (Tier 1) or decrypted (Tier 2).
                         OpenAI bills customer directly.
```

### KeyContext (attached to every validated request)

```rust
pub struct KeyContext {
    pub key_id: Uuid,
    pub owner_id: String,
    pub monthly_budget_usd: f64,      // 0.0 = unlimited
    pub requests_per_minute: u32,
    pub allowed_models: Vec<String>,  // empty = all models allowed
    pub byok_tier: ByokTier,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}
```

### Model Routing Table (config-driven)

```toml
[routing]
"gpt-"       = "openai"
"claude-"    = "anthropic"
"gemini-"    = "google"

[providers.openai]
base_url = "https://api.openai.com/v1"
priority = 1

[providers.anthropic]
base_url = "https://api.anthropic.com/v1"
priority = 2

[providers.google]
base_url = "https://generativelanguage.googleapis.com/v1beta"
priority = 3
```

Router reads `model` field from request body. No extra header needed.

### Request Translation (OpenAI → Anthropic)

OpenAI format is canonical. Gateway translates outbound for non-OpenAI providers.

```
OpenAI (what customer sends):          Anthropic (what gateway forwards):
{                                      {
  "model": "claude-sonnet-4-5",    →     "model": "claude-sonnet-4-5-20251001",
  "messages": [                          "system": "You are helpful",
    {"role":"system","content":"..."},   "messages": [
    {"role":"user","content":"hi"}         {"role":"user","content":"hi"}
  ],                                     ],
  "max_tokens": 1000                     "max_tokens": 1000
}                                      }
```

Response translated back to OpenAI format before returning to client.

### Budget Enforcement (Atomic Reservation Pattern)

Problem: two concurrent requests for a user with $0.05 left both pass the check before either records cost.

Solution:

1. Read current spend (`AtomicU64` in micro-cents)
2. Estimate cost for this request (model pricing table × input token estimate)
3. If `current + estimate > limit` → reject 402
4. If under limit → atomically increment "reserved" counter by estimate
5. After response completes → settle: replace estimate with actual cost
6. If actual < estimate → refund difference

State: `DashMap<KeyId, AtomicU64>` — no global lock on hot path.

### Zero-Copy SSE Streaming

```
Upstream SSE stream
    │
    ├──→ Token counter (reads &[u8] reference — no copy)
    │
    └──→ Client SSE stream (same bytes forwarded unmodified)
```

Borrow checker enforces zero-copy at compile time. Token counter cannot hold bytes longer than the forwarder.

### Request Body Passthrough (`#[serde(flatten)]`)

Gateway only deserializes fields it needs. Everything else passes through untouched.

```rust
pub struct ChatCompletionRequest {
    pub model: String,           // needed: determines provider routing
    pub messages: Vec<Message>,  // needed: token estimation + Anthropic translation
    pub stream: Option<bool>,    // needed: determines SSE vs full response

    #[serde(flatten)]
    pub extra: HashMap<String, Value>,  // tools, temperature, seed, response_format, etc.
                                         // carried through, never inspected
}
```

**For OpenAI** — merge `extra` back with named fields, forward raw:

```rust
let mut body = serde_json::to_value(&req.extra).unwrap_or(json!({}));
body["model"]    = json!(req.model);
body["messages"] = serde_json::to_value(&req.messages)?;
body["stream"]   = json!(should_stream);
// forward body — contains everything customer sent, nothing lost
```

**For Anthropic** — translate explicitly, only passthrough safe fields:

- Pull `system` role out of messages array → top-level `system` field
- `max_tokens` is **required** by Anthropic — default to `1024` if missing
- `tools` format differs — translate from OpenAI function format to Anthropic tool format
- Drop unsupported fields (`response_format`, `seed`, `logprobs`)

### Token Estimation (Pre-Flight)

Used by budget enforcer before forwarding. Always a worst-case estimate — actual cost settled after response.

```
estimated_tokens ≈ total_chars_in_messages / 4   (+4 per message for formatting)
estimated_cost   = (input_tokens / 1000 × input_price)
                 + (max_tokens_param / 1000 × output_price)
```

Model pricing table (hardcoded, updated manually when providers change prices):

| Model             | Input per 1K | Output per 1K          |
| ----------------- | ------------ | ---------------------- |
| gpt-4o            | $0.0025      | $0.0100                |
| gpt-4o-mini       | $0.00015     | $0.00060               |
| claude-sonnet-4-5 | $0.0030      | $0.0150                |
| gemini-1.5-pro    | $0.00125     | $0.00500               |
| unknown           | $0.0100      | $0.0100 (conservative) |

Actual token counts come from the response:

- **Non-streaming**: `usage` object in response body
- **Streaming**: `usage` object in second-to-last SSE chunk before `[DONE]`

### Streaming vs Non-Streaming

Determined by `req.stream` field set by the customer:

```
stream: true  → keep connection open, forward SSE chunks as they arrive
stream: false → wait for complete response body, return as JSON
```

For streaming responses, the usage/token data arrives in the final chunk:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}   ← forward to client
data: {"choices":[{"delta":{"content":" world"}}]}  ← forward to client
data: {"usage":{"prompt_tokens":10,"completion_tokens":2}}  ← capture, don't forward
data: [DONE]  ← forward, then settle budget
```

---

## Project Structure

```
llm-gateway/
├── src/
│   ├── main.rs              ← server bootstrap, router composition
│   ├── config.rs            ← Config struct from env vars
│   ├── error.rs             ← GatewayError enum + IntoResponse impl
│   │
│   ├── models/
│   │   ├── mod.rs
│   │   ├── request.rs       ← ChatCompletionRequest, Message structs
│   │   └── response.rs      ← ChatCompletionResponse structs
│   │
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs          ← Tower layer: validate gw_live_* key
│   │   ├── rate_limit.rs    ← Tower layer: token bucket per key
│   │   └── budget.rs        ← Tower layer: atomic spend reservation
│   │
│   ├── proxy/
│   │   ├── mod.rs
│   │   ├── router.rs        ← model name → provider URL + body translation
│   │   ├── client.rs        ← reqwest client, forward request upstream
│   │   └── stream.rs        ← SSE passthrough + token counting
│   │
│   ├── storage/
│   │   ├── mod.rs
│   │   ├── db.rs            ← Postgres connection pool via sqlx (PgPool)
│   │   └── keys.rs          ← ApiKey CRUD operations
│   │
│   └── handlers/
│       ├── mod.rs
│       ├── proxy.rs         ← POST /v1/chat/completions
│       ├── admin.rs         ← POST /admin/keys, GET /admin/usage etc
│       └── health.rs        ← GET /health
│
├── Cargo.toml
├── .env                     ← local env vars (gitignored)
├── .env.example             ← committed, shows required vars
└── data/
    └── gateway.db           ← SQLite file (gitignored)
```

---

## API Routes

Three categories of routes. Auth mechanism is different for each — do not mix them up.

---

### Category 1 — No Auth Required

These routes are open to the public. No key needed.

---

#### `GET /health`

**What it does:** Liveness check. Load balancers, uptime monitors, and Shuttle.rs deployment system ping this to know if the server is alive.

**Auth:** None.

**Request:** No body, no headers needed.

**Response `200`:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2025-06-14T10:23:41Z"
}
```

**Response `503`** (if DB unreachable or critical subsystem down):

```json
{ "status": "degraded", "reason": "database unavailable" }
```

**Handler file:** `handlers/health.rs`

---

### Category 2 — Customer Routes (Gateway Key Auth)

These are the routes customers call from their apps. Require `Authorization: Bearer gw_live_*` header on every request. Validated by the Auth Tower middleware layer before the handler ever runs.

If the key is missing or invalid → `401 Unauthorized` immediately, no further processing.

---

#### `POST /v1/chat/completions`

**What it does:** The core of the gateway. Receives an OpenAI-format chat completion request, runs it through all 12 pipeline stages (auth → rate limit → budget → dedup → route → forward → stream → cost record), and streams the response back to the client.

**Auth:** `Authorization: Bearer gw_live_abc123` — customer's gateway key.

**Extra header:** `X-Provider-Key: sk-openai-xyz` — customer's own provider API key (Tier 1). Not required for Tier 2 (stored encrypted).

**Request body** (OpenAI format, canonical):

```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Explain zero-copy in Rust." }
  ],
  "max_tokens": 1000,
  "temperature": 0.7,
  "stream": true
}
```

**What happens inside:**

1. Auth layer validates `gw_live_abc123`, attaches `KeyContext` to request
2. Rate limiter checks token bucket for this key
3. Budget enforcer does pre-flight cost estimate + atomic reservation
4. Deduplicator hashes request, checks LRU cache
5. Router reads `"model": "gpt-4o"` → maps to OpenAI → sets upstream URL
6. If model is `claude-*` → translates body to Anthropic format
7. Injects `X-Provider-Key` as the `Authorization` header for the upstream call
8. Forwards request to upstream provider
9. Streams SSE response back to client (zero-copy)
10. Token counter tallies tokens mid-stream
11. Cost recorder settles actual vs estimated spend in SQLite
12. Audit log appends metadata record

**Response (streaming SSE):**

```
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"Zero"},...}]}
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"-copy"},...}]}
data: [DONE]
```

**Response (non-streaming):**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [
    {
      "message": { "role": "assistant", "content": "Zero-copy means..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 142,
    "total_tokens": 166
  }
}
```

**Error responses:**
| Code | When | Body |
|---|---|---|
| `401` | Missing or invalid gateway key | `{ "error": "unauthorized", "code": "invalid_key" }` |
| `402` | Monthly budget exhausted | `{ "error": "budget exceeded", "code": "budget_exceeded", "spent": 19.82, "limit": 20.00 }` |
| `429` | Rate limit hit | `{ "error": "rate limited", "code": "rate_limited", "retry_after": 12 }` with `Retry-After: 12` header |
| `502` | Upstream provider returned error | `{ "error": "upstream error", "code": "upstream_error", "provider": "openai" }` |
| `503` | All providers degraded, no fallback available | `{ "error": "no providers available", "code": "all_providers_down" }` |

**Response headers always included:**

```
X-Request-ID: uuid-of-this-request
X-Gateway-Provider: openai          ← which provider actually handled it
X-Cache: MISS                       ← or HIT if served from dedup cache
X-Gateway-Latency-Ms: 9            ← gateway overhead only (not upstream time)
```

**Handler file:** `handlers/proxy.rs`

---

### Category 3 — Admin Routes (Admin Key Auth)

These are routes the gateway operator uses — not customers. Used by the dashboard frontend to manage keys, view usage, and monitor provider health.

Auth: `Authorization: Bearer <ADMIN_KEY>` where `ADMIN_KEY` is set in the server's `.env`. This is a single static key only the operator knows. Do not expose it to customers.

If the admin key is missing or wrong → `401 Unauthorized`.

All admin routes are under the `/admin` prefix. In production, consider putting these behind a firewall or separate port.

---

#### `POST /admin/keys`

**What it does:** Creates a new gateway API key for a customer. Generates a `gw_live_*` key, hashes it, stores it in SQLite with the provided config. Returns the raw key once — it is never retrievable again after this call.

**Request body:**

```json
{
  "name": "Production",
  "owner_id": "company-acme",
  "monthly_budget_usd": 200.0,
  "requests_per_minute": 120,
  "allowed_models": [],
  "byok_tier": 1,
  "expires_at": null
}
```

Fields:

- `name` — human label shown in dashboard
- `owner_id` — which customer this belongs to (your internal ID)
- `monthly_budget_usd` — `0.0` means unlimited
- `requests_per_minute` — rate limit for this key
- `allowed_models` — empty array means all models allowed
- `byok_tier` — `1`, `2`, or `3`
- `expires_at` — ISO timestamp or `null` for no expiry

**Response `201`:**

```json
{
  "key_id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "gw_live_a1b2c3d4e5f6g7h8i9j0",
  "name": "Production",
  "created_at": "2025-06-14T10:23:41Z",
  "warning": "Store this key now. It will not be shown again."
}
```

**Handler file:** `handlers/admin.rs`

---

#### `GET /admin/keys`

**What it does:** Lists all gateway keys (active and revoked). Never returns raw key values — only masked versions and metadata.

**Query params:**

- `?status=active` — filter by status (`active` / `revoked` / `all`, default `all`)
- `?owner_id=company-acme` — filter by owner

**Response `200`:**

```json
{
  "keys": [
    {
      "key_id": "550e8400-...",
      "name": "Production",
      "key_masked": "gw_live_a1b2••••••••••••",
      "owner_id": "company-acme",
      "status": "active",
      "monthly_budget_usd": 200.0,
      "requests_per_minute": 120,
      "byok_tier": 1,
      "created_at": "2025-06-14T10:23:41Z",
      "last_used_at": "2025-06-14T11:00:00Z"
    }
  ],
  "total": 1
}
```

**Handler file:** `handlers/admin.rs`

---

#### `GET /admin/keys/:id`

**What it does:** Get full details for one key including current month spend and request count. Used by dashboard to show per-key stats.

**Response `200`:**

```json
{
  "key_id": "550e8400-...",
  "name": "Production",
  "key_masked": "gw_live_a1b2••••••••••••",
  "owner_id": "company-acme",
  "status": "active",
  "monthly_budget_usd": 200.0,
  "requests_per_minute": 120,
  "allowed_models": [],
  "byok_tier": 1,
  "created_at": "2025-06-14T10:23:41Z",
  "expires_at": null,
  "current_month": {
    "spend_usd": 47.23,
    "request_count": 8420,
    "token_count": 2400000
  }
}
```

**Response `404`:** Key ID not found.

**Handler file:** `handlers/admin.rs`

---

#### `PATCH /admin/keys/:id`

**What it does:** Update a key's configuration. Only these fields can be changed — the key itself and owner cannot be changed.

**Request body** (all fields optional — only send what you want to change):

```json
{
  "name": "Production v2",
  "monthly_budget_usd": 500.0,
  "requests_per_minute": 200,
  "allowed_models": ["gpt-4o", "claude-sonnet-4-5"],
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Response `200`:** Returns updated key object (same shape as `GET /admin/keys/:id`).

**Handler file:** `handlers/admin.rs`

---

#### `DELETE /admin/keys/:id`

**What it does:** Revokes a key immediately. Any in-flight requests using this key will complete (they already passed auth). New requests with this key get `401` from the moment of revocation. Revoked keys stay in SQLite for audit history — they are not deleted from the database.

**Response `200`:**

```json
{
  "key_id": "550e8400-...",
  "status": "revoked",
  "revoked_at": "2025-06-14T11:30:00Z"
}
```

**What happens in-memory:** Key is immediately removed from the in-memory `HashMap` (the key store). Since auth reads from in-memory first, revocation takes effect within milliseconds without needing a DB read.

**Handler file:** `handlers/admin.rs`

---

#### `GET /admin/keys/:id/usage`

**What it does:** Returns time-series usage data for one key. Used by dashboard charts.

**Query params:**

- `?from=2025-06-01` — start date (ISO date, default: start of current month)
- `?to=2025-06-14` — end date (ISO date, default: today)
- `?granularity=day` — `hour` / `day` / `month` (default: `day`)

**Response `200`:**

```json
{
  "key_id": "550e8400-...",
  "from": "2025-06-01",
  "to": "2025-06-14",
  "granularity": "day",
  "summary": {
    "total_spend_usd": 47.23,
    "total_requests": 8420,
    "total_tokens": 2400000,
    "cache_hit_rate": 0.124,
    "fallback_rate": 0.031
  },
  "series": [
    {
      "date": "2025-06-01",
      "spend_usd": 3.21,
      "request_count": 612,
      "token_count": 180000,
      "cache_hits": 74,
      "fallbacks": 18
    }
  ],
  "model_breakdown": [
    {
      "model": "gpt-4o",
      "provider": "openai",
      "request_count": 5894,
      "spend_usd": 31.2,
      "percentage": 70.0
    },
    {
      "model": "claude-sonnet-4-5",
      "provider": "anthropic",
      "request_count": 2020,
      "spend_usd": 10.89,
      "percentage": 24.0
    }
  ]
}
```

**Handler file:** `handlers/admin.rs`

---

#### `GET /admin/usage`

**What it does:** Aggregate usage across ALL keys. Used by dashboard overview page and billing calculations.

**Query params:** Same as above (`from`, `to`, `granularity`) plus:

- `?owner_id=company-acme` — filter to one customer

**Response `200`:** Same shape as `/admin/keys/:id/usage` but `key_id` is absent and `summary` covers all keys.

**Handler file:** `handlers/admin.rs`

---

#### `GET /admin/providers`

**What it does:** Returns current health status of all upstream LLM providers. Used by dashboard to show the degraded-provider warning banner. Also used internally by the router for fallback decisions.

**Response `200`:**

```json
{
  "providers": [
    {
      "name": "openai",
      "status": "healthy",
      "error_rate_60s": 0.008,
      "p99_latency_ms": 142,
      "last_checked_at": "2025-06-14T11:29:30Z",
      "consecutive_failures": 0
    },
    {
      "name": "anthropic",
      "status": "healthy",
      "error_rate_60s": 0.003,
      "p99_latency_ms": 98,
      "last_checked_at": "2025-06-14T11:29:30Z",
      "consecutive_failures": 0
    },
    {
      "name": "google",
      "status": "degraded",
      "error_rate_60s": 0.062,
      "p99_latency_ms": 891,
      "last_checked_at": "2025-06-14T11:29:30Z",
      "consecutive_failures": 3
    }
  ],
  "checked_at": "2025-06-14T11:29:30Z"
}
```

Status values: `healthy` / `degraded` (>5% error rate) / `down` (>50% error rate or unreachable).

**Handler file:** `handlers/admin.rs`

---

#### `GET /metrics`

**What it does:** Prometheus metrics scrape endpoint. Returns plain text in Prometheus exposition format. Grafana Cloud (free tier) scrapes this to build dashboards.

**Auth:** None (Prometheus scrapers don't send auth headers by default). In production, put this behind a firewall or add a separate scrape token.

**Response `200` (text/plain):**

```
# HELP gateway_requests_total Total requests processed
# TYPE gateway_requests_total counter
gateway_requests_total{key_id="550e8400",model="gpt-4o",provider="openai",status="200"} 5894

# HELP gateway_tokens_total Total tokens processed
# TYPE gateway_tokens_total counter
gateway_tokens_total{key_id="550e8400",model="gpt-4o",type="prompt"} 1800000
gateway_tokens_total{key_id="550e8400",model="gpt-4o",type="completion"} 600000

# HELP gateway_cost_usd_total Total cost in USD
# TYPE gateway_cost_usd_total counter
gateway_cost_usd_total{key_id="550e8400"} 47.23

# HELP gateway_request_duration_seconds Request latency histogram
# TYPE gateway_request_duration_seconds histogram
gateway_request_duration_seconds_bucket{le="0.01"} 4200
gateway_request_duration_seconds_bucket{le="0.05"} 7100
gateway_request_duration_seconds_bucket{le="+Inf"} 8420

# HELP gateway_upstream_errors_total Upstream provider errors
# TYPE gateway_upstream_errors_total counter
gateway_upstream_errors_total{provider="google",error_type="timeout"} 12

# HELP gateway_fallbacks_total Provider fallback events
# TYPE gateway_fallbacks_total counter
gateway_fallbacks_total{from="google",to="openai"} 12

# HELP gateway_cache_hits_total Dedup cache hits
# TYPE gateway_cache_hits_total counter
gateway_cache_hits_total 1044

# HELP gateway_budget_rejections_total Requests rejected due to budget
# TYPE gateway_budget_rejections_total counter
gateway_budget_rejections_total{key_id="550e8400"} 0
```

**Handler file:** `handlers/health.rs` (or its own `handlers/metrics.rs` later)

---

### Route Summary Table

| Method   | Path                    | Auth        | Category | Handler file         |
| -------- | ----------------------- | ----------- | -------- | -------------------- |
| `GET`    | `/health`               | None        | Public   | `handlers/health.rs` |
| `GET`    | `/metrics`              | None        | Public   | `handlers/health.rs` |
| `POST`   | `/v1/chat/completions`  | Gateway key | Customer | `handlers/proxy.rs`  |
| `POST`   | `/admin/keys`           | Admin key   | Admin    | `handlers/admin.rs`  |
| `GET`    | `/admin/keys`           | Admin key   | Admin    | `handlers/admin.rs`  |
| `GET`    | `/admin/keys/:id`       | Admin key   | Admin    | `handlers/admin.rs`  |
| `PATCH`  | `/admin/keys/:id`       | Admin key   | Admin    | `handlers/admin.rs`  |
| `DELETE` | `/admin/keys/:id`       | Admin key   | Admin    | `handlers/admin.rs`  |
| `GET`    | `/admin/keys/:id/usage` | Admin key   | Admin    | `handlers/admin.rs`  |
| `GET`    | `/admin/usage`          | Admin key   | Admin    | `handlers/admin.rs`  |
| `GET`    | `/admin/providers`      | Admin key   | Admin    | `handlers/admin.rs`  |

---

## Data Stores

### In-Memory (runtime, rebuilt from Postgres on startup)

| What                | Rust type                                      | Contents                  |
| ------------------- | ---------------------------------------------- | ------------------------- |
| Key store           | `Arc<RwLock<HashMap<String, KeyContext>>>`     | All active keys           |
| Rate limiter        | `Arc<DashMap<Uuid, TokenBucket>>`              | Buckets per key           |
| Budget reservations | `Arc<DashMap<Uuid, AtomicU64>>`                | Live spend in micro-cents |
| Dedup cache         | `Arc<Mutex<LruCache<String, CachedResponse>>>` | Recent request hashes     |
| Provider health     | `Arc<RwLock<HashMap<String, ProviderHealth>>>` | Health per provider       |

### Postgres Tables

Hosted locally via Docker (`postgres:16`) in dev. Production on Supabase. Same SQL, zero migration changes between environments.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API keys issued to customers
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,        -- bcrypt hash of gw_live_xxx
    key_prefix TEXT NOT NULL,             -- first 12 chars for display e.g. gw_live_a1b2
    owner_id TEXT NOT NULL,
    monthly_budget_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    allowed_models TEXT[] NOT NULL DEFAULT '{}',  -- postgres array, empty = all allowed
    byok_tier SMALLINT NOT NULL DEFAULT 1 CHECK (byok_tier IN (1,2,3)),
    encrypted_provider_key TEXT,           -- Tier 2 only, AES-256-GCM encrypted
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_owner_id ON api_keys (owner_id);
CREATE INDEX idx_api_keys_status ON api_keys (status);

-- Every completed request
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id UUID NOT NULL REFERENCES api_keys(id),
    model TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai','anthropic','google')),
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    status_code SMALLINT NOT NULL,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_from TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_records_key_id ON usage_records (key_id);
CREATE INDEX idx_usage_records_created_at ON usage_records (created_at DESC);
CREATE INDEX idx_usage_records_key_created ON usage_records (key_id, created_at DESC);

-- Pre-aggregated monthly spend per key (updated after each request)
CREATE TABLE monthly_rollups (
    key_id UUID NOT NULL REFERENCES api_keys(id),
    month TEXT NOT NULL,                   -- format: YYYY-MM
    total_spend_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    cache_hits INTEGER NOT NULL DEFAULT 0,
    fallback_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (key_id, month)
);

CREATE INDEX idx_monthly_rollups_key_id ON monthly_rollups (key_id);
```

---

## Environment Variables

```bash
# .env.example

# Server
PORT=3000
LOG_LEVEL=info

# Admin
ADMIN_KEY=change_me_in_production

# Database — Postgres
# Local dev: Docker container (postgres:16)
DATABASE_URL=postgresql://gateway:gateway@localhost:5432/llm_gateway
# Production: swap to Supabase connection string, run `sqlx migrate run`, done

# Encryption (Tier 2 BYOK — AES-256-GCM key, 32 bytes base64)
GATEWAY_ENCRYPTION_KEY=

# Provider base URLs (optional overrides)
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

---

## Key Crates and Why

| Crate                            | Why                                                              |
| -------------------------------- | ---------------------------------------------------------------- |
| `axum`                           | Web framework — ergonomic, built on Tower, async                 |
| `tokio`                          | Async runtime — every request is a Tokio task                    |
| `reqwest`                        | HTTP client — forward requests upstream, connection pooling      |
| `tower`                          | Middleware system — composable layers (auth, rate limit, budget) |
| `tower-http`                     | Pre-built Tower layers (CORS, tracing integration)               |
| `serde` + `serde_json`           | JSON serialization/deserialization                               |
| `sqlx`                           | Async Postgres — compile-time checked queries, connection pool   |
| `uuid`                           | Request/key IDs                                                  |
| `chrono`                         | Timestamps                                                       |
| `tracing` + `tracing-subscriber` | Structured logging                                               |
| `dotenvy`                        | Load `.env` file                                                 |
| `anyhow`                         | Error propagation (internal)                                     |
| `thiserror`                      | Typed error definitions (GatewayError)                           |
| `aes-gcm`                        | AES-256-GCM encryption for Tier 2 stored keys                    |
| `dashmap`                        | Concurrent sharded HashMap — rate limiter + budget state         |
| `lru`                            | LRU cache for request deduplication                              |
| `bcrypt`                         | Hash gateway keys before storing in DB                           |

---

## Concurrency Model

- One Tokio task per request — no thread-per-request
- Postgres writes via `sqlx` async pool — never block async runtime
- `DashMap` for high-concurrency in-memory state — sharded, no global lock
- `AtomicU64` for budget counters — CAS operations, no mutex on hot path
- `Arc<RwLock<T>>` for rarely-mutated shared state (key store, provider health)
  - Many concurrent readers (`RwLock::read`) — cheap
  - Rare writers (`RwLock::write`) — only on key create/revoke or health update

---

## Deployment (Zero Budget)

**Shuttle.rs (recommended — full features):**

- `cargo add shuttle-runtime shuttle-axum`
- Deploy with `cargo shuttle deploy`
- Free tier: always-on, no credit card, no spin-down
- Does NOT spin down on free tier — differentiator from Render

**Database:**

- Local dev: Docker `postgres:16` container, port 5432
- Production: Supabase free tier (500MB, 60 connections)
- Migration: change `DATABASE_URL` in env, run `sqlx migrate run` — done
- Connection pooling: Supabase PgBouncer when scaling beyond free tier

**Cloudflare Workers (not recommended for v1):**

- Blocked by: streaming time limits, no persistent DashMap state, WASM-incompatible crates
- Revisit after revenue justifies the rewrite effort

---

## The Benchmark Goal

Run both LiteLLM (Python) and llm-gateway (Rust) on the same hardware. 500 concurrent streaming requests. Measure:

- Memory at peak concurrency
- P50/P95/P99 latency to first token
- Requests/second throughput

Results become the Twitter launch thread. Benchmark script lives in `bench/` folder in the repo.
