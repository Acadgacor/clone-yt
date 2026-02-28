'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import AuthButton from '@/components/auth/AuthButton';
import { Clapperboard, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // Jika user sudah login, arahkan ke halaman setup/home secara otomatis
    if (!isUserLoading && user) {
      router.replace('/setup');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-primary p-4 shadow-2xl shadow-primary/40 rotate-3">
            <Clapperboard className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">CineView</h1>
        </div>

        <Card className="liquid-glass border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="font-medium">
              Log in to access professional theater controls and live interactive features.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <ShieldCheck className="h-3 w-3" />
              Secure Authentication
            </div>
            
            <div className="w-full pt-2">
              <AuthButton />
            </div>

            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
              By continuing, you agree to CineView Labs' <br /> Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-8 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
        &copy; 2024 CineView Labs &bull; Professional UI
      </footer>
    </div>
  );
}