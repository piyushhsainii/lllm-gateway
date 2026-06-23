import type { Provider, RawStreamChunk, StreamChunkForProvider } from "./types.js";
import { adaptChunk } from "./adapters.js";

/**
 * Parses a gateway SSE response and yields provider-shaped stream chunks.
 * Usage is captured from the second-to-last chunk and attached to the final chunk.
 * @internal
 */
export async function* parseSSEStream<P extends Provider>(
  response: Response,
  provider: P,
): AsyncGenerator<StreamChunkForProvider<P>> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pendingUsage: RawStreamChunk["usage"] | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;

      let raw: RawStreamChunk;
      try {
        raw = JSON.parse(data) as RawStreamChunk;
      } catch {
        continue;
      }

      // Capture usage — gateway sends it in the second-to-last chunk
      if (raw.usage) {
        pendingUsage = raw.usage;
      }

      const text = raw.choices[0]?.delta?.content ?? "";
      const isFinish = raw.choices[0]?.finish_reason != null;

      if (!text && !isFinish) continue;

      // On finish, attach pending usage to the raw chunk before adapting
      if (isFinish && pendingUsage) {
        raw = { ...raw, usage: pendingUsage };
      }

      yield adaptChunk(raw, provider, isFinish);
    }
  }
}
