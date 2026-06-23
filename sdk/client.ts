import { raiseForStatus, GatewayConfigError, GatewayTimeoutError } from "./errors.js";
import { parseSSEStream } from "./streaming.js";
import { adaptResponse } from "./adapters.js";
import type {
  Provider,
  ModelForProvider,
  GatewayOptions,
  ChatOptions,
  StreamOptions,
  ChatResponseForProvider,
  StreamChunkForProvider,
  RawChatResponse,
  GatewayMeta,
  Message,
} from "./types.js";

function extractMeta(headers: Headers): GatewayMeta {
  return {
    requestId: headers.get("x-request-id") ?? "",
    provider: (headers.get("x-gateway-provider") ?? "openai") as Provider,
    cached: headers.get("x-cache") === "HIT",
    gatewayLatencyMs: parseInt(headers.get("x-gateway-latency-ms") ?? "0", 10),
  };
}

export class Gateway {
  private readonly apiKey: string;
  private readonly providerKey: string | undefined;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: GatewayOptions = {}) {
    const apiKey =
      options.apiKey ??
      (typeof process !== "undefined" ? process.env.LLMGATEWAY_API_KEY : undefined);
    if (!apiKey) {
      throw new GatewayConfigError(
        "apiKey is required. Pass it as an option or set LLMGATEWAY_API_KEY.",
      );
    }
    this.apiKey = apiKey;
    this.providerKey =
      options.providerKey ??
      (typeof process !== "undefined" ? process.env.LLMGATEWAY_PROVIDER_KEY : undefined);
    this.baseUrl =
      options.baseUrl ??
      (typeof process !== "undefined" ? process.env.LLMGATEWAY_BASE_URL : undefined) ??
      "https://your-gateway.shuttle.app/v1";
    this.timeout = options.timeout ?? 300_000;
  }

  private resolveProviderKey(perRequestKey?: string): string {
    const key = perRequestKey ?? this.providerKey;
    if (!key) {
      throw new GatewayConfigError(
        "providerKey is required. Pass it as an option or set LLMGATEWAY_PROVIDER_KEY.",
      );
    }
    return key;
  }

  private buildHeaders(providerKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "X-Provider-Key": providerKey,
      "Content-Type": "application/json",
    };
  }

  private buildBody(
    model: string,
    messages: Message[],
    options: ChatOptions,
    stream: boolean,
  ): string {
    const { providerKey, ...rest } = options;
    void providerKey;
    return JSON.stringify({ model, messages, stream, ...rest });
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw new GatewayTimeoutError();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Send a non-streaming chat request.
   *
   * Pass `provider` to get a response shaped exactly like that provider's SDK.
   *
   * @example — OpenAI shape (default)
   * const res = await gw.chat("openai", "gpt-4o", messages)
   * res.choices[0].message.content
   * res.usage.prompt_tokens
   *
   * @example — Anthropic shape
   * const res = await gw.chat("anthropic", "claude-opus-4-6", messages)
   * res.content[0].text
   * res.usage.input_tokens
   * res.stop_reason // "end_turn"
   *
   * @example — Gemini shape
   * const res = await gw.chat("gemini", "gemini-2.5-pro", messages)
   * res.candidates[0].content.parts[0].text
   * res.usageMetadata.promptTokenCount
   */
  async chat<P extends Provider>(
    provider: P,
    model: ModelForProvider<P>,
    messages: Message[],
    options: ChatOptions = {},
  ): Promise<ChatResponseForProvider<P>> {
    const providerKey = this.resolveProviderKey(options.providerKey);
    const url = `${this.baseUrl}/chat/completions`;

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: this.buildHeaders(providerKey),
      body: this.buildBody(model, messages, options, false),
    });

    if (!response.ok) await raiseForStatus(response);

    const raw = (await response.json()) as RawChatResponse;
    const meta = extractMeta(response.headers);
    return adaptResponse(raw, provider, meta);
  }

  /**
   * Send a streaming chat request. Yields chunks shaped exactly like that provider's SDK.
   *
   * @example — OpenAI shape
   * for await (const chunk of gw.stream("openai", "gpt-4o", messages)) {
   *   process.stdout.write(chunk.choices[0].delta.content ?? "")
   *   if (chunk.usage) console.log(chunk.usage.total_tokens)
   * }
   *
   * @example — Anthropic shape
   * for await (const chunk of gw.stream("anthropic", "claude-opus-4-6", messages)) {
   *   if (chunk.type === "content_block_delta") process.stdout.write(chunk.delta.text)
   *   if (chunk.type === "message_delta") console.log(chunk.usage?.output_tokens)
   * }
   *
   * @example — Gemini shape
   * for await (const chunk of gw.stream("gemini", "gemini-2.5-pro", messages)) {
   *   process.stdout.write(chunk.candidates[0].content.parts[0].text)
   *   if (chunk.usageMetadata) console.log(chunk.usageMetadata.totalTokenCount)
   * }
   */
  async *stream<P extends Provider>(
    provider: P,
    model: ModelForProvider<P>,
    messages: Message[],
    options: StreamOptions = {},
  ): AsyncGenerator<StreamChunkForProvider<P>> {
    const providerKey = this.resolveProviderKey(options.providerKey);
    const url = `${this.baseUrl}/chat/completions`;

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: this.buildHeaders(providerKey),
      body: this.buildBody(model, messages, options, true),
    });

    if (!response.ok) await raiseForStatus(response);

    yield* parseSSEStream(response, provider);
  }

  /**
   * Returns all supported models for a given provider.
   */
  models<P extends Provider>(provider: P): readonly ModelForProvider<P>[] {
    const catalog: Record<Provider, readonly string[]> = {
      openai: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
        "o1",
        "o1-mini",
        "o3",
        "o3-mini",
      ],
      anthropic: [
        "claude-opus-4-8",
        "claude-opus-4-7",
        "claude-opus-4-6",
        "claude-sonnet-4-6",
        "claude-haiku-4-5",
        "claude-haiku-4-5-20251001",
        "claude-opus-4-5",
        "claude-sonnet-4-5",
        "claude-sonnet-4-5-20250929",
      ],
      gemini: [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
      ],
    };
    return catalog[provider] as readonly ModelForProvider<P>[];
  }
}
