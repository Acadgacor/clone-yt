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
import VideoInfo from '@/components/player/VideoInfo';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hostname, setHostname] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
          <main className={`flex h-full overflow-hidden relative ${isFullscreen ? 'flex-col landscape:flex-row p-0 gap-0 bg-black' : 'flex-col lg:flex-row p-2 md:p-4 gap-4'}`} ref={fullscreenWrapperRef}>
            <AnimatedContent
              direction="vertical"
              distance={20}
              duration={0.4}
              className={`relative flex-grow flex flex-col scroll-smooth ${isFullscreen ? 'p-0 mb-0 pr-0 gap-0 rounded-none overflow-hidden' : 'overflow-y-auto rounded-xl pr-1 sm:pr-2 gap-2 pb-4'}`}
            >
              <div className={`relative w-full shrink-0 flex items-center justify-center bg-black overflow-hidden ${isFullscreen ? 'flex-1 h-full rounded-none border-none' : 'border border-border/50 shadow-sm aspect-video sm:aspect-auto sm:min-h-[50vh] lg:min-h-0 lg:flex-1 rounded-xl'}`}>
                <div className="absolute top-4 left-4 z-50 pointer-events-none">
                  <ViewerCount videoId={videoId} />
                </div>
                <VideoPlayer
                  videoId={videoId}
                  fullscreenWrapperRef={fullscreenWrapperRef}
                  showChat={showChat}
                  setShowChat={setShowChat}
                />
              </div>
              <div className={isFullscreen ? "hidden" : "block"}>
                <VideoInfo videoId={videoId} />
              </div>
            </AnimatedContent>
            {showChat && (
              <AnimatedContent
                direction="vertical"
                distance={20}
                duration={0.3}
                ease="power1.inOut"
                className={`flex flex-col shadow-sm ${isFullscreen ? 'rounded-none border-none z-50' : 'overflow-hidden rounded-xl border border-border/50'}`}
              >
                <LiveChat videoId={videoId} theme={theme} hostname={hostname} user={user} isFullscreen={isFullscreen} />
              </AnimatedContent>
            )}
          </main>
        </section>
      </AnimatedContent>
    </div>
  );
}
