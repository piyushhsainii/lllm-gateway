CREATE TABLE monthly_rollups (
    key_id UUID NOT NULL REFERENCES api_keys(id),
    month TEXT NOT NULL,                   -- format: YYYY-MM
    total_spend_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    cache_hits INTEGER NOT NULL DEFAULT 0,
    fallback_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (key_id, month)
);

CREATE INDEX idx_monthly_rollups_key_id ON monthly_rollups (key_id);