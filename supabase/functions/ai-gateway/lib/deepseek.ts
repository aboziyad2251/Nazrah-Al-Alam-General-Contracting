/**
 * Thin wrapper around the DeepSeek Chat Completions API.
 * DeepSeek uses the OpenAI-compatible format, so this mirrors
 * the structure of anthropic.ts but targets api.deepseek.com.
 *
 * Models:
 *   deepseek-chat     — DeepSeek V3 (general chat + reasoning, low cost)
 *   deepseek-reasoner — DeepSeek R1 (chain-of-thought, higher accuracy)
 */

import type { StreamChunk } from './anthropic.ts';

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

function getKey(): string {
  const key = Deno.env.get('DEEPSEEK_API_KEY');
  if (!key) throw new Error('DEEPSEEK_API_KEY env var is not set');
  return key;
}

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

/**
 * One-shot (non-streaming) DeepSeek call.
 */
export async function callDeepSeek(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 4096,
  timeoutMs = 30_000
): Promise<DeepSeekResult> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${body}`);
  }

  const json = await res.json();
  const content = (json.choices?.[0]?.message?.content as string) ?? '';
  const tokensIn = (json.usage?.prompt_tokens as number) ?? 0;
  const tokensOut = (json.usage?.completion_tokens as number) ?? 0;

  return { content, tokensIn, tokensOut, model };
}

/**
 * Streaming DeepSeek call — yields text deltas then a final done chunk.
 * DeepSeek SSE format is OpenAI-compatible:
 *   data: {"choices":[{"delta":{"content":"..."},"finish_reason":null}]}
 *   data: [DONE]
 */
export async function* streamDeepSeek(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 4096,
  timeoutMs = 60_000
): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${body}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let tokensIn = 0;
  let tokensOut = 0;

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

        if (raw === '[DONE]') {
          yield { done: true, tokensIn, tokensOut };
          continue;
        }

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        // usage block (present when stream_options.include_usage = true)
        if (event.usage) {
          tokensIn = (event.usage as Record<string, number>).prompt_tokens ?? 0;
          tokensOut = (event.usage as Record<string, number>).completion_tokens ?? 0;
        }

        const choices = event.choices as Array<{
          delta?: { content?: string; reasoning_content?: string };
          finish_reason?: string;
        }>;
        if (!choices?.length) continue;

        const delta = choices[0].delta;
        // deepseek-reasoner emits reasoning_content before content
        const text = delta?.content ?? delta?.reasoning_content ?? '';
        if (text) yield { text };

        if (choices[0].finish_reason === 'stop' || choices[0].finish_reason === 'length') {
          yield { done: true, tokensIn, tokensOut };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
