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

  // Fetch User Specific Video Config
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<any>(userDocRef);

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

  const formatTime = (seconds: number) => {
    if (isLive) return 'LIVE';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const qualityLabels: Record<string, string> = {
    'highres': '4K / 8K',
    'hd2160': '2160p 4K',
    'hd1440': '1440p QHD',
    'hd1080': '1080p HD',
    'hd720': '720p HD',
    'large': '480p',
    'medium': '360p',
    'small': '240p',
    'tiny': '144p',
    'auto': 'AUTO'
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
      toast({ title: "Quality Updated", description: `Resolution: ${qualityLabels[q] || q}` });
    }
  };

  if (isUserLoading || isUserDataLoading || !userData?.youtubeVideoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Theater...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      
      {/* Header */}
      <header className="flex-none h-[64px] border-b border-border/20 bg-background/20 backdrop-blur-[40px] px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-primary p-1.5 shadow-xl shadow-primary/20">
              <Clapperboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">CineView</h1>
          </Link>
          <Button variant="ghost" size="sm" asChild className="rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-5 h-9">
            <Link href="/setup">
              <ChevronLeft className="mr-1 h-3 w-3" /> Change Video
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-10 w-10 bg-white/5 border border-white/10">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <AuthButton />
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-black" ref={fullscreenWrapperRef}>
        
        {/* Video Side */}
        <div 
          className="flex-grow relative group"
          onMouseMove={handleMouseMove}
        >
          <div id="youtube-player" className="h-full w-full pointer-events-none" />
          
          {/* Controls Overlay */}
          <div className={cn(
            "absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-500",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <div className="p-8 space-y-4">
              {/* Floating Controls Bar - Pill Style from Reference */}
              <div className="flex items-center justify-center gap-3">
                
                {/* Play Group */}
                <div className="glass-pill h-[72px] w-[72px]">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-transparent h-full w-full">
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                  </Button>
                </div>

                {/* Volume Pill */}
                <div className="glass-pill h-[72px] px-8 gap-4 min-w-[280px]">
                  <Button variant="ghost" size="icon" onClick={() => handleVolumeChange([isMuted ? 50 : 0])} className="text-white hover:bg-transparent h-10 w-10">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>
                  <div className="flex-grow orange-slider">
                    <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                  </div>
                </div>

                {/* LIVE Badge Pill */}
                {isLive && (
                  <div className="glass-pill h-[72px] px-8 bg-red-600/20 border-red-500/20 cursor-pointer" onClick={handleSyncLive}>
                    <div className="flex items-center gap-3 text-red-500 font-black text-xs tracking-widest uppercase">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Live
                    </div>
                  </div>
                )}

                {/* Quality Pill */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="glass-pill h-[72px] px-10 cursor-pointer hover:bg-white/10">
                      <span className="text-white text-xs font-black uppercase tracking-[0.2em]">
                        {qualityLabels[currentQuality] || 'AUTO'}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="liquid-glass text-white rounded-[1.5rem] min-w-[180px] p-2 border-white/10 mb-4" container={fullscreenWrapperRef.current}>
                    {availableQualities.map((q) => (
                      <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-xs font-bold cursor-pointer rounded-xl hover:bg-white/10 p-3">
                        {qualityLabels[q] || q} {currentQuality === q && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen Group */}
                <div className="glass-pill h-[72px] w-[72px]">
                  <Button variant="ghost" size="icon" onClick={() => isFullscreen ? document.exitFullscreen() : fullscreenWrapperRef.current?.requestFullscreen()} className="text-white hover:bg-transparent h-full w-full">
                    {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
                  </Button>
                </div>

              </div>

              {/* Progress Slider (Bottom Thin) */}
              {!isLive && (
                <div className="max-w-4xl mx-auto px-10 pt-2">
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

        {/* Chat Side */}
        <div className="w-full lg:w-[450px] flex-none bg-black border-l border-white/5 flex flex-col h-full">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-[60px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white/70">Conversation</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-white/30 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-[10px] font-medium p-4 liquid-glass rounded-2xl">
                    Enable "Third-party cookies" or click the arrow to open chat in a new tab if login issues occur.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {videoId && (
              <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-white/30 hover:text-primary rounded-xl hover:bg-white/5">
                <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="flex-grow">
            {!user ? (
               <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
                <div className="rounded-[2.5rem] bg-white/5 p-8 border border-white/10 backdrop-blur-3xl">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black uppercase tracking-widest text-sm text-white">Interactive Locked</h3>
                  <p className="text-xs text-white/40 font-medium max-w-[200px] leading-relaxed">Sign in to join the conversation.</p>
                </div>
                <AuthButton />
              </div>
            ) : (
              <iframe
                src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${hostname}${theme === 'dark' ? '&dark_theme=1' : ''}&hl=id`}
                className="w-full h-full border-none opacity-80 hover:opacity-100 transition-opacity"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            )}
          </div>

          <div className="p-5 bg-white/[0.01] border-t border-white/5 backdrop-blur-md">
            <p className="text-[10px] text-white/20 font-bold text-center uppercase tracking-[0.2em]">
              Professional Theater Interaction {user ? `• ${user.displayName}` : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
