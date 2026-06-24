CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,        -- bcrypt hash of gw_live_xxx
    key_prefix TEXT NOT NULL,             -- first 12 chars e.g. gw_live_a1b2 (for display)
    owner_id TEXT NOT NULL,
    monthly_budget_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    allowed_models TEXT[] NOT NULL DEFAULT '{}',  -- postgres array, empty = all allowed
    byok_tier SMALLINT NOT NULL DEFAULT 1 CHECK (byok_tier IN (1, 2, 3)),
    encrypted_provider_key TEXT,           -- Tier 2 only, AES-256-GCM encrypted
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_owner_id ON api_keys (owner_id);
CREATE INDEX idx_api_keys_status ON api_keys (status);