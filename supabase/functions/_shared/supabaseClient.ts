import { createClient } from 'jsr:@supabase/supabase-js';

import type { Database } from '../../database.types.ts';

const supabase_url = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL')!;
const anon_key = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')!;

export const supabaseClient = createClient<Database>(supabase_url, anon_key);
