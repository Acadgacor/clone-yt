'use client';

import { supabaseConfig } from '@/supabase/config';
import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

export type SupabaseClient = SupabaseClientType;

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );

  return supabaseClient;
}

export function initializeSupabase() {
  const supabase = getSupabaseClient();
  return {
    supabase,
    auth: supabase.auth,
  };
}
