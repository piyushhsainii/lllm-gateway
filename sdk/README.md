# ai-llmgateway

TypeScript/JavaScript SDK for [LLM Gateway](https://lllm-gateway.vercel.app/) — a fast Rust-powered LLM reverse proxy that gives you unified access to OpenAI, Anthropic, and Gemini with **budget control, usage tracking, and cost transparency** — built for AI agents and organizations.

Zero dependencies. Native fetch. Works in Node 18+, Edge, and browsers.

---

## What is LLM Gateway?

LLM Gateway sits between your application and LLM providers. Instead of calling OpenAI or Anthropic directly, you call the gateway — and it handles routing, cost tracking, budget enforcement, and observability across all your models in one place.

It's built for:

- **AI agents** that need to stay within a budget and not bleed costs unexpectedly
- **Organizations** that want centralized visibility into how models are being used across teams
- **Developers** who want a single unified API across OpenAI, Anthropic, and Gemini

---

## Hosted vs. Self-Hosted

### Hosted (production)

Sign up at **[lllm-gateway.vercel.app](https://lllm-gateway.vercel.app/)** to get your API key. No infrastructure setup needed.

```bash
LLMGATEWAY_API_KEY=gw_live_abc123           # from your dashboard at lllm-gateway.vercel.app
LLMGATEWAY_PROVIDER_KEY=sk-openai-xyz       # your OpenAI / Anthropic / Gemini key
LLMGATEWAY_BASE_URL=https://your-gateway.shuttle.app/v1
```

### Self-hosted (free, local or your own server)

Run the gateway yourself for free using the open source Rust server.

```bash
git clone https://github.com/piyushhsainii/lllm-gateway
cd lllm-gateway
cargo shuttle deploy
```

Full setup instructions: **[github.com/piyushhsainii/lllm-gateway](https://github.com/piyushhsainii/lllm-gateway)**

Then point the SDK at your local URL:

```bash
LLMGATEWAY_BASE_URL=http://localhost:8000/v1
```

---

## Install

```bash
npm install @piyushhsainii/llmgateway
# or
pnpm add @piyushhsainii/llmgateway
# or
yarn add @piyushhsainii/llmgateway
```

---

## Quick Start

```typescript
import { Gateway } from "@piyushhsainii/llmgateway";

const gw = new Gateway();
// reads LLMGATEWAY_API_KEY + LLMGATEWAY_PROVIDER_KEY from env

const res = await gw.chat("openai", "gpt-4o", [
  { role: "user", content: "Summarize today's tasks" },
]);

console.log(res.choices[0].message.content);
```

Pass `provider` first — the response shape matches that provider's native SDK exactly, so there's no new API to learn.

---

## OpenAI

```typescript
const res = await gw.chat("openai", "gpt-4o", [
  { role: "user", content: "Hello" },
]);

// Identical to the OpenAI Node SDK response shape
res.choices[0].message.content; // "Hi there!"
res.choices[0].finish_reason; // "stop"
res.usage.prompt_tokens;
res.usage.completion_tokens;
res.usage.total_tokens;

// Gateway metadata (extra fields not in the OpenAI SDK)
res._gateway.provider; // "openai"
res._gateway.cached; // true/false
res._gateway.requestId;
res._gateway.gatewayLatencyMs;
```

### Streaming

```typescript
for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
  process.stdout.write(chunk.choices[0].delta.content ?? "");

  if (chunk.choices[0].finish_reason === "stop") {
    console.log("\nTotal tokens used:", chunk.usage?.total_tokens);
  }
}
```

### Available models

```typescript
gw.models("openai");
// ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo",
//  "o1", "o1-mini", "o3", "o3-mini"]
```

---

## Anthropic

```typescript
const res = await gw.chat("anthropic", "claude-opus-4-6", [
  { role: "user", content: "Hello" },
]);

// Identical to the Anthropic Node SDK response shape
res.content[0].text; // "Hi there!"
res.stop_reason; // "end_turn"
res.usage.input_tokens;
res.usage.output_tokens;
res.usage.cache_read_input_tokens;
```

### Streaming

```typescript
for await (const chunk of gw.stream("anthropic", "claude-opus-4-6", messages)) {
  if (chunk.type === "content_block_delta") {
    process.stdout.write(chunk.delta.text);
  }
  if (chunk.type === "message_delta") {
    console.log("\nOutput tokens:", chunk.usage?.output_tokens);
  }
}
```

### Available models

```typescript
gw.models("anthropic");
// ["claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6",
//  "claude-haiku-4-5", "claude-haiku-4-5-20251001"]
```

---

## Gemini

```typescript
const res = await gw.chat("gemini", "gemini-2.5-pro", [
  { role: "user", content: "Hello" },
]);

// Identical to the Google Generative AI Node SDK response shape
res.candidates[0].content.parts[0].text; // "Hi there!"
res.candidates[0].finishReason; // "STOP"
res.usageMetadata.promptTokenCount;
res.usageMetadata.totalTokenCount;
```

### Streaming

```typescript
for await (const chunk of gw.stream("gemini", "gemini-2.5-pro", messages)) {
  process.stdout.write(chunk.candidates[0].content.parts[0].text);

  if (chunk.usageMetadata) {
    console.log("\nTotal tokens:", chunk.usageMetadata.totalTokenCount);
  }
}
```

### Available models

```typescript
gw.models("gemini");
// ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash",
//  "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"]
```

---

## Per-request provider keys (BYOK)

If your users supply their own provider keys (Bring Your Own Key), pass it per-request:

```typescript
const gw = new Gateway({ apiKey: "gw_live_abc123" });

await gw.chat("openai", "gpt-4o", messages, {
  providerKey: req.headers["x-user-provider-key"],
});
```

---

## Next.js — Route Handler (App Router)

> **Important:** Never use `Gateway` in a Client Component. Always call it from a Route Handler or Server Action.

### Streaming raw chunks

```typescript
// app/api/chat/route.ts
import { Gateway } from "@piyushhsainii/llmgateway";
import { NextRequest } from "next/server";

const gw = new Gateway();

export async function POST(req: NextRequest) {
  const { messages, model = "gpt-4o", provider = "openai" } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of gw.stream(provider, model, messages)) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

### Vercel AI SDK compatible (`useChat`)

```typescript
// app/api/chat/route.ts
import {
  Gateway,
  toVercelChunk,
  formatVercelSSELine,
} from "@piyushhsainii/llmgateway";
import { NextRequest } from "next/server";

const gw = new Gateway();

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
        controller.enqueue(
          encoder.encode(formatVercelSSELine(toVercelChunk(chunk))),
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

```typescript
// app/page.tsx
"use client";
import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({ api: "/api/chat" });

  return (
    <div>
      {messages.map((m) => <p key={m.id}>{m.content}</p>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

---

## Error handling

```typescript
import {
  GatewayAuthError,
  GatewayRateLimitError,
  GatewayBudgetError,
  GatewayUpstreamError,
  GatewayConfigError,
  GatewayTimeoutError,
} from "@piyushhsainii/llmgateway";

try {
  const res = await gw.chat("openai", "gpt-4o", messages);
} catch (err) {
  if (err instanceof GatewayAuthError) {
    // 401 — invalid or missing gateway API key
  } else if (err instanceof GatewayRateLimitError) {
    // 429 — rate limited; err.retryAfter is seconds to wait
    await new Promise((r) => setTimeout(r, err.retryAfter * 1000));
  } else if (err instanceof GatewayBudgetError) {
    // 402 — budget exceeded; err.spent and err.limit are in USD
    console.log(`Spent $${err.spent} of $${err.limit} budget`);
  } else if (err instanceof GatewayUpstreamError) {
    // 502/503 — provider failed; err.provider tells you which one
    console.log(`${err.provider} is currently unavailable`);
  } else if (err instanceof GatewayConfigError) {
    // Missing apiKey or providerKey in config
  } else if (err instanceof GatewayTimeoutError) {
    // Request exceeded the configured timeout
  }
}
```

---

## Self-hosting with Shuttle.rs

```bash
# Install Shuttle CLI
cargo install cargo-shuttle

# Login
cargo shuttle login

# Inside the llm-gateway Rust repo
cargo shuttle init --name llm-gateway

# Set your secrets
cargo shuttle secrets set DATABASE_URL postgresql://...
cargo shuttle secrets set ADMIN_KEY your_admin_key_here
cargo shuttle secrets set GATEWAY_ENCRYPTION_KEY your_32_byte_base64_key

# Deploy
cargo shuttle deploy
```

Your gateway URL will be `https://llm-gateway.shuttleapp.rs`. Set it as:

```bash
LLMGATEWAY_BASE_URL=https://llm-gateway.shuttleapp.rs/v1
```

Subsequent deploys: `cargo shuttle deploy`  
View logs: `cargo shuttle logs --follow`

---

## Links

- Dashboard & sign up: [lllm-gateway.vercel.app](https://lllm-gateway.vercel.app/)
- Gateway server (open source): [github.com/piyushhsainii/lllm-gateway](https://github.com/piyushhsainii/lllm-gateway)
- npm: [@piyushhsainii/llmgateway](https://www.npmjs.com/package/@piyushhsainii/llmgateway)
