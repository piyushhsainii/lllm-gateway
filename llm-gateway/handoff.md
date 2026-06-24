# llm-gateway — Handoff & Progress Tracker

> Update this doc after every session. It is the living record of what's done, what's next, and every decision made.

---

## Current Status

**Phase:** Core API
**Last updated:** 2025-06-14
**Next action:** Write `error.rs` → `models/request.rs` → `handlers/proxy.rs` (stubbed)

---

## Progress

### ✅ Done

#### Project setup

- [x] `cargo new llm-gateway`
- [x] `Cargo.toml` dependencies added
- [x] Folder structure created (`handlers/`, `middleware/`, `models/`, `proxy/`, `storage/`)
- [x] All modules declared in `main.rs`

#### Foundation

- [x] `tracing_subscriber::fmt::init()` added
- [x] `dotenvy::dotenv().ok()` loads `.env` on startup
- [x] `config::Config::from_env()` reads `PORT`, `DATABASE_URL`, `ADMIN_KEY`, `LOG_LEVEL`
- [x] `GET /health` returns `{ "status": "ok" }` JSON
- [x] `handlers/mod.rs` declares `health`, `proxy`, `admin`
- [x] `storage/db.rs` — `create_pool()` creates Postgres connection pool via sqlx
- [x] Pool passed into Axum as shared state via `.with_state(pool)`
- [x] Server binds to port from config (env-var driven)

#### Database

- [x] Switched from SQLite to Postgres
- [x] Docker container running (`llm-gateway-db`, port 5432)
- [x] `.env` has `DATABASE_URL=postgresql://gateway:gateway@localhost:5432/llm_gateway`
- [x] `sqlx-cli` installed
- [x] `migrations/` folder in project root (NOT inside `src/`)
- [x] 3 migration files created and SQL written:
  - `001_create_api_keys.sql`
  - `002_create_usage_records.sql`
  - `003_create_monthly_rollups.sql`
- [x] `sqlx migrate run` — all 3 tables created in Postgres

---

### 🔄 In Progress

Nothing — clean slate, ready for core API.

---

### 📋 Up Next (ordered — developer writing these themselves)

#### Step 1 — `error.rs`

`GatewayError` enum using `thiserror`. Variants:

- `Unauthorized` → 401
- `RateLimited { retry_after: u64 }` → 429 + `Retry-After` header
- `BudgetExceeded { spent: f64, limit: f64 }` → 402
- `UpstreamError(String)` → 502
- `InternalError(#[from] anyhow::Error)` → 500

Must implement `axum::response::IntoResponse`. Every variant returns JSON:

```json
{ "error": "human message", "code": "snake_case_code" }
```

#### Step 2 — `models/request.rs`

`ChatCompletionRequest` struct — OpenAI format, canonical input for the gateway.
`Message` struct with `role: String` and `content: String`.
Use `#[serde(default)]` on all optional fields. Do NOT use `deny_unknown_fields` — must pass through any valid OpenAI field without breaking.

`models/response.rs` — stub for now, just an empty file with a comment.

Declare both in `models/mod.rs`:

```rust
pub mod request;
pub mod response;
```

#### Step 3 — `handlers/proxy.rs` (stubbed, no real forwarding yet)

Handler for `POST /v1/chat/completions`.

1. Extract `Authorization` header → strip `Bearer ` prefix → get raw key string
2. Extract `X-Provider-Key` header
3. Deserialize body into `ChatCompletionRequest`
4. Log: `tracing::info!(model = %req.model, "incoming request")`
5. Return hardcoded stub JSON for now:

```json
{
  "id": "stub-001",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [
    {
      "message": { "role": "assistant", "content": "stub response" },
      "finish_reason": "stop"
    }
  ]
}
```

Wire up in `main.rs`:

```rust
.route("/v1/chat/completions", post(handlers::proxy::chat_completions))
```

Test with curl:

```powershell
curl -X POST http://localhost:3000/v1/chat/completions `
  -H "Authorization: Bearer gw_live_test" `
  -H "X-Provider-Key: sk-fake" `
  -H "Content-Type: application/json" `
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hello"}]}'
```

#### Step 4 — `storage/keys.rs`

CRUD functions against the `api_keys` Postgres table using sqlx.
Functions needed right now:

- `get_key_by_hash(pool, hash) -> Result<Option<ApiKey>>` — used by auth middleware
- `create_key(pool, params) -> Result<ApiKey>` — used by admin handler
- `list_keys(pool, owner_id) -> Result<Vec<ApiKey>>` — used by admin handler
- `revoke_key(pool, key_id) -> Result<()>` — used by admin handler

Define an `ApiKey` struct in this file matching the DB columns.

#### Step 5 — `middleware/auth.rs`

Tower middleware layer. Runs on every customer route (not `/health`, not `/admin/*`).

1. Extract `Authorization: Bearer gw_live_xxx` header
2. Hash the raw key (bcrypt or SHA-256 — pick one, note it in decisions log)
3. Look up hash in `api_keys` table via `storage::keys::get_key_by_hash`
4. If not found or status = revoked → return `GatewayError::Unauthorized`
5. If found → attach `KeyContext` to request extensions so downstream handlers can read it

`KeyContext` struct (define in `middleware/auth.rs` or `models/mod.rs`):

```rust
pub struct KeyContext {
    pub key_id: uuid::Uuid,
    pub owner_id: String,
    pub monthly_budget_usd: f64,
    pub requests_per_minute: u32,
    pub allowed_models: Vec<String>,
    pub byok_tier: i16,
}
```

#### Step 6 — `middleware/rate_limit.rs`

Token bucket per key. In-memory `DashMap<Uuid, TokenBucket>`.
`TokenBucket` struct:

```rust
struct TokenBucket {
    tokens: f64,
    last_refill: Instant,
    capacity: f64,       // = requests_per_minute
    refill_rate: f64,    // = capacity / 60.0 (tokens per second)
}
```

On each request: refill bucket based on elapsed time, try to consume 1 token.
If empty → `GatewayError::RateLimited { retry_after }`.

#### Step 7 — `proxy/router.rs`

Read `model` field from `ChatCompletionRequest`.
Match prefix → provider URL:

- `gpt-` → `https://api.openai.com/v1/chat/completions`
- `claude-` → `https://api.anthropic.com/v1/messages`
- `gemini-` → `https://generativelanguage.googleapis.com/v1beta/...`

For Anthropic: translate request body from OpenAI format to Anthropic format (pull `system` role out of messages array, rename fields).

#### Step 8 — `proxy/client.rs`

`reqwest::Client` with connection pooling (create once, reuse across requests).
Forward translated request to upstream URL.
Inject provider key as `Authorization` header.
Handle timeouts and 5xx errors → return `GatewayError::UpstreamError`.

#### Step 9 — `proxy/stream.rs`

Read upstream SSE response stream.
Forward each `data:` chunk to client as it arrives.
Parse chunks to extract token counts (read from response metadata or count manually).

#### Step 10 — `middleware/budget.rs`

`DashMap<Uuid, AtomicU64>` — spend in micro-cents per key.
Pre-flight: estimate cost → atomic reserve → proceed.
Post-response: settle actual cost, refund over-estimate.
If `current + estimate > limit` → `GatewayError::BudgetExceeded`.

#### Step 11 — `handlers/admin.rs`

Routes behind `ADMIN_KEY` auth:

- `POST /admin/keys` → `storage::keys::create_key`
- `GET /admin/keys` → `storage::keys::list_keys`
- `GET /admin/keys/:id` → `storage::keys::get_key`
- `DELETE /admin/keys/:id` → `storage::keys::revoke_key`
- `GET /admin/usage` → query `usage_records` table

#### Step 12 — Metrics + benchmark

`GET /metrics` Prometheus endpoint.
`bench/` folder with 500-concurrent-request benchmark script vs LiteLLM.

---

## Decisions Log

| Date       | Decision                                    | Reason                                                        |
| ---------- | ------------------------------------------- | ------------------------------------------------------------- |
| 2025-06-14 | BYOK model (no operator keys)               | Zero financial risk                                           |
| 2025-06-14 | Tier 1 default (X-Provider-Key per request) | "We literally cannot store it" pitch                          |
| 2025-06-14 | OpenAI format as canonical interface        | One URL change for customers                                  |
| 2025-06-14 | Model name from request body                | Already in OpenAI format, no extra header                     |
| 2025-06-14 | Switched from SQLite to Postgres            | Supabase compatibility, migrate local→cloud with zero changes |
| 2025-06-14 | Docker for local Postgres                   | `docker run` one command, matches Supabase Postgres version   |
| 2025-06-14 | Migrations in project root not src/         | sqlx-cli expects `migrations/` at project root                |
| 2025-06-14 | DashMap + AtomicU64 for budget              | No global lock on hot path                                    |
| 2025-06-14 | Port 3000 in dev                            | Env-var driven via Config::from_env()                         |

---

## Open Questions

- [ ] Key hashing: bcrypt (slower, more secure) or SHA-256 (faster, simpler)? bcrypt recommended since keys are like passwords
- [ ] Request deduplication: v1 or v2?
- [ ] Token counting: `tiktoken-rs` for GPT or read from response stream headers?
- [ ] Fallback model mapping: hardcoded or config-driven?
- [ ] Audit log: NDJSON file or `audit_logs` Postgres table?
- [ ] Supabase migration: when to switch (after first working demo?)

---

## Current `main.rs`

```rust
use anyhow::*;
use axum::{Router, response::IntoResponse, routing::get};

mod config;
mod error;
mod models;
mod middleware;
mod proxy;
mod storage;
mod handlers;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let config = config::Config::from_env()?;
    let pool = storage::db::create_pool(&config.database_url).await?;
    tracing::info!("database connected");

    let app = Router::new()
        .route("/health", get(handlers::health::health))
        .with_state(pool);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

---

## How to Use This Doc

After every coding session:

1. Move completed items to ✅ Done
2. Update 🔄 In Progress
3. Add decisions to Decisions Log
4. Paste latest `main.rs` at bottom
5. Note new open questions

Paste this doc + `system-design-v2.md` at the start of every new chat for full context.
