'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { 
  Clapperboard, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Loader2, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Sun,
  Moon,
  ChevronLeft,
  Lock,
  ExternalLink,
  HelpCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import AuthButton from '@/components/auth/AuthButton';

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const playerRef = useRef<any>(null);
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isLive, setIsLive] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
      
      const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, []);

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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const checkIsLive = useCallback((player: any) => {
    if (!player || typeof player.getDuration !== 'function') return false;
    const d = player.getDuration();
    const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
    return d === 0 || (videoData && videoData.isLive);
  }, []);

  const refreshQualities = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getAvailableQualityLevels === 'function') {
      const levels = playerRef.current.getAvailableQualityLevels();
      if (levels && levels.length > 0) setAvailableQualities(levels);
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      setCurrentTime(playerRef.current.getCurrentTime());
      setDuration(playerRef.current.getDuration());
      setIsLive(checkIsLive(playerRef.current));
      if (availableQualities.length === 0) refreshQualities();
    }
  }, [checkIsLive, refreshQualities, availableQualities.length]);

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    setIsLive(checkIsLive(event.target));
    refreshQualities();
  };

  const onPlayerStateChange = (event: any) => {
    const YT = (window as any).YT;
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (!progressIntervalRef.current) progressIntervalRef.current = setInterval(updateProgress, 1000);
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const handleSyncLive = () => {
    if (playerRef.current && isLive) {
      playerRef.current.seekTo(playerRef.current.getDuration(), true);
      toast({
        title: "Synced to Live",
        description: "Catching up to real-time...",
      });
    }
  };

  useEffect(() => {
    if (!videoId) return;
    setIsPlayerReady(false);
    setIsPlaying(false);
    const setupPlayer = () => {
      if (document.getElementById('youtube-player')) {
        if (playerRef.current?.destroy) playerRef.current.destroy();
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: { 
            autoplay: 1, 
            controls: 0, 
            modestbranding: 1, 
            rel: 0, 
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange },
        });
      }
    };
    if (!(window as any).YT?.Player) (window as any).onYouTubeIframeAPIReady = setupPlayer;
    else setupPlayer();
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [videoId]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const handleTogglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleVolumeChange = (val: number[]) => {
    if (playerRef.current) {
      setVolume(val[0]);
      playerRef.current.setVolume(val[0]);
      setIsMuted(val[0] === 0);
    }
  };

  const handleQualityChange = (q: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
      const time = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(time, true);
      toast({ title: "Quality Updated", description: `Resolution: ${q}` });
    }
  };

  if (isUserLoading || isUserDataLoading || !userData?.youtubeVideoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black text-foreground overflow-hidden">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      
      {/* Responsive Header */}
      <header className="flex-none h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-primary p-1 shadow-lg shadow-primary/20">
              <Clapperboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic hidden sm:block">CineView</h1>
          </Link>
          <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-3 md:px-5 h-8">
            <Link href="/setup">
              <ChevronLeft className="mr-1 h-3 w-3" /> Change
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 bg-white/5 border border-white/10">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <AuthButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden" ref={fullscreenWrapperRef}>
        
        {/* Video Side */}
        <div 
          className="flex-grow relative group bg-black"
          onMouseMove={handleMouseMove}
        >
          <div id="youtube-player" className="h-full w-full pointer-events-none" />
          
          {/* Controls Overlay */}
          <div className={cn(
            "absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-500",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <div className="p-4 md:p-8 space-y-4">
              {/* Floating Bar - Responsive & Slimmer */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-full">
                
                {/* Play Button */}
                <div className="glass-pill h-11 w-11 md:h-14 md:w-14">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-transparent h-full w-full">
                    {isPlaying ? <Pause size={20} className="md:size-24" /> : <Play size={20} className="md:size-24" />}
                  </Button>
                </div>

                {/* Volume Pill - Thinner */}
                <div className="glass-pill h-11 md:h-14 px-4 md:px-6 gap-3 md:gap-4 min-w-[180px] md:min-w-[240px]">
                  <Button variant="ghost" size="icon" onClick={() => handleVolumeChange([isMuted ? 50 : 0])} className="text-white hover:bg-transparent h-8 w-8 p-0">
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </Button>
                  <div className="flex-grow orange-slider">
                    <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                  </div>
                </div>

                {/* LIVE Badge */}
                {isLive && (
                  <div className="glass-pill h-11 md:h-14 px-4 md:px-6 cursor-pointer" onClick={handleSyncLive}>
                    <div className="flex items-center gap-2 text-red-500 font-black text-[10px] tracking-widest uppercase">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Live
                    </div>
                  </div>
                )}

                {/* Quality Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="glass-pill h-11 md:h-14 px-4 md:px-8 cursor-pointer">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">
                        {currentQuality === 'auto' ? 'AUTO' : currentQuality.toUpperCase()}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="liquid-glass text-white rounded-2xl min-w-[140px] p-1 border-white/10 mb-2">
                    {availableQualities.map((q) => (
                      <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-[10px] font-bold cursor-pointer rounded-xl hover:bg-white/10 p-2 uppercase tracking-widest">
                        {q} {currentQuality === q && <Check className="ml-auto h-3 w-3 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen */}
                <div className="glass-pill h-11 w-11 md:h-14 md:w-14">
                  <Button variant="ghost" size="icon" onClick={() => isFullscreen ? document.exitFullscreen() : fullscreenWrapperRef.current?.requestFullscreen()} className="text-white hover:bg-transparent h-full w-full">
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </Button>
                </div>

              </div>

              {/* Progress (Only if not live) */}
              {!isLive && (
                <div className="max-w-3xl mx-auto px-4">
                   <Slider
                    value={[(currentTime / duration) * 100 || 0]}
                    max={100}
                    onValueChange={(val) => playerRef.current?.seekTo((val[0]/100)*duration, true)}
                    className="h-1 orange-slider"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Side - Responsive Width */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-none bg-black border-l border-white/5 flex flex-col h-[300px] lg:h-full">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Live Conversation</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-white/20 cursor-help" /></TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-[9px] liquid-glass p-3 rounded-xl border-white/10">
                    If chat is blank, check browser settings for Third-party cookies.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {videoId && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-white/20 hover:text-primary rounded-lg">
                <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="flex-grow overflow-hidden">
            {!user ? (
               <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Lock className="h-8 w-8 text-primary/50" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Sign in to Chat</p>
                <AuthButton />
              </div>
            ) : (
              <iframe
                src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${hostname}${theme === 'dark' ? '&dark_theme=1' : ''}`}
                className="w-full h-full border-none opacity-90"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
