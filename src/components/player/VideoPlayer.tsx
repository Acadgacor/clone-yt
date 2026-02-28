'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import Script from 'next/script';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  Check,
  MessageSquare,
  MessageSquareOff
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

interface VideoPlayerProps {
  videoId: string;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

export default function VideoPlayer({ videoId, fullscreenWrapperRef, showChat, setShowChat }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isLive, setIsLive] = useState(false);

  // Shortcut Handlers
  const handleTogglePlay = useCallback(() => {
    if (!isPlayerReady || !playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  }, [isPlayerReady, isPlaying]);

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setVolume(playerRef.current.getVolume());
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      fullscreenWrapperRef.current?.requestFullscreen();
    }
  }, [isFullscreen, fullscreenWrapperRef]);

  // Register Hotkeys
  useHotkeys('space, k', handleTogglePlay, { preventDefault: true });
  useHotkeys('m', handleToggleMute, { preventDefault: true });
  useHotkeys('f', handleToggleFullscreen, { preventDefault: true });
  useHotkeys('0,1,2,3,4,5,6,7,8,9', (_, handler) => {
    if (playerRef.current && duration > 0) {
      const percent = parseInt(handler.keys, 10);
      playerRef.current.seekTo((duration / 10) * percent, true);
    }
  }, { preventDefault: true }, [duration]);


  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      setDuration(playerRef.current.getDuration());
      setIsLive(checkIsLive(playerRef.current));
      if (availableQualities.length === 0) refreshQualities();
    }
  }, [checkIsLive, refreshQualities, availableQualities.length]);

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    setVolume(event.target.getVolume());
    setIsMuted(event.target.isMuted());
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

  const handleVolumeChange = (val: number[]) => {
    if (playerRef.current) {
      const newVolume = val[0];
      setVolume(newVolume);
      playerRef.current.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
      if (newVolume === 0 && !isMuted) {
          playerRef.current.mute();
          setIsMuted(true);
      }
    }
  };

  const handleQualityChange = (q: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
    }
  };

  const formatQualityLabel = (q: string) => {
    const mapping: Record<string, string> = {
      'hd2160': '2160p',
      'hd1440': '1440p',
      'hd1080': '1080p',
      'hd720': '720p',
      'large': '480p',
      'medium': '360p',
      'small': '240p',
      'tiny': '144p',
      'auto': 'Auto',
    };
    return mapping[q] || q.toUpperCase();
  };

  return (
    <div
      className="flex-grow relative group bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleTogglePlay}
    >
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      <div id="youtube-player" className="h-full w-full" />

      <div className={cn(
        "absolute inset-0 z-10 w-full h-full flex items-center justify-center transition-opacity duration-300 bg-black/20",
        !isPlaying && isPlayerReady ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
          <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm">
              {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className='ml-2' />}
          </Button>
      </div>

      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to parent
      >
        <div className="px-4 md:px-8 pb-4 md:pb-8">
          {/* TODO: Add progress bar */}

          <div className="flex justify-between gap-4">
            <div className="glass-pill h-10 md:h-12">
              <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button variant="ghost" size="icon" onClick={handleToggleMute} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
                  <span className="text-white/90 font-black text-xs tracking-widest uppercase group-hover:text-white transition-colors">Live</span>
                </div>
              )}
            </div>

            <div className="glass-pill h-10 md:h-12">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowChat(!showChat)} 
                className={cn(
                  "text-white hover:bg-white/10 h-10 w-10 rounded-full",
                  showChat && "bg-white/15"
                )}
              >
                {showChat ? <MessageSquare size={18} /> : <MessageSquareOff size={18} />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-10 w-10 rounded-full relative">
                    <Settings size={18} />
                    {currentQuality.includes('hd') && (
                      <span className="absolute top-1 right-1 bg-red-600 text-[8px] font-bold px-1 rounded-sm uppercase">HD</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  container={fullscreenWrapperRef.current}
                  className="liquid-glass text-white rounded-xl min-w-[120px] p-2 border-white/10 mb-2 shadow-2xl"
                >
                  <div className="px-2 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/40">Quality</div>
                  {availableQualities.map((q) => (
                    <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-sm font-bold cursor-pointer rounded-lg hover:bg-white/10 p-2 uppercase tracking-widest flex justify-between items-center">
                      {formatQualityLabel(q)} {currentQuality === q && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={handleToggleFullscreen} className="text-white hover:bg-white/10 h-10 w-10 rounded-full">
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
