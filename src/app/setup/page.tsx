'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSupabaseClient, useAuth } from '@/supabase';
import { getYouTubeId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clapperboard, Youtube, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const searchSchema = z.string()
  .max(100, "URL terlalu panjang")
  .trim()
  .transform(val => val.replace(/[<&>]/g, ''));

export default function SetupPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedUrlResult = searchSchema.safeParse(url);
    if (!parsedUrlResult.success) {
      toast.error(parsedUrlResult.error.errors[0].message);
      return;
    }
    const safeUrl = parsedUrlResult.data;

    const videoId = getYouTubeId(safeUrl);
    if (!videoId) {
      toast.error("Pastikan Anda memasukkan URL YouTube yang benar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          youtube_video_id: videoId,
          updated_at: new Date().toISOString(),
          email: user.email,
          display_name: user.user_metadata?.full_name || user.user_metadata?.name,
          photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      router.push('/');

    } catch (error: any) {
      console.error("Error saving video ID:", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan link.");
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[300px] md:w-[600px] h-[250px] sm:h-[300px] md:h-[600px] bg-primary/10 blur-[80px] sm:blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-lg space-y-5 sm:space-y-6 md:space-y-8">
        <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 text-center">
          <div className="rounded-lg sm:rounded-xl md:rounded-2xl bg-primary p-2.5 sm:p-3 md:p-4 shadow-2xl rotate-3">
            <Clapperboard className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase italic">CineView Setup</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">Satu langkah lagi menuju teater pribadi Anda.</p>
        </div>

        <Card className="liquid-glass rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] border-white/5">
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Pilih Video Anda</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs md:text-sm">Tempelkan link video atau live streaming YouTube pilihan Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="pl-9 sm:pl-10 h-9 sm:h-10 md:h-12 bg-white/5 border-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <Youtube className="absolute left-3 top-2.5 sm:top-3 md:top-3.5 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">
                  Mendukung format: Link Normal, Short, dan Live
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  type="submit"
                  className="flex-grow h-9 sm:h-10 md:h-12 font-black uppercase tracking-widest rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <>Mulai Menonton <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /></>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 border-white/10 rounded-lg sm:rounded-xl"
                  onClick={async () => {
                    const { error } = await auth.signOut();
                    if (!error) {
                      localStorage.removeItem('google_access_token');
                      router.push('/login');
                    }
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-destructive" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
