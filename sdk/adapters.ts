import type {
  Provider,
  RawChatResponse,
  RawStreamChunk,
  GatewayMeta,
  OpenAIChatResponse,
  AnthropicChatResponse,
  GeminiChatResponse,
  OpenAIStreamChunk,
  AnthropicStreamChunk,
  GeminiStreamChunk,
  ChatResponseForProvider,
  StreamChunkForProvider,
  VercelAIChunk,
} from "./types.js";

// ─── Response adapters ────────────────────────────────────────────────────────

function toOpenAIResponse(raw: RawChatResponse, meta: GatewayMeta): OpenAIChatResponse {
  return {
    id: raw.id,
    object: "chat.completion",
    created: raw.created,
    model: raw.model,
    system_fingerprint: raw.system_fingerprint,
    choices: raw.choices.map((c) => ({
      index: c.index,
      message: { role: "assistant", content: c.message.content },
      finish_reason: (c.finish_reason ?? "stop") as OpenAIChatResponse["choices"][0]["finish_reason"],
      logprobs: null,
    })),
    usage: raw.usage,
    _gateway: meta,
  };
}

function toAnthropicResponse(raw: RawChatResponse, meta: GatewayMeta): AnthropicChatResponse {
  return {
    id: raw.id,
    type: "message",
    role: "assistant",
    model: raw.model,
    content: [{ type: "text", text: raw.choices[0]?.message?.content ?? "" }],
    stop_reason: mapFinishReasonToAnthropic(raw.choices[0]?.finish_reason ?? null),
    stop_sequence: null,
    usage: {
      input_tokens: raw.usage.prompt_tokens,
      output_tokens: raw.usage.completion_tokens,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
    },
    _gateway: meta,
  };
}

function toGeminiResponse(raw: RawChatResponse, meta: GatewayMeta): GeminiChatResponse {
  return {
    candidates: raw.choices.map((c) => ({
      content: {
        parts: [{ text: c.message.content }],
        role: "model",
      },
      finishReason: mapFinishReasonToGemini(c.finish_reason ?? null),
      index: c.index,
      safetyRatings: [],
    })),
    usageMetadata: {
      promptTokenCount: raw.usage.prompt_tokens,
      candidatesTokenCount: raw.usage.completion_tokens,
      totalTokenCount: raw.usage.total_tokens,
    },
    modelVersion: raw.model,
    _gateway: meta,
  };
}

export function adaptResponse<P extends Provider>(
  raw: RawChatResponse,
  provider: P,
  meta: GatewayMeta,
): ChatResponseForProvider<P> {
  switch (provider) {
    case "openai":
      return toOpenAIResponse(raw, meta) as ChatResponseForProvider<P>;
    case "anthropic":
      return toAnthropicResponse(raw, meta) as ChatResponseForProvider<P>;
    case "gemini":
      return toGeminiResponse(raw, meta) as ChatResponseForProvider<P>;
    default:
      return toOpenAIResponse(raw, meta) as ChatResponseForProvider<P>;
  }
}

// ─── Stream chunk adapters ────────────────────────────────────────────────────

function toOpenAIChunk(raw: RawStreamChunk, isFinal: boolean): OpenAIStreamChunk {
  return {
    id: raw.id,
    object: "chat.completion.chunk",
    created: raw.created,
    model: raw.model,
    choices: raw.choices.map((c) => ({
      index: c.index,
      delta: { role: c.delta.role as "assistant" | undefined, content: c.delta.content },
      finish_reason: (c.finish_reason ?? null) as OpenAIStreamChunk["choices"][0]["finish_reason"],
      logprobs: null,
    })),
    usage: isFinal && raw.usage ? raw.usage : null,
  };
}

function toAnthropicChunk(raw: RawStreamChunk, isFinal: boolean): AnthropicStreamChunk {
  const text = raw.choices[0]?.delta?.content ?? "";
  const finishReason = raw.choices[0]?.finish_reason;

  if (isFinal && finishReason) {
    return {
      type: "message_delta",
      delta: undefined,
      usage: raw.usage
        ? {
            input_tokens: raw.usage.prompt_tokens,
            output_tokens: raw.usage.completion_tokens,
            cache_creation_input_tokens: null,
            cache_read_input_tokens: null,
          }
        : undefined,
    };
  }

  return {
    type: "content_block_delta",
    index: raw.choices[0]?.index ?? 0,
    delta: { type: "text_delta", text },
  };
}

function toGeminiChunk(raw: RawStreamChunk, isFinal: boolean): GeminiStreamChunk {
  const text = raw.choices[0]?.delta?.content ?? "";
  const finishReason = raw.choices[0]?.finish_reason;

  return {
    candidates: [
      {
        content: { parts: [{ text }], role: "model" },
        finishReason: isFinal && finishReason
          ? mapFinishReasonToGemini(finishReason)
          : undefined,
        index: raw.choices[0]?.index ?? 0,
      },
    ],
    usageMetadata: isFinal && raw.usage
      ? {
          promptTokenCount: raw.usage.prompt_tokens,
          candidatesTokenCount: raw.usage.completion_tokens,
          totalTokenCount: raw.usage.total_tokens,
        }
      : undefined,
  };
}

export function adaptChunk<P extends Provider>(
  raw: RawStreamChunk,
  provider: P,
  isFinal: boolean,
): StreamChunkForProvider<P> {
  switch (provider) {
    case "openai":
      return toOpenAIChunk(raw, isFinal) as StreamChunkForProvider<P>;
    case "anthropic":
      return toAnthropicChunk(raw, isFinal) as StreamChunkForProvider<P>;
    case "gemini":
      return toGeminiChunk(raw, isFinal) as StreamChunkForProvider<P>;
    default:
      return toOpenAIChunk(raw, isFinal) as StreamChunkForProvider<P>;
  }
}

// ─── Vercel AI SDK adapter ────────────────────────────────────────────────────

/**
 * Converts any provider's stream chunk to Vercel AI SDK format.
 * Works regardless of which provider was used.
 */
export function toVercelChunk(
  chunk: OpenAIStreamChunk | AnthropicStreamChunk | GeminiStreamChunk,
): VercelAIChunk {
  // OpenAI chunk
  if ("object" in chunk && chunk.object === "chat.completion.chunk") {
    const c = chunk as OpenAIStreamChunk;
    const text = c.choices[0]?.delta?.content ?? "";
    const done = c.choices[0]?.finish_reason != null;
    if (done) {
      return {
        type: "finish",
        finishReason: "stop",
        usage: c.usage
          ? { promptTokens: c.usage.prompt_tokens, completionTokens: c.usage.completion_tokens }
          : undefined,
      };
    }
    return { type: "text-delta", textDelta: text };
  }

  // Anthropic chunk
  if ("type" in chunk) {
    const c = chunk as AnthropicStreamChunk;
    if (c.type === "content_block_delta" && c.delta) {
      return { type: "text-delta", textDelta: c.delta.text };
    }
    if (c.type === "message_delta") {
      return {
        type: "finish",
        finishReason: "stop",
        usage: c.usage
          ? { promptTokens: c.usage.input_tokens, completionTokens: c.usage.output_tokens }
          : undefined,
      };
    }
    return { type: "text-delta", textDelta: "" };
  }

  // Gemini chunk
  const c = chunk as GeminiStreamChunk;
  const text = c.candidates[0]?.content?.parts[0]?.text ?? "";
  const done = c.candidates[0]?.finishReason != null;
  if (done) {
    return {
      type: "finish",
      finishReason: "stop",
      usage: c.usageMetadata
        ? {
            promptTokens: c.usageMetadata.promptTokenCount,
            completionTokens: c.usageMetadata.candidatesTokenCount,
          }
        : undefined,
    };
  }
  return { type: "text-delta", textDelta: text };
}

export function formatVercelSSELine(chunk: VercelAIChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// ─── Finish reason maps ───────────────────────────────────────────────────────

function mapFinishReasonToAnthropic(
  reason: string | null,
): AnthropicChatResponse["stop_reason"] {
  switch (reason) {
    case "stop": return "end_turn";
    case "length": return "max_tokens";
    case "tool_calls": return "tool_use";
    case "content_filter": return "end_turn";
    default: return "end_turn";
  }
}

function mapFinishReasonToGemini(
  reason: string | null,
): GeminiChatResponse["candidates"][0]["finishReason"] {
  switch (reason) {
    case "stop": return "STOP";
    case "length": return "MAX_TOKENS";
    case "content_filter": return "SAFETY";
    default: return "STOP";
  }
}
