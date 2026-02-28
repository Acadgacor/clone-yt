'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getYouTubeId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clapperboard, Youtube, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';

export default function SetupPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
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

    const videoId = getYouTubeId(url);
    if (!videoId) {
      toast({
        variant: "destructive",
        title: "Link tidak valid",
        description: "Pastikan Anda memasukkan URL YouTube yang benar.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userDocRef, {
        youtubeVideoId: videoId,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Video Berhasil Disimpan",
        description: "Mengarahkan Anda ke Teater pribadi...",
      });

      router.push('/');
    } catch (error: any) {
      console.error("Error saat submit:", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan data ke database.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-lg space-y-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-[2.5rem] bg-primary p-6 shadow-2xl rotate-6 shadow-primary/30">
            <Clapperboard className="h-12 w-12 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">CineView Setup</h1>
            <p className="text-muted-foreground font-semibold tracking-wide">Configure your professional viewing space.</p>
          </div>
        </div>

        <Card className="liquid-glass border-white/20 rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 pb-2">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Select Content</CardTitle>
            <CardDescription className="text-sm font-medium opacity-70">Paste any YouTube or Live Stream URL to begin.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <div className="relative group">
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="pl-14 h-16 bg-white/5 border-white/10 rounded-[1.5rem] focus:ring-primary focus:border-primary text-lg transition-all"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <Youtube className="absolute left-5 top-5 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] px-2 opacity-60">
                  Supports: Standard, Shorts, & Live URLs
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-grow h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Enter Theater <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-[1.5rem] border-white/10 bg-white/5 hover:bg-destructive/10 hover:text-destructive transition-all"
                  onClick={() => signOut(auth)}
                  disabled={isSubmitting}
                >
                  <LogOut className="h-6 w-6" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}