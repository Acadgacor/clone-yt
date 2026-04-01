'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSupabaseClient } from '@/supabase';
import AuthButton from '@/components/auth/AuthButton';
import { Clapperboard, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const supabase = useSupabaseClient();
  const [isCheckingVideo, setIsCheckingVideo] = useState(false);

  useEffect(() => {
    // Jika user sudah login, cek apakah sudah punya video
    if (!isUserLoading && user) {
      const checkUserVideo = async () => {
        setIsCheckingVideo(true);
        
        // Cek apakah user sudah punya video di tabel users
        const { data, error } = await supabase
          .from('users')
          .select('youtube_video_id')
          .eq('id', user.id)
          .single();

        if (error || !data?.youtube_video_id) {
          // Belum punya video, arahkan ke setup
          router.replace('/setup');
        } else {
          // Sudah punya video, arahkan ke main page
          router.replace('/');
        }
        
        setIsCheckingVideo(false);
      };

      checkUserVideo();
    }
  }, [user, isUserLoading, router, supabase]);

  if (isUserLoading || isCheckingVideo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-primary/20 blur-[80px] sm:blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-6 sm:space-y-8 text-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="rounded-xl sm:rounded-2xl bg-primary p-3 sm:p-4 shadow-2xl shadow-primary/40 rotate-3">
            <Clapperboard className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">CineView</h1>
        </div>

        <Card className="liquid-glass border-white/10 shadow-2xl">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium">
              Log in to access professional theater controls and live interactive features.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:gap-6 pt-2 sm:pt-4 p-5 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/20">
              <ShieldCheck className="h-3 w-3" />
              Secure Authentication
            </div>
            
            <div className="w-full pt-2">
              <AuthButton />
            </div>

            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              By continuing, you agree to CineView Labs' <br /> Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-6 sm:bottom-8 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-muted-foreground/30">
        &copy; 2024 CineView Labs &bull; Professional UI
      </footer>
    </div>
  );
}