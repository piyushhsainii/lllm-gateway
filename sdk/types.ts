// ─── Provider & Model catalog ─────────────────────────────────────────────────

export type Provider = "openai" | "anthropic" | "gemini";

/** OpenAI models (gpt-* and o-series) */
export type OpenAIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4-turbo"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "o1"
  | "o1-mini"
  | "o3"
  | "o3-mini"
  | (string & {});

/** Anthropic Claude models */
export type AnthropicModel =
  | "claude-opus-4-8"
  | "claude-opus-4-7"
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "claude-haiku-4-5-20251001"
  | "claude-opus-4-5"
  | "claude-sonnet-4-5"
  | "claude-sonnet-4-5-20250929"
  | (string & {});

/** Google Gemini models */
export type GeminiModel =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | (string & {});

/** Model type resolved from provider */
export type ModelForProvider<P extends Provider> =
  P extends "openai" ? OpenAIModel :
  P extends "anthropic" ? AnthropicModel :
  P extends "gemini" ? GeminiModel :
  never;

/** All models across all providers */
export type AnyModel = OpenAIModel | AnthropicModel | GeminiModel;

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── OpenAI-shaped response (default, gateway native format) ──────────────────

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details?: {
    reasoning_tokens?: number;
    accepted_prediction_tokens?: number;
    rejected_prediction_tokens?: number;
  };
  prompt_tokens_details?: {
    cached_tokens?: number;
    audio_tokens?: number;
  };
}

export interface OpenAIChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
    logprobs: null;
  }>;
  usage: OpenAIUsage;
  system_fingerprint?: string;
  /** Gateway metadata */
  _gateway: GatewayMeta;
}

export interface OpenAIStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: "assistant"; content?: string };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
    logprobs: null;
  }>;
  usage: OpenAIUsage | null;
  /** Gateway metadata — only on final chunk */
  _gateway?: GatewayMeta;
}

// ─── Anthropic-shaped response ────────────────────────────────────────────────

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
}

export interface AnthropicChatResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
  /** Gateway metadata */
  _gateway: GatewayMeta;
}

export interface AnthropicStreamChunk {
  type:
    | "message_start"
    | "content_block_start"
    | "content_block_delta"
    | "content_block_stop"
    | "message_delta"
    | "message_stop";
  index?: number;
  delta?: { type: "text_delta"; text: string };
  usage?: AnthropicUsage;
  message?: Omit<AnthropicChatResponse, "_gateway">;
  /** Gateway metadata — only on message_stop */
  _gateway?: GatewayMeta;
}

// ─── Gemini-shaped response ───────────────────────────────────────────────────

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  cachedContentTokenCount?: number;
}

export interface GeminiChatResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }>; role: "model" };
    finishReason: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
    index: number;
    safetyRatings: Array<{ category: string; probability: string }>;
  }>;
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
  /** Gateway metadata */
  _gateway: GatewayMeta;
}

export interface GeminiStreamChunk {
  candidates: Array<{
    content: { parts: Array<{ text: string }>; role: "model" };
    finishReason?: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
    index: number;
  }>;
  usageMetadata?: GeminiUsageMetadata;
  /** Gateway metadata — only on final chunk */
  _gateway?: GatewayMeta;
}

// ─── Gateway metadata (attached to all responses) ─────────────────────────────

export interface GatewayMeta {
  requestId: string;
  provider: Provider;
  cached: boolean;
  gatewayLatencyMs: number;
}

// ─── Provider-mapped response types ──────────────────────────────────────────

export type ChatResponseForProvider<P extends Provider> =
  P extends "openai" ? OpenAIChatResponse :
  P extends "anthropic" ? AnthropicChatResponse :
  P extends "gemini" ? GeminiChatResponse :
  never;

export type StreamChunkForProvider<P extends Provider> =
  P extends "openai" ? OpenAIStreamChunk :
  P extends "anthropic" ? AnthropicStreamChunk :
  P extends "gemini" ? GeminiStreamChunk :
  never;

// ─── Vercel AI SDK compat ─────────────────────────────────────────────────────

export interface VercelAIChunk {
  type: "text-delta" | "finish";
  textDelta?: string;
  finishReason?: "stop" | "length" | "error";
  usage?: { promptTokens: number; completionTokens: number };
}

// ─── Client options ───────────────────────────────────────────────────────────

export interface GatewayOptions {
  apiKey?: string;
  providerKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ChatOptions {
  /** Per-request provider key override (BYOK per-user) */
  providerKey?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  response_format?: unknown;
  seed?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  [key: string]: unknown;
}

export type StreamOptions = ChatOptions;

// ─── Internal raw shapes ──────────────────────────────────────────────────────

/** @internal */
export interface RawChatResponse {
  id: string;
  model: string;
  created: number;
  system_fingerprint?: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
    logprobs: null;
  }>;
  usage: OpenAIUsage;
}

/** @internal */
export interface RawStreamChunk {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
    logprobs: null;
  }>;
  usage?: OpenAIUsage;
}

/** @internal */
export interface GatewayErrorBody {
  error: string;
  code: string;
  retry_after?: number;
  spent?: number;
  limit?: number;
  provider?: string;
}
