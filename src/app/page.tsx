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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching video:', error);
        setVideo(null);
        setVideoId(null);
      } else if (data) {
        setVideo(data);
        const extractedId = extractVideoId(data.url); // DIPERBAIKI: Ambil dari data.url
        
        if (extractedId) {
          const parseResult = videoIdSchema.safeParse(extractedId);
          if (parseResult.success) {
            setVideoId(parseResult.data);
          } else {
            console.error('Invalid video ID format:', extractedId);
            setVideoId(null);
          }
        } else {
          console.error('Could not extract video ID from URL:', data.url);
          setVideoId(null);
        }
      }
      setIsLoading(false);
    };

    fetchLatestVideo();
  }, [supabase]);

  useEffect(() => {
    const trackView = async () => {
      if (!video?.id || !videoId) return;
      try {
        const { error } = await supabase.from('views').insert({ video_id: video.id });
        if (error) console.error('Error tracking view:', error);
      } catch (err) {
        console.error('Exception tracking view:', err);
      }
    };
    if (video?.id && videoId) trackView();
  }, [video?.id, videoId, supabase]);

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

  if (isLoading || !videoId) {
    return (
      <AnimatedContent className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm tracking-widest uppercase animate-pulse text-muted-foreground">
            {isLoading ? 'Loading' : 'Video tidak tersedia'}
          </p>
        </div>
      </AnimatedContent>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background/95 text-foreground overflow-hidden">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <AnimatedContent className="flex-grow overflow-hidden relative">
        <section className="h-full">
          <main className={`flex h-full overflow-hidden relative ${isFullscreen ? 'flex-col landscape:flex-row p-0 gap-0 bg-black' : 'flex-col lg:flex-row p-2 md:p-4 gap-4'}`} ref={fullscreenWrapperRef}>
            <AnimatedContent direction="vertical" distance={20} duration={0.4} className={`relative flex-grow flex flex-col scroll-smooth ${isFullscreen ? 'p-0 mb-0 pr-0 gap-0 rounded-none overflow-hidden' : 'overflow-y-auto rounded-xl pr-1 sm:pr-2 gap-2 pb-4'}`}>
              <div className={`relative w-full shrink-0 flex items-center justify-center bg-black overflow-hidden ${isFullscreen ? 'flex-1 h-full rounded-none border-none' : 'border border-border/50 shadow-sm aspect-video sm:aspect-auto sm:min-h-[50vh] lg:min-h-[70vh] lg:h-auto rounded-xl'}`}>
                <div className="absolute top-4 left-4 z-50 pointer-events-none">
                  <ViewerCount videoId={videoId} />
                </div>
                <VideoPlayer videoId={videoId} fullscreenWrapperRef={fullscreenWrapperRef} showChat={showChat} setShowChat={setShowChat} />
              </div>
              <div className={isFullscreen ? "hidden" : "block"}>
                <VideoInfo videoId={videoId} />
              </div>
            </AnimatedContent>
            {showChat && (
              <AnimatedContent direction="vertical" distance={20} duration={0.3} ease="power1.inOut" className={`flex flex-col shadow-sm shrink-0 ${isFullscreen ? 'w-full h-full landscape:w-[260px] sm:landscape:w-[300px] md:landscape:w-[340px] rounded-none border-none z-50 bg-background/95' : 'w-full lg:w-[380px] xl:w-[420px] overflow-hidden rounded-xl border border-border/50'}`}>
                <LiveChat videoId={videoId} theme={theme} hostname={hostname} user={user} isFullscreen={isFullscreen} />
              </AnimatedContent>
            )}
          </main>
        </section>
      </AnimatedContent>
    </div>
  );
}