/**
 * AI Gateway — Supabase Edge Function
 *
 * Routes requests to Anthropic Claude or Google Gemini based on task type.
 * Handles auth, rate limiting (Supabase-backed), streaming, fallback,
 * cost tracking, and audit logging.
 *
 * Tables used:
 *   ai_messages   — chat turn content (role + content) for the 'chat' task
 *   ai_usage_log  — cost/performance audit for every task (also the rate counter)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAnthropic, streamAnthropic } from './lib/anthropic.ts';
import { callGemini, streamGemini } from './lib/gemini.ts';
import { callDeepSeek, streamDeepSeek } from './lib/deepseek.ts';
import { buildSystemPrompt, buildUserMessage, type Task } from './prompts/system.ts';
import { checkRateLimit } from './lib/rateLimit.ts';
import { calculateCost } from './lib/pricing.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Locale = 'en' | 'ar';

interface GatewayRequest {
  task: Task;
  payload: Record<string, unknown>;
  user_id: string;
  locale?: Locale;
  /** bigint ID from ai_conversations (spec lists as uuid but DB uses bigint PK) */
  conversation_id?: number;
}

// ---------------------------------------------------------------------------
// Routing table  (updated per spec v2)
// ---------------------------------------------------------------------------

interface RouteConfig {
  provider: 'anthropic' | 'gemini' | 'deepseek';
  model: string;
  streaming: boolean;
  /** null = fail loud on primary error (no fallback) */
  fallbackModel: string | null;
}

const ROUTES: Record<Task, RouteConfig> = {
  // chat: DeepSeek V3 (fast, very cheap) → Claude Sonnet fallback
  chat: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    streaming: true,
    fallbackModel: 'claude-sonnet-4-6',
  },

  // quote_summary: DeepSeek R1 (chain-of-thought) → Sonnet fallback
  quote_summary: {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    streaming: true,
    fallbackModel: 'claude-sonnet-4-6',
  },

  // contract_draft: Claude Opus (legal accuracy) → DeepSeek R1 fallback
  contract_draft: {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    streaming: false,
    fallbackModel: 'deepseek-reasoner',
  },

  // site_photo_analysis: Claude Opus (vision) — DeepSeek has no vision API
  site_photo_analysis: {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    streaming: false,
    fallbackModel: null,
  },

  // classify_lead: DeepSeek V3 (fast/cheap) → Sonnet fallback
  classify_lead: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    streaming: false,
    fallbackModel: 'claude-sonnet-4-6',
  },

  // translate: DeepSeek V3 → Sonnet fallback
  translate: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    streaming: false,
    fallbackModel: 'claude-sonnet-4-6',
  },

  // recommend_equipment: DeepSeek V3 for reasoning → Sonnet fallback
  recommend_equipment: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    streaming: false,
    fallbackModel: 'claude-sonnet-4-6',
  },
};

const STREAMING_TASKS = new Set<Task>(['chat', 'quote_summary']);

// Role → hourly rate limit
const RATE_LIMITS: Record<string, number> = {
  super_admin: 500,
  admin: 500,
  dispatcher: 100,
  operator: 50,
  client: 30,
};
const DEFAULT_LIMIT = 30;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

function corsOk(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function err(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Input sanitization — strip prompt-injection patterns from string values
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS = [
  /ignore (all |previous |above |prior )?instructions?/gi,
  /you are now/gi,
  /disregard (all |your |previous )?/gi,
  /system (prompt|message|instruction)/gi,
  /jailbreak/gi,
  /<\|im_(start|end)\|>/gi,
];

function sanitizeString(value: string): string {
  let out = value.trim();
  for (const re of INJECTION_PATTERNS) out = out.replace(re, '[removed]');
  return out.slice(0, 8_000);
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string') {
      clean[k] = sanitizeString(v);
    } else if (Array.isArray(v)) {
      clean[k] = v.map((item) => (typeof item === 'string' ? sanitizeString(item) : item));
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function providerFor(model: string): 'anthropic' | 'gemini' | 'deepseek' {
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gemini')) return 'gemini';
  return 'deepseek';
}

type Db = ReturnType<typeof createClient>;

async function writeUsageLog(
  db: Db,
  row: {
    userId: string;
    conversationId?: number;
    task: Task;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    usedFallback: boolean;
  }
) {
  const { error } = await db.from('ai_usage_log').insert({
    user_id: row.userId,
    conversation_id: row.conversationId ?? null,
    task: row.task,
    model: row.model,
    tokens_in: row.tokensIn,
    tokens_out: row.tokensOut,
    cost_usd: row.costUsd,
    latency_ms: row.latencyMs,
    used_fallback: row.usedFallback,
  });
  if (error) console.error('[ai-gateway] usage log error:', error.message);
}

async function writeChatMessage(
  db: Db,
  conversationId: number,
  content: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number
) {
  const { error } = await db.from('ai_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content,
    model,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
  });
  if (error) console.error('[ai-gateway] chat message write error:', error.message);
}

// ---------------------------------------------------------------------------
// Non-streaming call — primary then optional fallback
// ---------------------------------------------------------------------------

async function callWithFallback(
  route: RouteConfig,
  systemPrompt: string,
  userText: string,
  payload: Record<string, unknown>
): Promise<{
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  usedFallback: boolean;
}> {
  const images = payload.images as { data: string; mimeType: string }[] | undefined;

  const callPrimary = async () => {
    if (route.provider === 'anthropic') {
      return callAnthropic(route.model, systemPrompt, [{ role: 'user', content: userText }]);
    }
    if (route.provider === 'deepseek') {
      return callDeepSeek(route.model, systemPrompt, [{ role: 'user', content: userText }]);
    }
    return callGemini(route.model, systemPrompt, userText, images as any);
  };

  try {
    const result = await callPrimary();
    return { ...result, usedFallback: false };
  } catch (primaryErr) {
    if (!route.fallbackModel) throw primaryErr;

    console.warn(
      `[ai-gateway] primary ${route.model} failed, using fallback ${route.fallbackModel}:`,
      primaryErr
    );

    const fbProvider = providerFor(route.fallbackModel);
    if (fbProvider === 'anthropic') {
      const result = await callAnthropic(route.fallbackModel, systemPrompt, [
        { role: 'user', content: userText },
      ]);
      return { ...result, model: route.fallbackModel, usedFallback: true };
    } else if (fbProvider === 'deepseek') {
      const result = await callDeepSeek(route.fallbackModel, systemPrompt, [
        { role: 'user', content: userText },
      ]);
      return { ...result, model: route.fallbackModel, usedFallback: true };
    } else {
      const result = await callGemini(route.fallbackModel, systemPrompt, userText);
      return { ...result, model: route.fallbackModel, usedFallback: true };
    }
  }
}

// ---------------------------------------------------------------------------
// Streaming response — SSE ReadableStream
// ---------------------------------------------------------------------------

function buildStreamResponse(
  route: RouteConfig,
  systemPrompt: string,
  userText: string,
  db: Db,
  meta: {
    userId: string;
    task: Task;
    conversationId?: number;
  },
  rateLimitRemaining: number
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      const startMs = Date.now();
      let tokensIn = 0;
      let tokensOut = 0;
      let model = route.model;
      let usedFallback = false;
      let fullText = '';

      const tryStream = async (useModel: string, useProvider: 'anthropic' | 'gemini' | 'deepseek') => {
        const gen =
          useProvider === 'anthropic'
            ? streamAnthropic(useModel, systemPrompt, [{ role: 'user', content: userText }])
            : useProvider === 'deepseek'
            ? streamDeepSeek(useModel, systemPrompt, [{ role: 'user', content: userText }])
            : streamGemini(useModel, systemPrompt, userText);

        for await (const chunk of gen) {
          if (chunk.done) {
            tokensIn = chunk.tokensIn ?? 0;
            tokensOut = chunk.tokensOut ?? 0;
          } else if (chunk.text) {
            fullText += chunk.text;
            enqueue({ type: 'delta', text: chunk.text });
          }
        }
      };

      try {
        await tryStream(route.model, route.provider);
      } catch (primaryErr) {
        if (!route.fallbackModel) {
          enqueue({ type: 'error', message: 'AI service unavailable' });
          controller.close();
          return;
        }
        console.warn(`[ai-gateway] stream primary failed; fallback → ${route.fallbackModel}`);
        usedFallback = true;
        model = route.fallbackModel;
        try {
          await tryStream(route.fallbackModel, providerFor(route.fallbackModel));
        } catch {
          enqueue({ type: 'error', message: 'AI service unavailable' });
          controller.close();
          return;
        }
      }

      const latencyMs = Date.now() - startMs;
      const costUsd = calculateCost(model, tokensIn, tokensOut);

      // Persist assistant turn for chat conversations
      if (meta.task === 'chat' && fullText && meta.conversationId) {
        writeChatMessage(
          db,
          meta.conversationId,
          fullText,
          model,
          tokensIn,
          tokensOut,
          costUsd
        ).catch(console.error);
      }

      // Write usage log (this also serves as the rate-limit increment)
      writeUsageLog(db, {
        userId: meta.userId,
        conversationId: meta.conversationId,
        task: meta.task,
        model,
        tokensIn,
        tokensOut,
        costUsd,
        latencyMs,
        usedFallback,
      }).catch(console.error);

      enqueue({ type: 'done', model, tokensIn, tokensOut, costUsd, latencyMs, usedFallback });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-RateLimit-Remaining': String(rateLimitRemaining - 1),
    },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return corsOk();
  if (req.method !== 'POST') return err('Method not allowed', 405);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return err('Missing Authorization header', 401);
  const jwt = authHeader.slice(7);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify JWT — user must be authenticated
  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: GatewayRequest;
  try {
    body = await req.json();
  } catch {
    return err('Invalid JSON body');
  }

  const { task, payload, user_id, locale = 'en', conversation_id } = body;

  // auth.uid() must match user_id in the request body
  if (user_id !== user.id) return err('user_id does not match token', 403);

  const validTasks: Task[] = [
    'chat',
    'quote_summary',
    'contract_draft',
    'site_photo_analysis',
    'classify_lead',
    'translate',
    'recommend_equipment',
  ];
  if (!validTasks.includes(task)) return err(`Unknown task: ${task}`);
  if (!payload || typeof payload !== 'object') return err('payload is required');

  // ── Profile + rate limit ──────────────────────────────────────────────────
  const db = createClient(supabaseUrl, serviceKey);

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();

  const role = (profile?.role as string) ?? 'client';
  const limit = RATE_LIMITS[role] ?? DEFAULT_LIMIT;

  // checkRateLimit counts ai_usage_log rows in the last hour via Supabase
  const rl = await checkRateLimit(db, user.id, limit);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded', resetAt: rl.resetAt }), {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rl.resetAt),
        'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
      },
    });
  }

  // ── Build prompts ─────────────────────────────────────────────────────────
  const cleanPayload = sanitizePayload(payload);
  const validLocale = locale === 'ar' ? 'ar' : 'en';
  const systemPrompt = buildSystemPrompt(task, validLocale);
  const userText = buildUserMessage(task, cleanPayload, validLocale);
  const route = ROUTES[task];

  // ── Streaming path ────────────────────────────────────────────────────────
  if (STREAMING_TASKS.has(task)) {
    return buildStreamResponse(
      route,
      systemPrompt,
      userText,
      db,
      { userId: user.id, task, conversationId: conversation_id },
      rl.remaining
    );
  }

  // ── Non-streaming path ────────────────────────────────────────────────────
  const startMs = Date.now();

  let result: {
    content: string;
    tokensIn: number;
    tokensOut: number;
    model: string;
    usedFallback: boolean;
  };
  try {
    result = await callWithFallback(route, systemPrompt, userText, cleanPayload);
  } catch (e) {
    console.error('[ai-gateway] all providers failed:', e);
    return err('AI service unavailable — please try again later', 503);
  }

  const latencyMs = Date.now() - startMs;
  const costUsd = calculateCost(result.model, result.tokensIn, result.tokensOut);

  // Write usage log — also serves as the rate-limit increment
  await writeUsageLog(db, {
    userId: user.id,
    conversationId: conversation_id,
    task,
    model: result.model,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd,
    latencyMs,
    usedFallback: result.usedFallback,
  });

  // Auto-parse JSON for classify_lead
  let responseContent: unknown = result.content;
  if (task === 'classify_lead') {
    try {
      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) responseContent = JSON.parse(match[0]);
    } catch {
      /* return raw string */
    }
  }

  return new Response(
    JSON.stringify({
      content: responseContent,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costUsd,
      latencyMs,
      usedFallback: result.usedFallback,
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(rl.remaining - 1),
        'X-RateLimit-Reset': String(rl.resetAt),
      },
    }
  );
});
