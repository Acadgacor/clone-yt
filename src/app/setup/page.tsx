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

      router.push('/');
      
    } catch (error: any) {
      console.error("Error saving video ID:", error);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan link.",
      });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl bg-primary p-4 shadow-2xl rotate-3">
            <Clapperboard className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">CineView Setup</h1>
          <p className="text-muted-foreground font-medium">Satu langkah lagi menuju teater pribadi Anda.</p>
        </div>

        <Card className="liquid-glass rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Pilih Video Anda</CardTitle>
            <CardDescription>Tempelkan link video atau live streaming YouTube pilihan Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="pl-10 h-12 bg-muted/20 border-white/10 rounded-xl"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <Youtube className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">
                  Mendukung format: Link Normal, Short, dan Live
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-grow h-12 font-black uppercase tracking-widest rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>Mulai Menonton <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-white/10 rounded-xl"
                  onClick={() => signOut(auth)}
                >
                  <LogOut className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
