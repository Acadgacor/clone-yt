'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const next = searchParams.get('next') || '/setup';
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth error from URL
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        router.push(`/login?error=${error}&description=${encodeURIComponent(errorDescription || '')}`);
        return;
      }

      // Exchange code for session (PKCE flow)
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          router.push('/login?error=code_exchange_failed');
          return;
        }
      }

      // Check session after exchange
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Auth callback error:', sessionError);
        router.push('/login?error=auth_callback_failed');
        return;
      }

      if (data.session) {
        // Extract and store Google access token for YouTube API calls
        const providerToken = data.session.provider_token;
        if (providerToken) {
          localStorage.setItem('google_access_token', providerToken);
        }
        router.push(next);
      } else {
        router.push('/login?error=no_session');
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Menyelesaikan login...</p>
      </div>
    </div>
  );
}
