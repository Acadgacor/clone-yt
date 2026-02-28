'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import Script from 'next/script';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
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
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoId: string;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
}

export default function VideoPlayer({ videoId, fullscreenWrapperRef }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isLive, setIsLive] = useState(false);

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
    }
  };

  const formatQualityLabel = (q: string) => {
    const mapping: Record<string, string> = {
      'hd2160': '2160',
      'hd1440': '1440',
      'hd1080': '1080',
      'hd720': '720',
      'large': '480',
      'medium': '360',
      'small': '240',
      'tiny': '144',
      'auto': 'AUTO',
    };
    return mapping[q] || q.toUpperCase().replace('HD', '');
  };

  return (
    <div
      className="flex-grow relative group bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      <div id="youtube-player" className="h-full w-full pointer-events-none" />

      <div className={cn(
        "absolute inset-x-0 bottom-8 z-10 flex justify-between gap-4 px-8 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>

        <div className="glass-pill h-10 md:h-12">
          <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/10 h-7 w-7 rounded-full">
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </Button>

          <div className="flex items-center gap-2 group/volume">
            <Button variant="ghost" size="icon" onClick={() => handleVolumeChange([isMuted ? 50 : 0])} className="text-white hover:bg-white/10 h-7 w-7 rounded-full">
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </Button>
            <div className="hidden md:block w-0 group-hover/volume:w-16 overflow-hidden transition-all duration-300 orange-slider">
              <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
            </div>
          </div>

          {isLive && (
            <div className="flex items-center gap-2 cursor-pointer group px-1" onClick={handleSyncLive}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-600"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
              </span>
              <span className="text-white/90 font-black text-[8px] tracking-widest uppercase group-hover:text-white transition-colors">Live</span>
            </div>
          )}
        </div>

        <div className="glass-pill h-10 md:h-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-7 w-7 rounded-full relative">
                <Settings size={16} />
                {currentQuality !== 'auto' && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-[6px] font-bold px-1 rounded-sm uppercase">HD</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              container={fullscreenWrapperRef.current}
              className="liquid-glass text-white rounded-xl min-w-[100px] p-2 border-white/10 mb-4 shadow-2xl"
            >
              <div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Quality</div>
              {availableQualities.map((q) => (
                <DropdownMenuItem key={q} onClick={() => handleQualityChange(q)} className="text-[9px] font-bold cursor-pointer rounded-lg hover:bg-white/10 p-2 uppercase tracking-widest flex justify-between items-center">
                  {formatQualityLabel(q)} {currentQuality === q && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={() => isFullscreen ? document.exitFullscreen() : fullscreenWrapperRef.current?.requestFullscreen()} className="text-white hover:bg-white/10 h-7 w-7 rounded-full">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        </div>

      </div>
    </div>
  );
}
