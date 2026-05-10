/**
 * Thin wrapper around the Google Generative Language REST API.
 * Supports text-only and multimodal (image) requests plus streaming.
 *
 * Model name mapping (our routing key → Gemini API model string):
 *   gemini-2.5-flash → gemini-2.5-flash
 *   gemini-2.5-pro   → gemini-2.5-pro
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Internal model-ID map; update when Google renames preview IDs
const MODEL_IDS: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-pro': 'gemini-2.5-pro',
};

export interface GeminiImage {
  /** base64-encoded bytes of the image */
  data: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

export interface GeminiResult {
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
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY env var is not set');
  return key;
}

function resolveModel(model: string): string {
  return MODEL_IDS[model] ?? model;
}

function buildParts(text: string, images?: GeminiImage[]) {
  const parts: unknown[] = [];
  if (images?.length) {
    for (const img of images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }
  parts.push({ text });
  return parts;
}

/**
 * One-shot (non-streaming) Gemini call.
 * Pass `images` for multimodal tasks (site_photo_analysis).
 */
export async function callGemini(
  model: string,
  systemPrompt: string,
  userText: string,
  images?: GeminiImage[],
  timeoutMs = 20_000
): Promise<GeminiResult> {
  const apiModel = resolveModel(model);
  const key = getKey();
  const signal = AbortSignal.timeout(timeoutMs);

  const body = {
    contents: [
      {
        role: 'user',
        parts: buildParts(userText, images),
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  };

  const res = await fetch(`${GEMINI_BASE}/${apiModel}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const json = await res.json();

  // Error response from API (quota, safety, etc.)
  if (json.error) throw new Error(`Gemini API error: ${json.error.message}`);

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const tokensIn = json.usageMetadata?.promptTokenCount ?? 0;
  const tokensOut = json.usageMetadata?.candidatesTokenCount ?? 0;

  return { content, tokensIn, tokensOut, model };
}

/**
 * Streaming Gemini call — yields text deltas then a final
 * { done: true, tokensIn, tokensOut } chunk.
 *
 * Gemini's SSE stream sends full JSON objects (not diffs) for each
 * incremental candidate.  We extract the text part from each event
 * and yield it.  Usage metadata arrives in the final event.
 */
export async function* streamGemini(
  model: string,
  systemPrompt: string,
  userText: string,
  timeoutMs = 60_000
): AsyncGenerator<StreamChunk> {
  const apiModel = resolveModel(model);
  const key = getKey();
  const signal = AbortSignal.timeout(timeoutMs);

  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  };

  const res = await fetch(`${GEMINI_BASE}/${apiModel}:streamGenerateContent?alt=sse&key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastTokensIn = 0;
  let lastTokensOut = 0;

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

        if (event.error) throw new Error(`Gemini stream error: ${JSON.stringify(event.error)}`);

        const text = (event.candidates as any)?.[0]?.content?.parts?.[0]?.text as
          | string
          | undefined;
        if (text) yield { text };

        // usageMetadata is only non-zero in the final chunk
        const meta = event.usageMetadata as any;
        if (meta?.totalTokenCount) {
          lastTokensIn = meta.promptTokenCount ?? 0;
          lastTokensOut = meta.candidatesTokenCount ?? 0;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { done: true, tokensIn: lastTokensIn, tokensOut: lastTokensOut };
}
