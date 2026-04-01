'use client';

import VideoPlayer from '@/components/player/VideoPlayer';
import Header from '@/components/layout/Header';
import LiveChat from '@/components/chat/LiveChat';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AnimatedContent from '@/components/AnimatedContent';
import ViewerCount from '@/components/player/ViewerCount';
import VideoInfo from '@/components/player/VideoInfo';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { z } from 'zod';

const videoIdSchema = z.string()
  .length(11, "ID Video tidak valid")
  .regex(/^[a-zA-Z0-9_-]+$/, "Karakter ID tidak diizinkan");

function extractVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

interface Video {
  id: string;
  url: string; // DIPERBAIKI: Menggunakan 'url'
  title?: string;
  created_at?: string;
}

export default function Home() {
  const supabase = createClient();
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
  
  const [video, setVideo] = useState<Video | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch user's personal video from 'users' table
  useEffect(() => {
    const fetchUserVideo = async () => {
      setIsLoading(true);
      
      // 1. Dapatkan user yang sedang login
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Jika belum login, jangan load video (biarkan user di-redirect ke login)
        setIsLoading(false);
        return;
      }

      // 2. Ambil data youtube_video_id dari tabel 'users'
      const { data, error } = await supabase
        .from('users')
        .select('youtube_video_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } 
      
      // 3. Jika user punya video, tampilkan. Jika tidak, arahkan ke /setup
      if (data && data.youtube_video_id) {
        setVideoId(data.youtube_video_id);
      } else {
        // Redirect ke setup jika belum punya video
        window.location.href = '/setup';
      }
      
      setIsLoading(false);
    };

    fetchUserVideo();
  }, [supabase]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hostname, setHostname] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  if (isLoading || !videoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <AnimatedContent 
          distance={12} 
          duration={0.4}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-red-600/15 to-red-600/15 rounded-full scale-150" />
            <Loader2 className="h-10 w-10 animate-spin text-white/70 relative z-10" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-white/50 font-light">
            {isLoading ? 'Loading' : 'Video tidak tersedia'}
          </p>
        </AnimatedContent>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white overflow-hidden">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <div className="flex-grow overflow-hidden relative">
        <section className="h-full">
          <main 
            className={`flex h-full overflow-hidden relative ${
              isFullscreen 
                ? 'flex-col landscape:flex-row p-0 gap-0 bg-black' 
                : 'flex-col lg:flex-row p-4 md:p-6 gap-4 md:gap-5'
            }`} 
            ref={fullscreenWrapperRef}
          >
            <AnimatedContent 
              direction="vertical" 
              distance={20} 
              duration={0.4}
              delay={0.05}
              className={`relative flex flex-col scroll-smooth ${
                isFullscreen 
                  ? 'flex-1 min-h-0 p-0 mb-0 pr-0 gap-0 rounded-none overflow-hidden' 
                  : 'flex-grow overflow-y-auto rounded-2xl pr-2 sm:pr-3 gap-3 pb-4'
              }`}
            >
              <div 
                className={`relative w-full flex items-center justify-center bg-black overflow-hidden ${
                  isFullscreen 
                    ? 'flex-1 h-full min-h-0 rounded-none border-none shadow-none' 
                    : 'shrink-0 shadow-[0_12px_48px_-8px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden aspect-video sm:aspect-auto sm:min-h-[50vh] lg:min-h-[70vh] lg:h-auto'
                }`}
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
              </div>
              <div className={isFullscreen ? "hidden" : "block"}>
                <VideoInfo videoId={videoId} />
              </div>
            </AnimatedContent>
            {showChat && (
              <AnimatedContent 
                direction="vertical" 
                distance={20} 
                duration={0.35} 
                delay={0.1}
                className={`flex flex-col ${
                  isFullscreen 
                    ? 'w-full h-[40vh] min-h-[200px] landscape:h-full landscape:w-[280px] sm:landscape:w-[320px] md:landscape:w-[360px] landscape:min-h-0 rounded-none border-none z-50 bg-black/95 backdrop-blur-xl' 
                    : 'shrink-0 w-full lg:w-[380px] xl:w-[420px] overflow-hidden rounded-2xl shadow-[0_12px_48px_-8px_rgba(0,0,0,0.6)]'
                }`}
              >
                <LiveChat 
                  videoId={videoId} 
                  theme={theme} 
                  hostname={hostname} 
                  user={user} 
                  isFullscreen={isFullscreen} 
                />
              </AnimatedContent>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}