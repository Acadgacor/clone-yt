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
  RotateCcw,
  Info,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
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
  const [autoSyncLive, setAutoSyncLive] = useState(true);

  // Fetch theater config from Firestore
  const configRef = useMemoFirebase(() => doc(firestore, 'settings', 'theater'), [firestore]);
  const { data: config, isLoading } = useDoc<any>(configRef);

  const videoId = config?.videoId || 'zWMj0Vu-z2I';
  const title = config?.title || 'CineView Featured Content';
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

  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const current = playerRef.current.getCurrentTime();
      setCurrentTime(current);
      
      const d = playerRef.current.getDuration();
      // YouTube uses large numbers or 0 for infinite duration on live streams
      const liveDetected = d > 86400 || d === 0;
      setIsLive(liveDetected);
      setDuration(d);
    }
  }, []);

  const refreshQualities = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getAvailableQualityLevels === 'function') {
      const levels = playerRef.current.getAvailableQualityLevels();
      setAvailableQualities(levels);
      // Don't override state if we already have a preference, unless it's the first load
      if (currentQuality === 'auto') {
        setCurrentQuality(playerRef.current.getPlaybackQuality());
      }
    }
  }, [currentQuality]);

  const syncToLive = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      const liveDuration = playerRef.current.getDuration();
      playerRef.current.seekTo(liveDuration, true);
      toast({
        title: "Synced to Live",
        description: "Catching up to real-time broadcast...",
        duration: 2000,
      });
    }
  }, [toast]);

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    const d = event.target.getDuration();
    setDuration(d);
    setIsLive(d > 86400 || d === 0);
    refreshQualities();
  };

  const onPlayerStateChange = (event: any) => {
    const YT = (window as any).YT;
    
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      
      // PERSISTENCE FIX: Re-apply quality whenever playing starts (prevents auto-reset)
      if (currentQuality !== 'auto') {
        playerRef.current.setPlaybackQuality(currentQuality);
      }

      refreshQualities();
      
      // Auto-sync logic for live streams
      if (isLive && autoSyncLive) {
        const player = event.target;
        const current = player.getCurrentTime();
        const total = player.getDuration();
        if (total - current > 4) { // Increased tolerance slightly for smoother experience
          syncToLive();
        }
      }

      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(updateProgress, 1000);
      }
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  useEffect(() => {
    const setupPlayer = () => {
      if (videoId && document.getElementById('youtube-player')) {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try { playerRef.current.destroy(); } catch (e) {}
        }

        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            showinfo: 0,
            disablekb: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady = setupPlayer;
    } else {
      setupPlayer();
    }

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoId, isLive, autoSyncLive, syncToLive, updateProgress, refreshQualities]);

  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    resetInactivityTimeout();
  };

  const handleTogglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
    setShowControls(true);
    resetInactivityTimeout();
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current || isLive) return;
    const time = (value[0] / 100) * duration;
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!playerRef.current) return;
    const vol = value[0];
    setVolume(vol);
    playerRef.current.setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!isFullscreen) playerContainerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleQualityChange = (quality: string) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackQuality === 'function') {
      playerRef.current.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      toast({
        title: "Quality Set",
        description: `Video quality locked to ${qualityLabels[quality] || quality}`,
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share the cinematic experience with others." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy link." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white selection:bg-primary selection:text-black">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/40 p-4 backdrop-blur-xl transition-all hover:bg-black/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="rounded-lg bg-primary p-1.5 transition-transform group-hover:scale-110">
              <Clapperboard className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">CineView</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-[73px]">
        <div 
          ref={playerContainerRef} 
          className="group relative mx-auto max-w-[1400px] aspect-video w-full overflow-hidden bg-black shadow-2xl shadow-primary/5 transition-all duration-700"
          onMouseMove={handleMouseMove}
        >
          <div id="youtube-player" className="h-full w-full pointer-events-none scale-[1.01]" />
          
          {/* Dynamic LIVE Badge */}
          {isLive && (
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-md font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-red-600/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Live
            </div>
          )}

          {/* Centered Minimalist Pause/Play Toggle */}
          <div className={cn(
            "absolute inset-0 z-10 flex items-center justify-center transition-all duration-500",
            showControls ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}>
            <div className="flex items-center gap-12">
               {!isLive && isPlayerReady && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => playerRef.current?.seekTo(currentTime - 10, true)}
                  className="text-white/40 hover:text-white hover:bg-white/10 h-16 w-16 rounded-full transition-all pointer-events-auto"
                >
                  <RotateCcw className="h-10 w-10" />
                </Button>
               )}

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleTogglePlay} 
                className="bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:scale-105 h-24 w-24 rounded-full transition-all shadow-2xl pointer-events-auto"
              >
                {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
              </Button>

               {!isLive && isPlayerReady && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => playerRef.current?.seekTo(currentTime + 10, true)}
                  className="text-white/40 hover:text-white hover:bg-white/10 h-16 w-16 rounded-full transition-all pointer-events-auto"
                >
                  <RotateCcw className="h-10 w-10 scale-x-[-1]" />
                </Button>
               )}
            </div>
          </div>

          {/* Elegant Control Bar Overlay */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-500 transform",
            showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}>
            <div className="flex flex-col gap-5">
              {!isLive && (
                <div className="flex items-center gap-5">
                  <span className="text-[10px] font-mono text-white/60 w-12 text-right">{formatTime(currentTime)}</span>
                  <Slider
                    value={[(currentTime / duration) * 100 || 0]}
                    max={100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-grow cursor-pointer pointer-events-auto"
                  />
                  <span className="text-[10px] font-mono text-white/60 w-12">{formatTime(duration)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/10 rounded-full h-11 w-11">
                          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex items-center group/volume bg-white/5 rounded-full px-2">
                    <Button variant="ghost" size="icon" onClick={handleToggleMute} className="text-white hover:bg-transparent h-11 w-11">
                      {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </Button>
                    <div className="w-0 overflow-hidden transition-all group-hover/volume:w-24 group-hover/volume:mx-2">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={100}
                        onValueChange={handleVolumeChange}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {isLive && (
                    <div className="ml-4 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={syncToLive}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold text-[10px] uppercase tracking-tighter gap-2 px-4 rounded-full border border-red-500/20"
                      >
                        <Activity className="h-3 w-3" />
                        Live Sync
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setAutoSyncLive(!autoSyncLive)}
                              className={cn(
                                "h-11 w-11 rounded-full transition-colors",
                                autoSyncLive ? "text-primary bg-primary/10 border border-primary/20" : "text-white/40 hover:text-white bg-white/5"
                              )}
                            >
                              <Zap className={cn("h-5 w-5", autoSyncLive && "fill-current")} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {autoSyncLive ? "Auto-Sync Enabled" : "Auto-Sync Disabled"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="bg-white/5 text-white/80 hover:text-white hover:bg-white/10 gap-2 h-11 px-4 rounded-full border border-white/10">
                        <Settings className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{qualityLabels[currentQuality] || 'Auto'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-52 bg-black/95 border-white/10 backdrop-blur-2xl text-white rounded-xl shadow-2xl"
                      container={isFullscreen ? playerContainerRef.current : null}
                    >
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-white/40 px-3 py-2">Select Quality</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <div className="max-h-[300px] overflow-y-auto">
                        {availableQualities.length > 0 ? (
                          availableQualities.map((q) => (
                            <DropdownMenuItem 
                              key={q} 
                              onClick={() => handleQualityChange(q)}
                              className={cn(
                                "flex items-center justify-between focus:bg-primary focus:text-black cursor-pointer m-1 rounded-lg px-3 py-2",
                                currentQuality === q && "bg-primary/10 text-primary"
                              )}
                            >
                              <span className="text-xs font-bold">{qualityLabels[q] || q}</span>
                              {currentQuality === q && <Check className="h-4 w-4" />}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled className="text-white/40 italic text-xs p-4">
                            Detecting qualities...
                          </DropdownMenuItem>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleFullscreen} 
                    className="text-white hover:bg-white/10 rounded-full h-11 w-11 bg-white/5 border border-white/10"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Info Section */}
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary font-bold tracking-[0.3em] text-[10px] uppercase">
                  <span className="h-px w-10 bg-primary/40" />
                  {isLive ? 'Broadcasting Now' : 'Now Showing'}
                </div>
                <h2 className="text-5xl font-black tracking-tighter md:text-7xl leading-[0.9]">
                  {title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 py-8 border-y border-white/5">
                <Button 
                  onClick={handleToggleFullscreen}
                  className="bg-white text-black hover:bg-white/90 font-black px-10 h-14 rounded-full text-sm uppercase tracking-widest"
                >
                  Watch Full Screen
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Content Saved" })} className="rounded-full border-white/10 hover:bg-white/5 h-14 px-8 font-bold">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Appreciate
                </Button>
                <Button variant="outline" onClick={handleShare} className="rounded-full border-white/10 hover:bg-white/5 h-14 px-8 font-bold">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="space-y-6">
                <h3 className="flex items-center gap-3 text-xs font-black tracking-widest text-white/40 uppercase">
                  <Info className="h-4 w-4 text-primary" />
                  Synopsis
                </h3>
                <p className="text-2xl leading-relaxed text-white/70 font-medium max-w-3xl">
                  {description}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2rem] bg-white/5 p-8 border border-white/10 backdrop-blur-md shadow-inner">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-6">Theater Data</h4>
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40">Status</span>
                    <span className={cn(
                      "font-mono px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      isLive ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-primary/20 text-primary border border-primary/20"
                    )}>
                      {isLive ? 'Live Stream' : 'Video Content'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40">Active Quality</span>
                    <span className="font-mono bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      {qualityLabels[currentQuality] || 'AUTO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40">Output</span>
                    <span className="font-mono bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      4K Ultra HD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/40">Audio Profile</span>
                    <span className="font-mono bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      Dolby Atmos
                    </span>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-transparent p-px transition-all hover:scale-[1.02]">
                <div className="bg-[#0A0A0A] rounded-[2rem] p-8 space-y-4">
                  <p className="text-sm text-white/50 italic leading-relaxed">
                    "This theater is dedicated to the art of cinema. Enjoy your screening in distraction-free mode."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 p-12 text-center text-white/20 text-[10px] font-black tracking-[0.5em] uppercase">
        &copy; 2024 CineView Labs &bull; Professional Motion Picture UI
      </footer>
    </div>
  );
}
