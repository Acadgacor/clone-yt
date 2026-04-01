'use client';

import React, { useMemo, type ReactNode } from 'react';
import { SupabaseProvider } from '@/supabase/provider';
import { getSupabaseClient } from '@/supabase/client';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  const supabase = useMemo(() => {
    return getSupabaseClient();
  }, []);

  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
}
