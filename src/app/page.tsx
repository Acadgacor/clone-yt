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

  // Defensive Redirect Logic
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
    'auto': 'Auto'
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
        description: "Mengejar siaran langsung terbaru...",
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
      <header className="flex-none h-[70px] border-b border-border/50 bg-background/40 backdrop-blur-[50px] px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-2xl bg-primary p-2 shadow-xl shadow-primary/30 rotate-2">
              <Clapperboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">CineView</h1>
          </Link>
          <Button variant="ghost" size="sm" asChild className="rounded-2xl text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-white/5 px-4 h-9">
            <Link href="/setup">
              <ChevronLeft className="mr-1 h-3 w-3" /> Change Video
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-2xl h-10 w-10 bg-muted/30 border border-white/5">
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
            "absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-end transition-opacity duration-700",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <div className="p-10 space-y-6">
              {/* Progress Slider */}
              {!isLive && (
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">{formatTime(currentTime)}</span>
                  <Slider
                    value={[(currentTime / duration) * 100 || 0]}
                    max={100}
                    onValueChange={(val) => playerRef.current?.seekTo((val[0]/100)*duration, true)}
                    className="flex-grow h-1.5"
                  />
                  <span className="text-xs font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">{formatTime(duration)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white liquid-glass rounded-[2rem] h-16 w-16">
                    {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                  </Button>
                  
                  <div className="flex items-center liquid-glass rounded-[2.5rem] px-3">
                    <Button variant="ghost" size="icon" onClick={() => handleVolumeChange([isMuted ? 50 : 0])} className="text-white h-16 w-16">
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </Button>
                    <div className="w-28 mx-4">
                      <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                    </div>
                  </div>

                  {isLive && (
                    <button 
                      onClick={handleSyncLive}
                      className="flex items-center gap-3 bg-red-600/20 text-red-500 border border-red-500/30 px-5 py-3 rounded-[2rem] font-black text-xs tracking-widest uppercase backdrop-blur-3xl hover:bg-red-600/30 transition-all active:scale-95 shadow-xl shadow-red-500/10"
                    >
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Live
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="liquid-glass text-white h-16 px-8 rounded-[2rem] text-xs font-black uppercase tracking-widest">
                        {qualityLabels[currentQuality] || 'Auto'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="liquid-glass text-white rounded-[1.5rem] min-w-[180px] p-2 border-white/20" container={fullscreenWrapperRef.current}>
                      {availableQualities.map((q) => (
                        <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-xs font-bold cursor-pointer rounded-xl hover:bg-white/10 p-3">
                          {qualityLabels[q] || q} {currentQuality === q && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="ghost" size="icon" onClick={() => isFullscreen ? document.exitFullscreen() : fullscreenWrapperRef.current?.requestFullscreen()} className="liquid-glass text-white rounded-[2rem] h-16 w-16">
                    {isFullscreen ? <Minimize size={32} /> : <Maximize size={32} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Side */}
        <div className="w-full lg:w-[450px] flex-none bg-card border-l border-border/30 flex flex-col h-full shadow-2xl">
          <div className="p-5 border-b border-border/30 flex items-center justify-between bg-muted/10 backdrop-blur-[60px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Live Conversation</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-[10px] font-medium p-4 liquid-glass rounded-2xl">
                    Jika diminta login terus, aktifkan "Third-party cookies" di browser atau klik ikon panah di kanan untuk buka chat di tab baru.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {videoId && (
              <Button variant="ghost" size="icon" asChild className="h-10 w-10 text-muted-foreground hover:text-primary rounded-xl bg-muted/20">
                <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="flex-grow bg-white/5">
            {!user ? (
               <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
                <div className="rounded-[2rem] bg-primary/10 p-6 backdrop-blur-xl">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black uppercase tracking-widest text-sm">Interaction Locked</h3>
                  <p className="text-xs text-muted-foreground font-medium max-w-[200px] leading-relaxed">Join the live conversation by signing in to your account.</p>
                </div>
                <AuthButton />
              </div>
            ) : (
              <iframe
                src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${hostname}${theme === 'dark' ? '&dark_theme=1' : ''}&hl=id`}
                className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            )}
          </div>

          <div className="p-5 bg-muted/5 border-t border-border/30 backdrop-blur-md">
            <p className="text-[10px] text-muted-foreground font-bold text-center uppercase tracking-[0.2em] opacity-60">
              Interactive Theater Experience {user ? `• ${user.displayName}` : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}