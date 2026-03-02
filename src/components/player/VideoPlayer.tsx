'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import Script from 'next/script';
import { useHotkeys } from 'react-hotkeys-hook';
import PlayerControls from './PlayerControls';

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
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isLive, setIsLive] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const handleTouch = () => setIsTouch(true);
    window.addEventListener('touchstart', handleTouch, { once: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

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
  useHotkeys('ArrowRight, l', () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    }
  }, { preventDefault: true });
  useHotkeys('ArrowLeft, j', () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
    }
  }, { preventDefault: true });
  useHotkeys('ArrowUp', () => {
    handleVolumeChange([Math.min(volume + 10, 100)]);
  }, { preventDefault: true }, [volume]);
  useHotkeys('ArrowDown', () => {
    handleVolumeChange([Math.max(volume - 10, 0)]);
  }, { preventDefault: true }, [volume]);
  useHotkeys('0,1,2,3,4,5,6,7,8,9', (event) => {
    if (playerRef.current && duration > 0 && event.key) {
      const percent = parseInt(event.key, 10);
      if (!isNaN(percent)) {
        playerRef.current.seekTo((duration / 10) * percent, true);
      }
    }
  }, { preventDefault: true }, [duration]);


  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (currentTime > 5 && !isLive) {
      localStorage.setItem(`yt_progress_${videoId}`, currentTime.toString());
    }
  }, [currentTime, isLive, videoId]);

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
    setVolume(event.target.getVolume());
    setIsMuted(event.target.isMuted());
    setIsLive(checkIsLive(event.target));
    refreshQualities();
    updateProgress();

    const savedTime = localStorage.getItem(`yt_progress_${videoId}`);
    if (savedTime && !checkIsLive(event.target)) {
      event.target.seekTo(parseFloat(savedTime), true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    const YT = (window as any).YT;
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (!progressIntervalRef.current) progressIntervalRef.current = setInterval(updateProgress, 250);
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const onPlaybackQualityChange = (event: any) => {
    setCurrentQuality(event.data);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
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
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onPlaybackQualityChange: onPlaybackQualityChange
          },
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
    if (isTouch) return;
    setShowControls(true);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const handleContainerClick = () => {
    if (isTouch) {
      const willShow = !showControls;
      setShowControls(willShow);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (willShow) {
        inactivityTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
      }
      return;
    }

    if (!showControls) {
      setShowControls(true);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
      return;
    }
    handleTogglePlay();
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
      'hd2160': '2160',
      'hd1440': '1440',
      'hd1080': '1080',
      'hd720': '720',
      'large': '480',
      'medium': '360',
      'small': '240',
      'tiny': '144',
      'auto': 'Auto',
    };
    return mapping[q] || q.replace('hd', '').toUpperCase();
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
    } else {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    }
  };

  return (
    <div
      className="w-full h-full relative group bg-black overflow-hidden flex items-center justify-center z-10"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
      onDoubleClick={handleDoubleClick}
    >
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      <div id="youtube-player" className="w-full h-full pointer-events-none absolute inset-0 z-0" />

      {/* Overlay to catch mouse events specifically on desktop fullscreen when controls are hidden */}
      <div className="absolute inset-0 z-10" />

      <PlayerControls
        isPlaying={isPlaying}
        isPlayerReady={isPlayerReady}
        handleTogglePlay={handleTogglePlay}
        showControls={showControls}
        isMuted={isMuted}
        volume={volume}
        handleToggleMute={handleToggleMute}
        handleVolumeChange={handleVolumeChange}
        isLive={isLive}
        handleSyncLive={handleSyncLive}
        showChat={showChat}
        setShowChat={setShowChat}
        currentQuality={currentQuality}
        availableQualities={availableQualities}
        handleQualityChange={handleQualityChange}
        formatQualityLabel={formatQualityLabel}
        isFullscreen={isFullscreen}
        handleToggleFullscreen={handleToggleFullscreen}
        fullscreenWrapperRef={fullscreenWrapperRef}
        duration={duration}
        currentTime={currentTime}
        handleSeek={handleSeek}
        isTouch={isTouch}
      />
    </div>
  );
}
