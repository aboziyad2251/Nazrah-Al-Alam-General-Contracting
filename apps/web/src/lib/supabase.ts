import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

// Server-only client — never expose to client bundle
export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
});
