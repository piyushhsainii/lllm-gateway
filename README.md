# LLM Gateway

A fast, open-source LLM reverse proxy built in Rust. Route requests to OpenAI, Anthropic, and Gemini through a single API — with budget enforcement, usage tracking, and cost visibility baked in.

**Hosted dashboard:** [lllm-gateway.vercel.app](https://lllm-gateway.vercel.app/)  
**npm SDK:** [@piyushhsainii/llmgateway](https://www.npmjs.com/package/@piyushhsainii/llmgateway)

<img width="1597" height="1028" alt="LLM_PROXY_HERO" src="https://github.com/user-attachments/assets/ede14c06-fa84-4428-ab42-a07c93e2320e" />

---

## What does it do?

LLM Gateway acts as a middleware layer between your application and LLM providers. Instead of calling OpenAI or Anthropic directly, you route requests through the gateway, which gives you:

- **Budget control** — set spending limits so AI agents or teams can't overrun costs
- **Usage tracking** — see exactly which models are being called, how often, and what they're costing
- **Unified API** — one endpoint for OpenAI, Anthropic, and Gemini; switch providers without changing your app code
- **Response caching** — cache identical requests to cut costs
- **Per-user provider keys** — let users bring their own API keys (BYOK) without touching your infrastructure
- **Typed SDK** — the TypeScript SDK returns responses in each provider's native shape, so there's no new response format to learn

---

## Who is it for?

**AI agent developers**
Agents can make hundreds of LLM calls autonomously. Without a budget ceiling, a single runaway agent can rack up unexpected bills. LLM Gateway lets you set hard limits so agents operate safely within defined cost boundaries.

**Organizations and teams**
When multiple developers, services, or teams share LLM access, it's hard to track who's spending what. LLM Gateway centralizes usage so you can see spend by team, project, or user — and enforce limits without managing separate API keys for everyone.

**Developers who use multiple providers**
Switching between OpenAI, Anthropic, and Gemini usually means rewriting response parsing. LLM Gateway returns responses in each provider's native SDK shape, so you can swap models without changing any downstream code.

---

## Getting started

### Option 1 — Hosted (no setup)

Sign up at [lllm-gateway.vercel.app](https://lllm-gateway.vercel.app/) to get your gateway API key, then install the SDK:

```bash
npm install @piyushhsainii/llmgateway
```

```typescript
import { Gateway } from "@piyushhsainii/llmgateway";

const gw = new Gateway({
  apiKey: "gw_live_abc123",        // from your dashboard
  providerKey: "sk-openai-xyz",    // your OpenAI / Anthropic / Gemini key
  baseUrl: "https://your-gateway.shuttle.app/v1",
});

const res = await gw.chat("openai", "gpt-4o", [
  { role: "user", content: "Hello!" },
]);

console.log(res.choices[0].message.content);
```

### Option 2 — Self-hosted (free)

Run the gateway locally or on your own server for free.

**Prerequisites:** Rust, Cargo, [Shuttle CLI](https://docs.shuttle.rs/getting-started/installation)

```bash
git clone https://github.com/piyushhsainii/lllm-gateway
cd lllm-gateway

# Set your secrets
cargo shuttle secrets set DATABASE_URL postgresql://...
cargo shuttle secrets set ADMIN_KEY your_admin_key_here
cargo shuttle secrets set GATEWAY_ENCRYPTION_KEY your_32_byte_base64_key

# Deploy to Shuttle
cargo shuttle deploy
```

Your gateway runs at `https://llm-gateway.shuttleapp.rs`. Point the SDK at it:

```bash
LLMGATEWAY_BASE_URL=https://llm-gateway.shuttleapp.rs/v1
```

Or run locally:

```bash
cargo run
# Gateway available at http://localhost:8000/v1
```

---

## SDK

The TypeScript/JavaScript SDK wraps the gateway API with full type safety and zero dependencies.

```bash
npm install @piyushhsainii/llmgateway
```

### OpenAI

```typescript
const res = await gw.chat("openai", "gpt-4o", messages);
res.choices[0].message.content;
res.usage.total_tokens;
```

### Anthropic

```typescript
const res = await gw.chat("anthropic", "claude-opus-4-6", messages);
res.content[0].text;
res.usage.input_tokens;
```

### Gemini

```typescript
const res = await gw.chat("gemini", "gemini-2.5-pro", messages);
res.candidates[0].content.parts[0].text;
res.usageMetadata.totalTokenCount;
```

### Streaming

All three providers support streaming with the same `gw.stream()` method:

```typescript
for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
  process.stdout.write(chunk.choices[0].delta.content ?? "");
}
```

Full SDK docs and examples: [npm/@piyushhsainii/llmgateway](https://www.npmjs.com/package/@piyushhsainii/llmgateway)

---

## Budget & usage tracking

LLM Gateway tracks every request and exposes spend data through the dashboard. You can set budget limits at the gateway level — when a limit is hit, the SDK throws a `GatewayBudgetError` with the amount spent and the configured cap.

```typescript
import { GatewayBudgetError } from "@piyushhsainii/llmgateway";

try {
  await gw.chat("openai", "gpt-4o", messages);
} catch (err) {
  if (err instanceof GatewayBudgetError) {
    console.log(`Budget hit: $${err.spent} of $${err.limit}`);
  }
}
```

---

## Architecture

```
Your App
    │
    ▼
LLM Gateway (Rust / Shuttle)
    ├── Auth & budget enforcement
    ├── Request routing
    ├── Usage logging
    ├── Response caching
    └── Provider adapters
         ├── OpenAI
         ├── Anthropic
         └── Gemini
```

---

## Deploying updates

```bash
cargo shuttle deploy          # redeploy after changes
cargo shuttle logs --follow   # tail logs
```

---

## Links

- Hosted dashboard: [lllm-gateway.vercel.app](https://lllm-gateway.vercel.app/)
- npm SDK: [@piyushhsainii/llmgateway](https://www.npmjs.com/package/@piyushhsainii/llmgateway)
- SDK docs: [github.com/piyushhsainii/lllm-gateway/sdk](https://github.com/piyushhsainii/lllm-gateway)

---

## License

MIT
