/**
 * Minimal SSE parser that works in React Native (New Architecture / SDK 52+).
 *
 * React Native 0.76 exposes a WHATWG-compatible fetch with ReadableStream via JSI.
 * If ReadableStream is unavailable (old arch), falls back to XHR onprogress.
 */

export type SseEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'done';
      model: string;
      tokensIn: number;
      tokensOut: number;
      costUsd: number;
      latencyMs: number;
      usedFallback: boolean;
    }
  | { type: 'error'; message: string };

// ── Modern fetch-based streaming ─────────────────────────────────────────────
async function* fetchStream(url: string, init: RequestInit): AsyncGenerator<SseEvent> {
  const resp = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('ReadableStream unavailable');

  const dec = new TextDecoder();
  let buf = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          yield JSON.parse(payload) as SseEvent;
        } catch {
          /* skip malformed */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── XHR fallback (old architecture / no ReadableStream) ───────────────────────
function xhrStream(url: string, init: RequestInit): AsyncGenerator<SseEvent> {
  let resolve: ((v: IteratorResult<SseEvent>) => void) | null = null;
  const queue: SseEvent[] = [];
  let done = false;
  let lastLen = 0;

  const xhr = new XMLHttpRequest();
  xhr.open(init.method ?? 'POST', url, true);
  Object.entries(init.headers ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v as string));
  xhr.setRequestHeader('Accept', 'text/event-stream');

  const flush = (text: string) => {
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const ev = JSON.parse(line.slice(6)) as SseEvent;
        if (resolve) {
          const r = resolve;
          resolve = null;
          r({ value: ev, done: false });
        } else {
          queue.push(ev);
        }
      } catch {
        /* skip */
      }
    }
  };

  xhr.onprogress = () => {
    const chunk = xhr.responseText.slice(lastLen);
    lastLen = xhr.responseText.length;
    flush(chunk);
  };

  xhr.onloadend = () => {
    done = true;
    resolve?.({ value: undefined as unknown as SseEvent, done: true });
  };

  xhr.send(init.body as string);

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      if (queue.length) return Promise.resolve({ value: queue.shift()!, done: false });
      if (done) return Promise.resolve({ value: undefined as unknown as SseEvent, done: true });
      return new Promise<IteratorResult<SseEvent>>((r) => {
        resolve = r;
      });
    },
    return() {
      xhr.abort();
      return Promise.resolve({ value: undefined as unknown as SseEvent, done: true });
    },
    throw(e) {
      xhr.abort();
      return Promise.reject(e);
    },
  } as AsyncGenerator<SseEvent>;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function streamGateway(
  supabaseUrl: string,
  token: string,
  body: Record<string, unknown>
): AsyncGenerator<SseEvent> {
  const url = `${supabaseUrl}/functions/v1/ai-gateway`;
  const init: RequestInit = {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };

  // Prefer modern streaming; fall back to XHR if ReadableStream is absent
  if (typeof ReadableStream !== 'undefined') {
    return fetchStream(url, init);
  }
  return xhrStream(url, init);
}
