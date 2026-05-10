import { supabase } from './supabase';

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | number,
  diff?: Record<string, unknown>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action,
    entity,
    entity_id: String(entityId),
    diff: diff ?? null,
  });
}
