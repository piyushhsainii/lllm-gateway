import { describe, it, expect } from "vitest";
import { parseSSEStream } from "../src/streaming.js";
import { toVercelChunk } from "../src/adapters.js";
import type { OpenAIStreamChunk, AnthropicStreamChunk, GeminiStreamChunk } from "../src/types.js";

function makeSSEResponse(lines: string[]): Response {
  const body = lines.join("\n") + "\n";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

function sseChunk(content: string, finishReason: string | null = null) {
  return `data: ${JSON.stringify({
    id: "id1", model: "gpt-4o", created: 1700000000,
    choices: [{ index: 0, delta: { content }, finish_reason: finishReason, logprobs: null }],
  })}`;
}

function sseUsage() {
  return `data: ${JSON.stringify({
    id: "id1", model: "gpt-4o", created: 1700000000,
    choices: [{ index: 0, delta: {}, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  })}`;
}

// ─── OpenAI shaped chunks ─────────────────────────────────────────────────────

describe("parseSSEStream — openai", () => {
  it("yields OpenAI-shaped chunks", async () => {
    const response = makeSSEResponse([sseChunk("Hello"), sseUsage(), "data: [DONE]"]);
    const chunks: OpenAIStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "openai")) {
      chunks.push(chunk as OpenAIStreamChunk);
    }
    expect(chunks[0].object).toBe("chat.completion.chunk");
    expect(chunks[0].choices[0].delta.content).toBe("Hello");
    expect(chunks[0].usage).toBeNull();
  });

  it("final chunk has usage in OpenAI format", async () => {
    const response = makeSSEResponse([sseChunk("Hi"), sseUsage(), "data: [DONE]"]);
    const chunks: OpenAIStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "openai")) {
      chunks.push(chunk as OpenAIStreamChunk);
    }
    const last = chunks[chunks.length - 1];
    expect(last.usage?.prompt_tokens).toBe(10);
    expect(last.usage?.completion_tokens).toBe(5);
    expect(last.usage?.total_tokens).toBe(15);
  });
});

// ─── Anthropic shaped chunks ──────────────────────────────────────────────────

describe("parseSSEStream — anthropic", () => {
  it("yields content_block_delta chunks", async () => {
    const response = makeSSEResponse([sseChunk("Hello"), sseUsage(), "data: [DONE]"]);
    const chunks: AnthropicStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "anthropic")) {
      chunks.push(chunk as AnthropicStreamChunk);
    }
    const textChunk = chunks.find(c => c.type === "content_block_delta");
    expect(textChunk?.delta?.text).toBe("Hello");
  });

  it("final chunk is message_delta with Anthropic usage", async () => {
    const response = makeSSEResponse([sseChunk("Hi"), sseUsage(), "data: [DONE]"]);
    const chunks: AnthropicStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "anthropic")) {
      chunks.push(chunk as AnthropicStreamChunk);
    }
    const last = chunks[chunks.length - 1];
    expect(last.type).toBe("message_delta");
    expect(last.usage?.input_tokens).toBe(10);
    expect(last.usage?.output_tokens).toBe(5);
  });
});

// ─── Gemini shaped chunks ─────────────────────────────────────────────────────

describe("parseSSEStream — gemini", () => {
  it("yields Gemini-shaped chunks", async () => {
    const response = makeSSEResponse([sseChunk("Hello"), sseUsage(), "data: [DONE]"]);
    const chunks: GeminiStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "gemini")) {
      chunks.push(chunk as GeminiStreamChunk);
    }
    expect(chunks[0].candidates[0].content.parts[0].text).toBe("Hello");
    expect(chunks[0].candidates[0].content.role).toBe("model");
  });

  it("final chunk has Gemini usageMetadata", async () => {
    const response = makeSSEResponse([sseChunk("Hi"), sseUsage(), "data: [DONE]"]);
    const chunks: GeminiStreamChunk[] = [];
    for await (const chunk of parseSSEStream(response, "gemini")) {
      chunks.push(chunk as GeminiStreamChunk);
    }
    const last = chunks[chunks.length - 1];
    expect(last.usageMetadata?.promptTokenCount).toBe(10);
    expect(last.usageMetadata?.candidatesTokenCount).toBe(5);
    expect(last.usageMetadata?.totalTokenCount).toBe(15);
  });
});

// ─── Vercel AI SDK adapter ────────────────────────────────────────────────────

describe("toVercelChunk", () => {
  it("converts OpenAI text chunk", () => {
    const chunk: OpenAIStreamChunk = {
      id: "id1", object: "chat.completion.chunk", created: 1700000000, model: "gpt-4o",
      choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null, logprobs: null }],
      usage: null,
    };
    expect(toVercelChunk(chunk)).toEqual({ type: "text-delta", textDelta: "Hello" });
  });

  it("converts OpenAI finish chunk", () => {
    const chunk: OpenAIStreamChunk = {
      id: "id1", object: "chat.completion.chunk", created: 1700000000, model: "gpt-4o",
      choices: [{ index: 0, delta: {}, finish_reason: "stop", logprobs: null }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    expect(toVercelChunk(chunk)).toEqual({
      type: "finish", finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 5 },
    });
  });

  it("converts Anthropic content_block_delta chunk", () => {
    const chunk: AnthropicStreamChunk = {
      type: "content_block_delta", index: 0,
      delta: { type: "text_delta", text: "Hello" },
    };
    expect(toVercelChunk(chunk)).toEqual({ type: "text-delta", textDelta: "Hello" });
  });

  it("converts Gemini text chunk", () => {
    const chunk: GeminiStreamChunk = {
      candidates: [{ content: { parts: [{ text: "Hello" }], role: "model" }, index: 0 }],
    };
    expect(toVercelChunk(chunk)).toEqual({ type: "text-delta", textDelta: "Hello" });
  });
});
