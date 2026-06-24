CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id UUID NOT NULL REFERENCES api_keys(id),
    model TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    status_code SMALLINT NOT NULL,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_from TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- These indexes matter a lot for the admin usage queries
CREATE INDEX idx_usage_records_key_id ON usage_records (key_id);
CREATE INDEX idx_usage_records_created_at ON usage_records (created_at DESC);
CREATE INDEX idx_usage_records_key_created ON usage_records (key_id, created_at DESC);