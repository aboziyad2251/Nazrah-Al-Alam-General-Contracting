import { supabase } from './supabase';

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | number | null | undefined,
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
    entity_id: entityId != null ? String(entityId) : null,
    diff: diff ?? null,
  });
}
