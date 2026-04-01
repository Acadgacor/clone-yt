'use client';

import { useEffect, useContext } from 'react';
import { SupabaseContext } from '@/supabase/provider';

export function SupabaseErrorListener() {
  const context = useContext(SupabaseContext);

  useEffect(() => {
    if (!context?.supabase) return;

    const supabase = context.supabase;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      } else if (event === 'USER_UPDATED') {
        console.log('User updated:', session?.user?.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [context]);

  return null;
}
