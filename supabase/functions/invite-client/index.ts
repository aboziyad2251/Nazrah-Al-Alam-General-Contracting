/**
 * invite-client — converts a CRM lead into a portal client account.
 *
 * Steps:
 *   1. Validate request (admin JWT required)
 *   2. Invite user by email via Supabase Auth admin API
 *   3. Upsert profile row with company / phone info
 *   4. Upsert clients row with VAT / billing address
 *   5. Mark lead as converted (stage=won, converted_profile_id, converted_at)
 *
 * Called from admin frontend — returns { ok, profile_id } or { error }.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Verify caller is admin
  const authHeader = req.headers.get('authorization') ?? '';
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();
  if (!['admin', 'super_admin'].includes(callerProfile?.role ?? '')) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
  }

  const { lead_id, email, company, vat_number, billing_address, phone, full_name } =
    await req.json();

  if (!email || !lead_id) {
    return Response.json(
      { error: 'email and lead_id required' },
      { status: 400, headers: corsHeaders }
    );
  }

  // 1. Invite user — sends email with magic link
  const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://portal.nazrahalalam.com'}/onboarding` }
  );
  if (inviteErr) {
    // If user already exists, fetch their id instead
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', (await adminClient.auth.admin.getUserByEmail(email))?.data?.user?.id ?? '')
      .maybeSingle();
    if (!existing) {
      return Response.json({ error: inviteErr.message }, { status: 400, headers: corsHeaders });
    }
  }

  const profileId =
    invited?.user?.id ?? (await adminClient.auth.admin.getUserByEmail(email))?.data?.user?.id;
  if (!profileId) {
    return Response.json(
      { error: 'Could not resolve profile id' },
      { status: 500, headers: corsHeaders }
    );
  }

  // 2. Upsert profile
  await adminClient.from('profiles').upsert({
    id: profileId,
    full_name: full_name ?? null,
    company: company ?? null,
    phone: phone ?? null,
    role: 'client',
  });

  // 3. Upsert client record
  await adminClient.from('clients').upsert(
    {
      profile_id: profileId,
      vat_number: vat_number ?? null,
      billing_address: billing_address ?? null,
    },
    { onConflict: 'profile_id' }
  );

  // 4. Mark lead converted
  await adminClient
    .from('leads')
    .update({
      stage: 'won',
      converted_profile_id: profileId,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead_id);

  return Response.json({ ok: true, profile_id: profileId }, { headers: corsHeaders });
});
