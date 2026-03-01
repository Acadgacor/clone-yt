'use client';

import VideoPlayer from '@/components/player/VideoPlayer';
import Header from '@/components/layout/Header';
import LiveChat from '@/components/chat/LiveChat';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AnimatedContent from '@/components/AnimatedContent';
import ViewerCount from '@/components/player/ViewerCount';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hostname, setHostname] = useState('');
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!userData || !userData.youtubeVideoId) {
      router.push('/setup');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  const videoId = userData?.youtubeVideoId;

  if (isUserLoading || isUserDataLoading || !videoId) {
    return (
      <AnimatedContent
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm tracking-widest uppercase animate-pulse text-muted-foreground">Loading</p>
        </div>
      </AnimatedContent>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background/95 text-foreground overflow-hidden">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <AnimatedContent className="flex-grow overflow-hidden relative">
        <section className="h-full">
          <main className="flex h-full flex-col lg:flex-row overflow-hidden relative p-2 md:p-4 gap-4" ref={fullscreenWrapperRef}>
            <AnimatedContent
              direction="vertical"
              distance={20}
              duration={0.4}
              className="relative flex-grow flex items-center justify-center bg-black rounded-xl overflow-hidden border border-border/50 shadow-sm"
            >
              <div className="absolute top-4 left-4 z-50 pointer-events-none">
                <ViewerCount videoId={videoId} />
              </div>
              <VideoPlayer
                videoId={videoId}
                fullscreenWrapperRef={fullscreenWrapperRef}
                showChat={showChat}
                setShowChat={setShowChat}
              />
            </AnimatedContent>
            {showChat && (
              <AnimatedContent
                direction="vertical"
                distance={20}
                duration={0.3}
                ease="power1.inOut"
                className="rounded-xl border border-border/50 overflow-hidden shadow-sm"
              >
                <LiveChat videoId={videoId} theme={theme} hostname={hostname} user={user} />
              </AnimatedContent>
            )}
          </main>
        </section>
      </AnimatedContent>
    </div>
  );
}
