'use client';

import Header from '@/components/layout/Header';
import DesktopView from '@/components/views/DesktopView';
import MobileView from '@/components/views/MobileView';
import AnimatedContent from '@/components/AnimatedContent';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ViewProps } from '@/types';
import { useUserVideo } from '@/hooks/useUserVideo';
import { useIsMobile } from '@/hooks/use-mobile';


export default function Home() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { user, videoId, isLoading } = useUserVideo();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hostname, setHostname] = useState('');
  const [showChat, setShowChat] = useState(false);
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

  const viewProps: ViewProps = {
    videoId: videoId ?? '',
    showChat,
    setShowChat,
    isFullscreen,
    wrapperRef,
    theme,
    hostname,
    user,
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
        {isMobile ? <MobileView {...viewProps} /> : <DesktopView {...viewProps} />}
      </div>
    </div>
  );
}