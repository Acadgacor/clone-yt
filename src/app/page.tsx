'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import Header from '@/components/layout/Header';
import VideoPlayer from '@/components/player/VideoPlayer';
import LiveChat from '@/components/chat/LiveChat';

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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Entering Theater...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden" ref={fullscreenWrapperRef}>
        <VideoPlayer 
          videoId={videoId} 
          fullscreenWrapperRef={fullscreenWrapperRef} 
          showChat={showChat} 
          setShowChat={setShowChat} 
        />
        {showChat && (
          <LiveChat
            videoId={videoId}
            theme={theme}
            hostname={hostname}
            user={user}
          />
        )}
      </main>
    </div>
  );
}
