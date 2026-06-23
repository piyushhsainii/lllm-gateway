export { Gateway } from "./client.js";
export { toVercelChunk, formatVercelSSELine } from "./adapters.js";
export {
  GatewayError,
  GatewayAuthError,
  GatewayRateLimitError,
  GatewayBudgetError,
  GatewayUpstreamError,
  GatewayConfigError,
  GatewayTimeoutError,
} from "./errors.js";
export type {
  Provider,
  OpenAIModel,
  AnthropicModel,
  GeminiModel,
  ModelForProvider,
  AnyModel,
  Message,
  // OpenAI shapes
  OpenAIUsage,
  OpenAIChatResponse,
  OpenAIStreamChunk,
  // Anthropic shapes
  AnthropicUsage,
  AnthropicChatResponse,
  AnthropicStreamChunk,
  // Gemini shapes
  GeminiUsageMetadata,
  GeminiChatResponse,
  GeminiStreamChunk,
  // Generic mapped types
  ChatResponseForProvider,
  StreamChunkForProvider,
  // Gateway meta
  GatewayMeta,
  // Vercel AI SDK
  VercelAIChunk,
  // Options
  GatewayOptions,
  ChatOptions,
  StreamOptions,
} from "./types.js";
