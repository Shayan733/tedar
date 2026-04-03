// TEDAR — Streaming utilities for Server-Sent Events
// Server: createStreamResponse — wraps an async handler into an SSE Response
// Client: readStream — reads an SSE Response and calls onEvent for each event

export type StreamEvent =
  | { type: 'progress'; message: string }
  | { type: 'result'; data: unknown }
  | { type: 'error'; message: string };

type SendFn = (event: StreamEvent) => void;
type StreamHandler = (send: SendFn) => Promise<void>;

// Server-side: wrap an async handler into a streaming SSE Response.
// Returns immediately with headers — the handler runs inside the stream.
export function createStreamResponse(handler: StreamHandler): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (event) => {
        const line = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        await handler(send);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Client-side: read a fetch Response as an SSE stream.
// Calls onEvent for each parsed event. Resolves when the stream closes.
export async function readStream(
  response: Response,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.trim();
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6)) as StreamEvent;
            onEvent(parsed);
          } catch {
            // skip malformed events
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
