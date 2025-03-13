import { createClient } from 'jsr:@supabase/supabase-js';

import type { Database } from '../../database.types.ts';

const supabase_url = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL')!;
const service_role_key = Deno.env.get('SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient<Database>(supabase_url, service_role_key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
