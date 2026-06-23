import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Gateway } from "../src/client.js";
import {
  GatewayAuthError,
  GatewayBudgetError,
  GatewayConfigError,
  GatewayRateLimitError,
  GatewayUpstreamError,
} from "../src/errors.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const defaultHeaders: Record<string, string> = {
    "content-type": "application/json",
    "x-gateway-provider": "openai",
    "x-cache": "MISS",
    "x-request-id": "test-request-id",
    "x-gateway-latency-ms": "9",
    ...headers,
  };
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(defaultHeaders),
    json: () => Promise.resolve(body),
    body: null,
  });
}

const MESSAGES = [{ role: "user" as const, content: "Hello" }];

const RAW_SUCCESS = {
  id: "chatcmpl-abc123",
  object: "chat.completion",
  created: 1700000000,
  model: "gpt-4o",
  choices: [{ index: 0, message: { role: "assistant", content: "Hi there!" }, finish_reason: "stop", logprobs: null }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
};

// ─── Constructor ──────────────────────────────────────────────────────────────

describe("Gateway constructor", () => {
  it("throws GatewayConfigError when apiKey is missing", () => {
    delete process.env.LLMGATEWAY_API_KEY;
    expect(() => new Gateway()).toThrow(GatewayConfigError);
  });

  it("reads apiKey from env var", () => {
    process.env.LLMGATEWAY_API_KEY = "gw_live_test";
    expect(() => new Gateway()).not.toThrow();
    delete process.env.LLMGATEWAY_API_KEY;
  });
});

// ─── OpenAI provider shape ────────────────────────────────────────────────────

describe("chat() with provider=openai", () => {
  beforeEach(() => { vi.stubGlobal("fetch", mockFetch(200, RAW_SUCCESS)); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns OpenAI-shaped response", async () => {
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-openai-test" });
    const res = await gw.chat("openai", "gpt-4o", MESSAGES);

    expect(res.object).toBe("chat.completion");
    expect(res.choices[0].message.content).toBe("Hi there!");
    expect(res.choices[0].finish_reason).toBe("stop");
    expect(res.usage.prompt_tokens).toBe(10);
    expect(res.usage.completion_tokens).toBe(5);
    expect(res.usage.total_tokens).toBe(15);
    expect(res._gateway.provider).toBe("openai");
    expect(res._gateway.cached).toBe(false);
    expect(res._gateway.requestId).toBe("test-request-id");
    expect(res._gateway.gatewayLatencyMs).toBe(9);
  });
});

// ─── Anthropic provider shape ─────────────────────────────────────────────────

describe("chat() with provider=anthropic", () => {
  beforeEach(() => { vi.stubGlobal("fetch", mockFetch(200, RAW_SUCCESS)); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns Anthropic-shaped response", async () => {
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-ant-test" });
    const res = await gw.chat("anthropic", "claude-opus-4-6", MESSAGES);

    expect(res.type).toBe("message");
    expect(res.role).toBe("assistant");
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text).toBe("Hi there!");
    expect(res.stop_reason).toBe("end_turn");
    expect(res.usage.input_tokens).toBe(10);
    expect(res.usage.output_tokens).toBe(5);
    expect(res.usage.cache_creation_input_tokens).toBeNull();
    expect(res.usage.cache_read_input_tokens).toBeNull();
  });
});

// ─── Gemini provider shape ────────────────────────────────────────────────────

describe("chat() with provider=gemini", () => {
  beforeEach(() => { vi.stubGlobal("fetch", mockFetch(200, RAW_SUCCESS)); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns Gemini-shaped response", async () => {
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "AIza-test" });
    const res = await gw.chat("gemini", "gemini-2.5-pro", MESSAGES);

    expect(res.candidates[0].content.parts[0].text).toBe("Hi there!");
    expect(res.candidates[0].content.role).toBe("model");
    expect(res.candidates[0].finishReason).toBe("STOP");
    expect(res.usageMetadata.promptTokenCount).toBe(10);
    expect(res.usageMetadata.candidatesTokenCount).toBe(5);
    expect(res.usageMetadata.totalTokenCount).toBe(15);
    expect(res.modelVersion).toBe("gpt-4o");
  });
});

// ─── models() catalog ─────────────────────────────────────────────────────────

describe("models()", () => {
  const gw = new Gateway({ apiKey: "gw_live_test" });

  it("returns OpenAI models", () => {
    const models = gw.models("openai");
    expect(models).toContain("gpt-4o");
    expect(models).toContain("gpt-4o-mini");
    expect(models).toContain("o3");
  });

  it("returns Anthropic models", () => {
    const models = gw.models("anthropic");
    expect(models).toContain("claude-opus-4-6");
    expect(models).toContain("claude-sonnet-4-6");
    expect(models).toContain("claude-haiku-4-5");
  });

  it("returns Gemini models", () => {
    const models = gw.models("gemini");
    expect(models).toContain("gemini-2.5-pro");
    expect(models).toContain("gemini-2.5-flash");
    expect(models).toContain("gemini-1.5-pro");
  });
});

// ─── Per-request providerKey override ────────────────────────────────────────

describe("per-request providerKey override", () => {
  beforeEach(() => { vi.stubGlobal("fetch", mockFetch(200, RAW_SUCCESS)); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("sends override key as X-Provider-Key header", async () => {
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-default" });
    await gw.chat("openai", "gpt-4o", MESSAGES, { providerKey: "sk-override" });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init.headers as Record<string, string>)["X-Provider-Key"]).toBe("sk-override");
  });
});

// ─── Error mapping ────────────────────────────────────────────────────────────

describe("error handling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("401 → GatewayAuthError", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: "invalid key", code: "invalid_key" }));
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-test" });
    await expect(gw.chat("openai", "gpt-4o", MESSAGES)).rejects.toThrow(GatewayAuthError);
  });

  it("429 → GatewayRateLimitError with retryAfter", async () => {
    vi.stubGlobal("fetch", mockFetch(429, { error: "rate limited", code: "rate_limited", retry_after: 12 }));
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-test" });
    try {
      await gw.chat("openai", "gpt-4o", MESSAGES);
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayRateLimitError);
      expect((err as GatewayRateLimitError).retryAfter).toBe(12);
    }
  });

  it("402 → GatewayBudgetError with spent/limit", async () => {
    vi.stubGlobal("fetch", mockFetch(402, { error: "budget exceeded", code: "budget_exceeded", spent: 19.82, limit: 20.0 }));
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-test" });
    try {
      await gw.chat("openai", "gpt-4o", MESSAGES);
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayBudgetError);
      expect((err as GatewayBudgetError).spent).toBe(19.82);
      expect((err as GatewayBudgetError).limit).toBe(20.0);
    }
  });

  it("502 → GatewayUpstreamError", async () => {
    vi.stubGlobal("fetch", mockFetch(502, { error: "upstream error", code: "upstream_error", provider: "openai" }));
    const gw = new Gateway({ apiKey: "gw_live_test", providerKey: "sk-test" });
    try {
      await gw.chat("openai", "gpt-4o", MESSAGES);
    } catch (err) {
      expect(err).toBeInstanceOf(GatewayUpstreamError);
      expect((err as GatewayUpstreamError).provider).toBe("openai");
    }
  });
});
