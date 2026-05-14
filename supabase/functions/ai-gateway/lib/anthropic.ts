/**
 * Thin wrapper around the Anthropic Messages REST API.
 * Supports both one-shot calls and streaming (SSE) calls.
 * No third-party SDK — pure fetch so it works cleanly in Deno Edge.
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export interface AnthropicContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64' | 'url';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data?: string;
    url?: string;
  };
}

export interface AnthropicResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export interface StreamChunk {
  text?: string;
  tokensIn?: number;
  tokensOut?: number;
  done?: boolean;
}

function getKey(): string {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY env var is not set');
  return key;
}

function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getKey(),
    'anthropic-version': API_VERSION,
  };
}

/**
 * One-shot (non-streaming) Claude call.
 */
export async function callAnthropic(
  model: string,
  systemPrompt: string,
  messages: AnthropicMessage[],
  maxTokens = 4096,
  timeoutMs = 20_000
): Promise<AnthropicResult> {
  const signal = AbortSignal.timeout(timeoutMs);

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const json = await res.json();
  const content = json.content?.[0]?.text ?? '';
  const tokensIn = json.usage?.input_tokens ?? 0;
  const tokensOut = json.usage?.output_tokens ?? 0;

  return { content, tokensIn, tokensOut, model };
}

/**
 * Streaming Claude call — yields text deltas followed by a final
 * chunk with { done: true, tokensIn, tokensOut }.
 *
 * Parses the Anthropic SSE protocol:
 *   message_start  → extract input_tokens
 *   content_block_delta (text_delta) → yield text
 *   message_delta  → extract output_tokens
 */
export async function* streamAnthropic(
  model: string,
  systemPrompt: string,
  messages: AnthropicMessage[],
  maxTokens = 4096,
  timeoutMs = 60_000
): AsyncGenerator<StreamChunk> {
  const signal = AbortSignal.timeout(timeoutMs);

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let tokensIn = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        const type = event.type as string;

        if (type === 'message_start') {
          const msg = event.message as any;
          tokensIn = msg?.usage?.input_tokens ?? 0;
        }

        if (type === 'content_block_delta') {
          const delta = event.delta as any;
          if (delta?.type === 'text_delta' && delta.text) {
            yield { text: delta.text as string };
          }
        }

        if (type === 'message_delta') {
          const tokensOut = (event.usage as any)?.output_tokens ?? 0;
          yield { done: true, tokensIn, tokensOut };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
