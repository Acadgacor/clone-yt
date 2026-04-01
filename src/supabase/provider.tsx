'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { SupabaseClient } from './client';
import { getSupabaseClient } from './client';
import { SupabaseErrorListener } from '@/components/SupabaseErrorListener';

interface SupabaseProviderProps {
  children: ReactNode;
}

interface UserAuthState {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface SupabaseContextState {
  areServicesAvailable: boolean;
  supabase: SupabaseClient | null;
  auth: SupabaseClient['auth'] | null;
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface SupabaseServicesAndUser {
  supabase: SupabaseClient;
  auth: SupabaseClient['auth'];
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    session: null,
    isUserLoading: true,
    userError: null,
  });

  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) {
      setUserAuthState({ user: null, session: null, isUserLoading: false, userError: new Error("Supabase client not available.") });
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true, userError: null }));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUserAuthState({
          user: session?.user ?? null,
          session: session,
          isUserLoading: false,
          userError: null,
        });
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: Session | null }, error: Error | null }) => {
      if (error) {
        setUserAuthState({ user: null, session: null, isUserLoading: false, userError: error });
      } else {
        setUserAuthState({
          user: session?.user ?? null,
          session: session,
          isUserLoading: false,
          userError: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const contextValue = useMemo((): SupabaseContextState => {
    const servicesAvailable = !!supabase;
    return {
      areServicesAvailable: servicesAvailable,
      supabase: servicesAvailable ? supabase : null,
      auth: servicesAvailable ? supabase.auth : null,
      user: userAuthState.user,
      session: userAuthState.session,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [supabase, userAuthState]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      <SupabaseErrorListener />
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseServicesAndUser => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider.');
  }

  if (!context.areServicesAvailable || !context.supabase || !context.auth) {
    throw new Error('Supabase services not available. Check SupabaseProvider.');
  }

  return {
    supabase: context.supabase,
    auth: context.auth,
    user: context.user,
    session: context.session,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): SupabaseClient['auth'] => {
  const { auth } = useSupabase();
  return auth;
};

export const useSupabaseClient = (): SupabaseClient => {
  const { supabase } = useSupabase();
  return supabase;
};

export const useUser = (): UserHookResult => {
  const { user, session, isUserLoading, userError } = useSupabase();
  return { user, session, isUserLoading, userError };
};
