'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { 
  Clapperboard, 
  ThumbsUp, 
  Share2, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Settings, 
  Loader2, 
  Volume2, 
  VolumeX,
  Info,
  Check,
  Activity,
  User,
  MessageSquare,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function Home() {
  const { toast } = useToast();
  const playerRef = useRef<any>(null);
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firestore = useFirestore();

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
  const [showChat, setShowChat] = useState(false);
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
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
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

  const configRef = useMemoFirebase(() => doc(firestore, 'settings', 'theater'), [firestore]);
  const { data: config, isLoading } = useDoc<any>(configRef);

  const videoId = config?.videoId || 'zWMj0Vu-z2I';
  const title = config?.title || 'CineView Featured Content';
  const channelName = config?.channelName || 'CineView Labs';
  const description = 'Dive into an immersive cinematic journey. This curated experience brings you the finest visual storytelling, optimized for your personal web theater.';

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
      if (levels && levels.length > 0) {
        setAvailableQualities(levels);
      }
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const current = playerRef.current.getCurrentTime();
      setCurrentTime(current);
      const d = playerRef.current.getDuration();
      setDuration(d);
      setIsLive(checkIsLive(playerRef.current));
      // Refresh qualities occasionally as they might load late
      if (availableQualities.length === 0) refreshQualities();
    }
  }, [checkIsLive, refreshQualities, availableQualities.length]);

  const syncToLive = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(99999999, true);
      toast({ title: "Synced to Live", description: "Catching up to real-time broadcast..." });
    }
  }, [toast]);

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    setIsLive(checkIsLive(event.target));
    refreshQualities();
  };

  const onPlayerStateChange = (event: any) => {
    const YT = (window as any).YT;
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      refreshQualities();
      if (currentQuality !== 'auto' && typeof playerRef.current.setPlaybackQuality === 'function') {
        playerRef.current.setPlaybackQuality(currentQuality);
      }
      if (!progressIntervalRef.current) progressIntervalRef.current = setInterval(updateProgress, 1000);
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  useEffect(() => {
    setIsPlayerReady(false);
    setIsPlaying(false);
    setAvailableQualities([]);
    const setupPlayer = () => {
      if (videoId && document.getElementById('youtube-player')) {
        if (playerRef.current?.destroy) playerRef.current.destroy();
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: { 
            autoplay: 0, 
            controls: 0, 
            modestbranding: 1, 
            rel: 0, 
            iv_load_policy: 3, 
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
    inactivityTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3500);
  };

  const handleTogglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;
    if (isPlaying && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    } else if (typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (val: number[]) => {
    if (playerRef.current && !isLive && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo((val[0] / 100) * duration, true);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      setVolume(val[0]);
      playerRef.current.setVolume(val[0]);
      setIsMuted(val[0] === 0);
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted && typeof playerRef.current.unMute === 'function') {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 50);
      setIsMuted(false);
    } else if (typeof playerRef.current.mute === 'function') {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (!fullscreenWrapperRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleQualityChange = (q: string) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackQuality === 'function') {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
      toast({ title: "Quality Locked", description: `Video quality set to ${qualityLabels[q] || q}` });
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 p-3 md:p-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-lg bg-primary p-1.5 shadow-lg shadow-primary/20">
              <Clapperboard className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic">CineView</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full bg-muted/50 border border-border h-9 w-9 md:h-10 md:w-10"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 border border-border h-9 w-9 md:h-10 md:w-10">
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-[65px] md:pt-[75px]">
        <div className="mx-auto max-w-[1600px] w-full p-4 md:p-6 lg:p-8">
          
          {/* Fullscreen Wrapper Container */}
          <div 
            ref={fullscreenWrapperRef}
            className={cn(
              "flex flex-col lg:flex-row gap-4 transition-all duration-500 bg-background",
              isFullscreen && "p-0 bg-black h-screen w-screen overflow-hidden"
            )}
          >
            <div className={cn(
              "flex-grow transition-all duration-500 ease-in-out relative",
              showChat && isLive ? "lg:w-[75%]" : "w-full",
              isFullscreen && "h-full"
            )}>
              <div 
                ref={playerContainerRef} 
                className={cn(
                  "group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-2xl md:rounded-[2.5rem] transition-all duration-500",
                  isFullscreen && "rounded-none h-full aspect-auto"
                )}
                onMouseMove={handleMouseMove}
              >
                <div className="cinema-glow" />
                <div id="youtube-player" className="h-full w-full pointer-events-none scale-[1.005]" />
                
                {isLive && (
                  <div className="absolute top-6 left-6 z-30 flex items-center gap-2 bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase shadow-xl backdrop-blur-2xl">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live
                  </div>
                )}

                {/* Controls Overlay */}
                <div className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center transition-all duration-500",
                  showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleTogglePlay}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 h-16 w-16 md:h-24 md:w-24 rounded-full shadow-2xl"
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1.5" fill="currentColor" />}
                  </Button>
                </div>

                {/* Bottom Bar */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-500",
                  showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
                )}>
                  <div className="flex flex-col gap-4">
                    {!isLive && (
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-white/60">{formatTime(currentTime)}</span>
                        <Slider
                          value={[(currentTime / duration) * 100 || 0]}
                          max={100}
                          onValueChange={handleSeek}
                          className="flex-grow"
                        />
                        <span className="text-[10px] font-mono text-white/60">{formatTime(duration)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white liquid-glass rounded-full h-10 w-10">
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </Button>

                        <div className="flex items-center liquid-glass rounded-full px-2">
                          <Button variant="ghost" size="icon" onClick={handleToggleMute} className="text-white h-10 w-10">
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </Button>
                          <div className="hidden md:block w-20 mx-2">
                            <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                          </div>
                        </div>

                        {isLive && (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              onClick={syncToLive}
                              className="liquid-glass text-red-500 border-red-500/20 font-black text-[10px] uppercase h-10 px-4 rounded-full"
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              Sync Live
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setShowChat(!showChat)}
                              className={cn(
                                "liquid-glass rounded-full h-10 w-10",
                                showChat ? "text-primary border-primary/40" : "text-white/60"
                              )}
                            >
                              <MessageSquare size={20} />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="liquid-glass text-white h-10 px-4 rounded-full text-[10px] font-black uppercase">
                              {qualityLabels[currentQuality] || 'Auto'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="liquid-glass text-white rounded-xl min-w-[120px]"
                            container={fullscreenWrapperRef.current}
                          >
                            {availableQualities.length > 0 ? (
                              availableQualities.map((q) => (
                                <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-[10px] font-bold cursor-pointer">
                                  {qualityLabels[q] || q} {currentQuality === q && <Check className="ml-2 h-3 w-3" />}
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <DropdownMenuItem disabled className="text-[10px] font-bold opacity-50">
                                Auto
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" onClick={handleToggleFullscreen} className="liquid-glass text-white rounded-full h-10 w-10">
                          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Panel - Integrated into Fullscreen Wrapper */}
            {showChat && isLive && videoId && (
              <div className={cn(
                "w-full lg:w-[350px] bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col transition-all duration-500",
                isFullscreen && "lg:w-[400px] rounded-none border-l border-y-0 border-r-0 bg-black/40 backdrop-blur-2xl h-full"
              )}>
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Chat</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-grow">
                  <iframe
                    src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${hostname}`}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-10 md:mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-bold tracking-[0.3em] text-[10px] uppercase">
                    <span className="h-px w-10 bg-primary/40" />
                    {isLive ? 'Broadcasting Now' : 'Featured Presentation'}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-widest">
                    <User className="h-4 w-4 text-primary" />
                    {channelName}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 py-8 border-y border-border">
                  <Button onClick={handleToggleFullscreen} className="rounded-full px-8 h-12 md:h-14 font-black uppercase text-xs tracking-widest">
                    Watch Fullscreen
                  </Button>
                  <Button variant="outline" className="rounded-full px-6 h-12 md:h-14 font-bold text-xs">
                    <ThumbsUp className="mr-2 h-4 w-4" /> Liked
                  </Button>
                  <Button variant="outline" className="rounded-full px-6 h-12 md:h-14 font-bold text-xs">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>

                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-xs font-black tracking-widest text-muted-foreground uppercase">
                    <Info className="h-4 w-4 text-primary" /> Synopsis
                  </h3>
                  <p className="text-lg md:text-xl leading-relaxed text-muted-foreground font-medium max-w-3xl">
                    {description}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[2.5rem] bg-muted/30 p-8 border border-border shadow-inner">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Theater Metrics</h4>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                        isLive ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {isLive ? 'LIVE' : 'VOD'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Locked Quality</span>
                      <span className="bg-muted px-3 py-1 rounded-full text-[9px] font-black uppercase">
                        {qualityLabels[currentQuality] || 'AUTO'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Visual Engine</span>
                      <span className="bg-muted px-3 py-1 rounded-full text-[9px] font-black uppercase">
                        Cinema 4K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border p-12 text-center text-muted-foreground/30 text-[10px] font-black tracking-[0.5em] uppercase">
        &copy; 2024 CineView Labs &bull; Professional Motion Picture UI
      </footer>
    </div>
  );
}