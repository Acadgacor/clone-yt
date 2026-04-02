'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface UseVideoPlayerParams {
  videoId: string;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
}

interface UseVideoPlayerReturn {
  // Refs
  playerRef: React.MutableRefObject<any>;
  playerContainerRef: React.RefObject<HTMLDivElement>;
  
  // State
  isPlayerReady: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  availableQualities: string[];
  currentQuality: string;
  isLive: boolean;
  isTouch: boolean;
  
  // Handlers
  handleTogglePlay: () => void;
  handleToggleMute: () => void;
  handleToggleFullscreen: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (val: number[]) => void;
  handleQualityChange: (q: string) => void;
  handleMouseMove: () => void;
  handleMouseLeave: () => void;
  handleContainerClick: () => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSyncLive: () => void;
  formatQualityLabel: (q: string) => string;
}

export function useVideoPlayer({ videoId, fullscreenWrapperRef }: UseVideoPlayerParams): UseVideoPlayerReturn {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
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

  // Touch detection
  useEffect(() => {
    const handleTouch = () => setIsTouch(true);
    window.addEventListener('touchstart', handleTouch, { once: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  // Check if video is live
  const checkIsLive = useCallback((player: any) => {
    if (!player || typeof player.getDuration !== 'function') return false;
    const d = player.getDuration();
    const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
    return d === 0 || (videoData && videoData.isLive);
  }, []);

  // Refresh available quality levels
  const refreshQualities = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getAvailableQualityLevels === 'function') {
      const levels = playerRef.current.getAvailableQualityLevels();
      if (levels && levels.length > 0) setAvailableQualities(levels);
    }
  }, []);

  // Update progress
  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      setCurrentTime(playerRef.current.getCurrentTime());
      setDuration(playerRef.current.getDuration());
      setIsLive(checkIsLive(playerRef.current));
      if (availableQualities.length === 0) refreshQualities();
    }
  }, [checkIsLive, refreshQualities, availableQualities.length]);

  // Player ready handler
  const onPlayerReady = useCallback((event: any) => {
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
  }, [videoId, checkIsLive, refreshQualities, updateProgress]);

  // Player state change handler
  const onPlayerStateChange = useCallback((event: any) => {
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
  }, [updateProgress]);

  // Playback quality change handler
  const onPlaybackQualityChange = useCallback((event: any) => {
    setCurrentQuality(event.data);
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

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, []);

  const handleSyncLive = useCallback(() => {
    if (playerRef.current && isLive) {
      playerRef.current.seekTo(playerRef.current.getDuration(), true);
    }
  }, [isLive]);

  const handleVolumeChange = useCallback((val: number[]) => {
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
  }, [isMuted]);

  const handleQualityChange = useCallback((q: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
    }
  }, []);

  const formatQualityLabel = useCallback((q: string) => {
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
  }, []);

  const handleMouseMove = useCallback(() => {
    if (isTouch) return;
    
    if (!showControls) setShowControls(true);
    
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    
    inactivityTimeoutRef.current = setTimeout(() => { 
      if (isPlaying) setShowControls(false); 
    }, 3000);
  }, [isTouch, showControls, isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying && !isTouch) {
      setShowControls(false);
    }
  }, [isPlaying, isTouch]);

  const handleContainerClick = useCallback(() => {
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
  }, [isTouch, showControls, isPlaying, handleTogglePlay]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
    } else {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    }
  }, []);

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
  }, { preventDefault: true }, [volume, handleVolumeChange]);
  useHotkeys('ArrowDown', () => {
    handleVolumeChange([Math.max(volume - 10, 0)]);
  }, { preventDefault: true }, [volume, handleVolumeChange]);
  useHotkeys('0,1,2,3,4,5,6,7,8,9', (event) => {
    if (playerRef.current && duration > 0 && event.key) {
      const percent = parseInt(event.key, 10);
      if (!isNaN(percent)) {
        playerRef.current.seekTo((duration / 10) * percent, true);
      }
    }
  }, { preventDefault: true }, [duration]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isFull && playerContainerRef.current) {
        playerContainerRef.current.focus();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync progress to localStorage
  useEffect(() => {
    if (currentTime > 5 && !isLive) {
      localStorage.setItem(`yt_progress_${videoId}`, currentTime.toString());
    }
  }, [currentTime, isLive, videoId]);

  // Setup YouTube Iframe API
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
  }, [videoId, onPlayerReady, onPlayerStateChange, onPlaybackQualityChange]);

  return {
    // Refs
    playerRef,
    playerContainerRef,
    
    // State
    isPlayerReady,
    isPlaying,
    isFullscreen,
    showControls,
    duration,
    currentTime,
    volume,
    isMuted,
    availableQualities,
    currentQuality,
    isLive,
    isTouch,
    
    // Handlers
    handleTogglePlay,
    handleToggleMute,
    handleToggleFullscreen,
    handleSeek,
    handleVolumeChange,
    handleQualityChange,
    handleMouseMove,
    handleMouseLeave,
    handleContainerClick,
    handleDoubleClick,
    handleSyncLive,
    formatQualityLabel,
  };
}
