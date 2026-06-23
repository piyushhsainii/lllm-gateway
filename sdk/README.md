# llmgateway

TypeScript/JavaScript SDK for [llm-gateway](https://github.com/your-org/llm-gateway) — a fast Rust LLM reverse proxy supporting OpenAI, Anthropic, and Gemini.

Zero dependencies. Native fetch. Node 18+.

---

## Install

```bash
npm install llmgateway
# or
pnpm add llmgateway
# or
yarn add llmgateway
```

---

## Environment variables

```bash
LLMGATEWAY_API_KEY=gw_live_abc123           # your gateway key
LLMGATEWAY_PROVIDER_KEY=sk-openai-xyz       # your provider key (OpenAI / Anthropic / Gemini)
LLMGATEWAY_BASE_URL=https://your-gateway.shuttle.app/v1  # optional
```

---

## Quick start

Pass `provider` first — the response shape matches that provider's SDK exactly.

```typescript
import { Gateway } from "llmgateway";

const gw = new Gateway();
// reads LLMGATEWAY_API_KEY + LLMGATEWAY_PROVIDER_KEY from env
```

---

## OpenAI

Response fields match the [OpenAI Node SDK](https://github.com/openai/openai-node) exactly.

```typescript
const res = await gw.chat("openai", "gpt-4o", [
  { role: "user", content: "Hello" },
]);

// Same fields as OpenAI SDK
res.id;
res.object;                           // "chat.completion"
res.choices[0].message.content;       // "Hi there!"
res.choices[0].finish_reason;         // "stop"
res.usage.prompt_tokens;
res.usage.completion_tokens;
res.usage.total_tokens;

// Gateway metadata (extra, not in OpenAI SDK)
res._gateway.provider;                // "openai"
res._gateway.cached;                  // false
res._gateway.requestId;
res._gateway.gatewayLatencyMs;
```

### OpenAI streaming

```typescript
for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
  // Same shape as OpenAI streaming SDK
  process.stdout.write(chunk.choices[0].delta.content ?? "");

  if (chunk.choices[0].finish_reason === "stop") {
    console.log("\nTokens:", chunk.usage?.total_tokens);
  }
}
```

### OpenAI models

```typescript
gw.models("openai");
// ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "o1", "o1-mini", "o3", "o3-mini"]
```

---

## Anthropic

Response fields match the [Anthropic Node SDK](https://github.com/anthropics/anthropic-sdk-typescript) exactly.

```typescript
const res = await gw.chat("anthropic", "claude-opus-4-6", [
  { role: "user", content: "Hello" },
]);

// Same fields as Anthropic SDK
res.id;
res.type;                             // "message"
res.role;                             // "assistant"
res.content[0].type;                  // "text"
res.content[0].text;                  // "Hi there!"
res.stop_reason;                      // "end_turn"
res.stop_sequence;                    // null
res.usage.input_tokens;
res.usage.output_tokens;
res.usage.cache_creation_input_tokens;
res.usage.cache_read_input_tokens;
```

### Anthropic streaming

```typescript
for await (const chunk of gw.stream("anthropic", "claude-opus-4-6", messages)) {
  // Same shape as Anthropic streaming SDK
  if (chunk.type === "content_block_delta") {
    process.stdout.write(chunk.delta.text);
  }
  if (chunk.type === "message_delta") {
    console.log("\nOutput tokens:", chunk.usage?.output_tokens);
  }
}
```

### Anthropic models

```typescript
gw.models("anthropic");
// ["claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6",
//  "claude-haiku-4-5", "claude-haiku-4-5-20251001", "claude-opus-4-5",
//  "claude-sonnet-4-5", "claude-sonnet-4-5-20250929"]
```

---

## Gemini

Response fields match the [Google Generative AI Node SDK](https://github.com/google-gemini/generative-ai-js) exactly.

```typescript
const res = await gw.chat("gemini", "gemini-2.5-pro", [
  { role: "user", content: "Hello" },
]);

// Same fields as Gemini SDK
res.candidates[0].content.parts[0].text;   // "Hi there!"
res.candidates[0].content.role;             // "model"
res.candidates[0].finishReason;             // "STOP"
res.usageMetadata.promptTokenCount;
res.usageMetadata.candidatesTokenCount;
res.usageMetadata.totalTokenCount;
res.modelVersion;
```

### Gemini streaming

```typescript
for await (const chunk of gw.stream("gemini", "gemini-2.5-pro", messages)) {
  // Same shape as Gemini streaming SDK
  process.stdout.write(chunk.candidates[0].content.parts[0].text);

  if (chunk.usageMetadata) {
    console.log("\nTotal tokens:", chunk.usageMetadata.totalTokenCount);
  }
}
```

### Gemini models

```typescript
gw.models("gemini");
// ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash",
//  "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"]
```

---

## Per-request provider key (BYOK per user)

If your users supply their own provider keys:

```typescript
const gw = new Gateway({ apiKey: "gw_live_abc123" });

await gw.chat("openai", "gpt-4o", messages, {
  providerKey: req.headers["x-user-provider-key"],
});
```

---

## Next.js — Route Handler (App Router)

**Never import `Gateway` in a Client Component.** Always use from a Route Handler or Server Action.

### Raw chunks

```typescript
// app/api/chat/route.ts
import { Gateway } from "llmgateway";
import { NextRequest } from "next/server";

const gw = new Gateway();

export async function POST(req: NextRequest) {
  const { messages, model = "gpt-4o", provider = "openai" } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of gw.stream(provider, model, messages)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
```

### Vercel AI SDK compatible (`useChat` hook)

```typescript
// app/api/chat/route.ts
import { Gateway, toVercelChunk, formatVercelSSELine } from "llmgateway";
import { NextRequest } from "next/server";

const gw = new Gateway();

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
        controller.enqueue(encoder.encode(formatVercelSSELine(toVercelChunk(chunk))));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
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
} from "llmgateway";

try {
  const res = await gw.chat("openai", "gpt-4o", messages);
} catch (err) {
  if (err instanceof GatewayAuthError) {
    // 401 — invalid or missing gateway key
  } else if (err instanceof GatewayRateLimitError) {
    // 429 — err.retryAfter is seconds to wait
    await new Promise(r => setTimeout(r, err.retryAfter * 1000));
  } else if (err instanceof GatewayBudgetError) {
    // 402 — err.spent and err.limit in USD
    console.log(`Spent $${err.spent} of $${err.limit}`);
  } else if (err instanceof GatewayUpstreamError) {
    // 502/503 — err.provider is which provider failed
  } else if (err instanceof GatewayConfigError) {
    // missing apiKey or providerKey
  } else if (err instanceof GatewayTimeoutError) {
    // request exceeded timeout
  }
}
```

---

## Deploying the gateway (Shuttle.rs)

### First deploy

```bash
# Install Shuttle CLI
cargo install cargo-shuttle

# Login
cargo shuttle login

# Inside your llm-gateway Rust repo
cargo shuttle init --name llm-gateway

# Set secrets
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

### Redeploy after changes

```bash
cargo shuttle deploy
```

### Logs

```bash
cargo shuttle logs --follow
```

---

## Publishing to npm

```bash
npm run build
npm pack --dry-run    # verify what gets published
npm publish --access public
```

Scoped package:

```bash
# change "name" in package.json to "@your-org/llmgateway"
npm publish --access public
```

---

## Running tests

```bash
npm install
npm test
```
