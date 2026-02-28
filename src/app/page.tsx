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
  Check,
  Settings
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

  // Sync theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      
      const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Entering Theater...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      
      {/* Navbar */}
      <header className="flex-none h-14 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1 shadow-lg shadow-primary/20">
              <Clapperboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic hidden sm:block">CineView</h1>
          </Link>
          <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest bg-muted border border-border px-4 h-8 hover:bg-muted/80">
            <Link href="/setup">
              <ChevronLeft className="mr-1 h-3 w-3" /> Change Video
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 bg-muted border border-border hover:bg-muted/80">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <AuthButton />
        </div>
      </header>

      {/* Main split-screen area */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden" ref={fullscreenWrapperRef}>
        
        {/* Left: Video Area */}
        <div 
          className="flex-grow relative group bg-black overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          <div id="youtube-player" className="h-full w-full pointer-events-none" />
          
          {/* Separated Water Glass Controls (Corner Pills) */}
          <div className={cn(
            "absolute inset-x-0 bottom-8 z-10 flex justify-between gap-4 px-8 transition-all duration-500 transform",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
          )}>
            
            {/* Left Pill: Playback & Volume */}
            <div className="glass-pill h-12 md:h-14">
              <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/10 h-8 w-8 rounded-full">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button variant="ghost" size="icon" onClick={() => handleVolumeChange([isMuted ? 50 : 0])} className="text-white hover:bg-white/10 h-8 w-8 rounded-full">
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <div className="hidden md:block w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 orange-slider">
                  <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                </div>
              </div>

              {isLive && (
                <div className="flex items-center gap-2 cursor-pointer group px-2" onClick={handleSyncLive}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-600"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-white/90 font-black text-[9px] tracking-widest uppercase group-hover:text-white transition-colors">Live</span>
                </div>
              )}
            </div>

            {/* Right Pill: Settings & Fullscreen */}
            <div className="glass-pill h-12 md:h-14">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 rounded-full relative">
                    <Settings size={18} />
                    {currentQuality !== 'auto' && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-[7px] font-bold px-1 rounded-sm uppercase">HD</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="liquid-glass text-white rounded-2xl min-w-[140px] p-2 border-white/10 mb-4 shadow-2xl">
                  <div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Quality</div>
                  {availableQualities.map((q) => (
                    <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-[9px] font-bold cursor-pointer rounded-xl hover:bg-white/10 p-2 uppercase tracking-widest flex justify-between items-center">
                      {q} {currentQuality === q && <Check className="h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={() => isFullscreen ? document.exitFullscreen() : fullscreenWrapperRef.current?.requestFullscreen()} className="text-white hover:bg-white/10 h-8 w-8 rounded-full">
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
            </div>

          </div>
        </div>

        {/* Right: Live Chat Area */}
        <div className="w-full lg:w-[360px] xl:w-[400px] flex-none bg-background border-l border-border flex flex-col h-[350px] lg:h-full">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Live Discussion</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-foreground/20 cursor-help" /></TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-[9px] liquid-glass p-3 rounded-xl border-white/10 shadow-2xl text-white">
                    Check browser "Third-party cookies" settings if chat is empty.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {videoId && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-foreground/30 hover:text-primary rounded-lg">
                <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="flex-grow overflow-hidden bg-black">
            {!user ? (
               <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Lock className="h-8 w-8 text-primary/30" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Sign in to Join Chat</p>
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