-- AI usage log: cost and performance tracking for all AI gateway calls.
-- Separate from ai_messages (which stores chat turn content) so analytics
-- can cover every task type, not just chat.

create table ai_usage_log (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  user_id          uuid references profiles(id) on delete set null,
  conversation_id  bigint references ai_conversations(id) on delete set null,
  task             text not null,
  model            text not null,
  tokens_in        int  not null default 0,
  tokens_out       int  not null default 0,
  cost_usd         numeric(12, 8) not null default 0,
  latency_ms       int  not null default 0,
  used_fallback    boolean not null default false
);

create index idx_ai_usage_user    on ai_usage_log(user_id);
create index idx_ai_usage_task    on ai_usage_log(task);
create index idx_ai_usage_created on ai_usage_log(created_at);

alter table ai_usage_log enable row level security;

-- Admins see everything; users see their own rows
create policy "admins read ai_usage_log"
  on ai_usage_log for select
  using (is_admin());

create policy "users read own ai_usage_log"
  on ai_usage_log for select
  using (auth.uid() = user_id);

-- Only service role may insert (the edge function uses service-role key)
