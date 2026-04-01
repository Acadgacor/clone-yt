'use client';

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type { SupabaseClient };

export function getSupabaseClient(): SupabaseClient {
  return createClient();
}

export function initializeSupabase() {
  const supabase = createClient();
  return {
    supabase,
    auth: supabase.auth,
  };
}
