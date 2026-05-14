# AI Gateway — Supabase Edge Function

Routes AI requests for Nazrah Al Alam to Anthropic Claude or Google Gemini
based on task type, with streaming, cost tracking, Supabase-backed rate limiting,
and audit logging.

---

## Architecture

```
Client (portal / admin)
  │  POST /functions/v1/ai-gateway
  │  Authorization: Bearer <user-jwt>
  │  { task, payload, user_id, locale, conversation_id? }
  ▼
index.ts
  ├─ Auth        — verify JWT, match user_id to auth.uid()
  ├─ Rate limit  — Supabase: count ai_usage_log rows in last 1 hr
  ├─ Sanitize    — strip prompt-injection patterns
  ├─ Route       — pick model + provider from ROUTES table
  │
  ├─ Streaming (SSE)         → chat, quote_summary
  │    ReadableStream text/event-stream
  │
  └─ Non-streaming (JSON)    → all other tasks
       Primary → Fallback on error/timeout
       ai_usage_log insert serves as the rate-limit counter
```

### Task routing table

| Task                  | Primary model     | Provider  | Streaming | Fallback          |
| --------------------- | ----------------- | --------- | --------- | ----------------- |
| `chat`                | gemini-2.5-flash  | Google    | yes       | claude-sonnet-4-6 |
| `quote_summary`       | claude-opus-4-7   | Anthropic | yes       | claude-sonnet-4-6 |
| `contract_draft`      | claude-opus-4-7   | Anthropic | no        | none (fail loud)  |
| `site_photo_analysis` | gemini-2.5-pro    | Google    | no        | claude-opus-4-7   |
| `classify_lead`       | gemini-2.5-flash  | Google    | no        | claude-sonnet-4-6 |
| `translate`           | gemini-2.5-flash  | Google    | no        | claude-sonnet-4-6 |
| `recommend_equipment` | claude-sonnet-4-6 | Anthropic | no        | gemini-2.5-pro    |

### Rate limits (per hour, via Supabase)

| Role                    | Requests/hr |
| ----------------------- | ----------- |
| `admin` / `super_admin` | 500         |
| `dispatcher`            | 100         |
| `operator`              | 50          |
| `client`                | 30          |

Rate limiting reads `ai_usage_log` (`WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour'`).
The `ai_usage_log` insert that happens after every successful call doubles as the counter increment —
no separate table or Deno KV needed.

---

## File structure

```
supabase/functions/ai-gateway/
  index.ts               ← router + handler
  lib/
    anthropic.ts         ← Claude REST wrapper (streaming + non-streaming)
    gemini.ts            ← Gemini REST wrapper (streaming + non-streaming, multimodal)
    pricing.ts           ← token cost table + calculateCost()
    rateLimit.ts         ← Supabase-backed 1-hr sliding window
  prompts/
    system.ts            ← bilingual system prompts + buildSystemPrompt/buildUserMessage
  README.md
```

---

## Setup

### 1 — Set secrets

```bash
supabase secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  GEMINI_API_KEY="AIza..."
```

Verify:

```bash
supabase secrets list
```

### 2 — Deploy

```bash
supabase functions deploy ai-gateway --no-verify-jwt
```

> `--no-verify-jwt` is used because the function validates the JWT itself and
> cross-checks `user_id` in the request body against `auth.uid()`.

### 3 — Database tables

Run migrations if not yet applied:

```bash
supabase db push
```

The function requires two tables (created by existing migrations):

**`ai_messages`** (init migration) — chat turn storage:

```sql
-- conversation_id bigint FK → ai_conversations
-- role            message_role enum (user | assistant | system)
-- content         text
-- model, tokens_in, tokens_out, cost_usd
```

**`ai_usage_log`** (migration 20260507000000) — cost audit + rate counter:

```sql
-- user_id, conversation_id, task, model
-- tokens_in, tokens_out, cost_usd, latency_ms, used_fallback
```

---

## API reference

### Request

```
POST /functions/v1/ai-gateway
Authorization: Bearer <supabase-user-jwt>
Content-Type: application/json
```

```jsonc
{
  "task":            "chat",         // required — see routing table
  "payload":         { ... },        // task-specific shape (see below)
  "user_id":         "<uuid>",       // must match JWT subject (auth.uid())
  "locale":          "en",           // "en" | "ar"  (default "en")
  "conversation_id": 42              // optional bigint — groups messages in ai_messages
}
```

### Payload shapes per task

```jsonc
// chat
{ "message": "...", "history": [{"role":"user","content":"..."}] }

// quote_summary
{ "items": [...], "client": "...", "project": "..." }

// contract_draft
{ "client": "...", "project": "...", "value": 0, "duration": "..." }

// site_photo_analysis
{ "notes": "...", "images": [{ "data": "<base64>", "mimeType": "image/jpeg" }] }

// classify_lead
{ "name": "...", "company": "...", "message": "...", "budget": "...", "timeline": "..." }

// translate
{ "text": "...", "from": "en", "to": "ar" }

// recommend_equipment
{ "project": "...", "duration": "...", "terrain": "...", "budget": "..." }
```

### Non-streaming response (JSON)

```jsonc
{
  "content": "...", // string (or parsed object for classify_lead)
  "model": "gemini-2.5-flash",
  "tokensIn": 120,
  "tokensOut": 430,
  "costUsd": 0.0000518,
  "latencyMs": 840,
  "usedFallback": false,
}
```

Response headers on every non-streaming response:

```
X-RateLimit-Limit:     30
X-RateLimit-Remaining: 27
X-RateLimit-Reset:     1746662400000
```

### Streaming response (SSE)

Tasks `chat` and `quote_summary` return `Content-Type: text/event-stream`.
Each line is a JSON object on a `data:` line:

```
data: {"type":"delta","text":"Here "}

data: {"type":"delta","text":"is your quote summary…"}

data: {"type":"done","model":"claude-opus-4-7","tokensIn":98,"tokensOut":650,"costUsd":0.0588,"latencyMs":3800,"usedFallback":false}
```

Error event (primary + fallback both failed):

```
data: {"type":"error","message":"AI service unavailable"}
```

---

## cURL examples

### Chat (streaming — Gemini Flash primary)

```bash
curl -N https://<project-ref>.supabase.co/functions/v1/ai-gateway \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "task":    "chat",
    "payload": {"message":"What excavators do you have available?"},
    "user_id": "'"$USER_ID"'",
    "locale":  "en"
  }'
```

### Quote summary (streaming — Claude Opus primary)

```bash
curl -N https://<project-ref>.supabase.co/functions/v1/ai-gateway \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "task":    "quote_summary",
    "payload": {
      "client":  "Acme Contracting",
      "project": "NEOM access road, 5 km",
      "items":   [
        {"name":"Motor Grader GD825","qty":1,"days":30,"unit_rate":1800},
        {"name":"Operator","qty":1,"days":30,"unit_rate":500}
      ]
    },
    "user_id": "'"$USER_ID"'"
  }'
```

### Lead classification (non-streaming — Gemini Flash)

```bash
curl https://<project-ref>.supabase.co/functions/v1/ai-gateway \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "classify_lead",
    "payload": {
      "name":     "Ahmed Al Rashidi",
      "company":  "Gulf Roads LLC",
      "message":  "We need 3 excavators for a 6-month pipeline project in Qassim",
      "budget":   "SAR 800,000",
      "timeline": "Start next month"
    },
    "user_id": "'"$USER_ID"'"
  }'
```

Response:

```json
{
  "content": {
    "score": 88,
    "tier": "hot",
    "budget_confidence": "high",
    "recommended_action": "Schedule call within 24 hours, prepare fleet proposal",
    "estimated_value_sar": 750000,
    "rationale": "Long duration, multi-unit request, defined budget, urgent start"
  },
  "model": "gemini-2.5-flash",
  "tokensIn": 310,
  "tokensOut": 95,
  "costUsd": 0.0000518,
  "latencyMs": 820,
  "usedFallback": false
}
```

---

## Frontend integration

### Streaming chat (portal `Assistant.tsx`)

```typescript
import { supabase } from '@/lib/supabase';

async function* streamChat(message: string, conversationId: number, history = []) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session!.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: 'chat',
      payload: { message, history },
      user_id: session!.user.id,
      locale: 'en',
      conversation_id: conversationId,
    }),
  });

  const reader = res.body!.getReader();
  const dec = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const ev = JSON.parse(line.slice(6));
      if (ev.type === 'delta') yield ev.text as string;
      if (ev.type === 'done' || ev.type === 'error') return;
    }
  }
}
```

### Quote summary (admin `QuoteEditor.tsx`)

```typescript
async function getAiSummary(items: unknown[], client: string, project: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session!.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: 'quote_summary',
      payload: { items, client, project },
      user_id: session!.user.id,
    }),
  });

  let text = '';
  const reader = res.body!.getReader();
  const dec = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const ev = JSON.parse(line.slice(6));
      if (ev.type === 'delta') text += ev.text;
      if (ev.type === 'done') break;
    }
  }
  return text;
}
```

---

## Cost monitoring

Query `ai_usage_log` in Supabase Studio:

```sql
-- Cost by task + model, last 30 days
select
  task,
  model,
  count(*)             as calls,
  sum(tokens_in)       as total_tokens_in,
  sum(tokens_out)      as total_tokens_out,
  round(sum(cost_usd)::numeric, 4) as total_cost_usd,
  round(avg(latency_ms))           as avg_latency_ms,
  count(*) filter (where used_fallback) as fallback_calls
from ai_usage_log
where created_at > now() - interval '30 days'
group by task, model
order by total_cost_usd desc;
```

---

## Local development

```bash
# Requires Docker
supabase start
supabase functions serve ai-gateway --env-file supabase/.env.local
```

`.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
```
