'use client';

import { useState, useCallback, useEffect } from 'react';

interface UsePlayerStateParams {
  playerRef: React.MutableRefObject<any>;
  isPlayerReady: boolean;
  isLive: boolean;
}

interface UsePlayerStateReturn {
  // State
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  currentQuality: string;
  isLiveSynced: boolean;
  isLive: boolean;
  
  // Setters (for external control)
  setIsPlaying: (value: boolean) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setCurrentTime: (value: number) => void;
  setDuration: (value: number) => void;
  setCurrentQuality: (value: string) => void;
  setIsLiveSynced: (value: boolean) => void;
  
  // Handlers
  handleTogglePlay: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (val: number[]) => void;
  handleToggleMute: () => void;
  handleQualityChange: (q: string) => void;
}

export function usePlayerState({ playerRef, isPlayerReady, isLive }: UsePlayerStateParams): UsePlayerStateReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [isLiveSynced, setIsLiveSynced] = useState(true);

  // Monitor live sync status - when playing live, check if we're at the edge
  useEffect(() => {
    if (!isLive || !playerRef.current) return;
    
    const checkSync = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        // Consider synced if within 3 seconds of the live edge
        const synced = duration > 0 && Math.abs(duration - current) < 3;
        setIsLiveSynced(synced);
      }
    };
    
    const interval = setInterval(checkSync, 1000);
    return () => clearInterval(interval);
  }, [isLive, playerRef]);

  const handleTogglePlay = useCallback(() => {
    if (!isPlayerReady || !playerRef.current) return;
    
    // Ambil status langsung dari YouTube (1 = Playing)
    const playerState = playerRef.current.getPlayerState();
    
    if (playerState === 1) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isPlayerReady, playerRef, setIsPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      // Mark as not synced when manually seeking in live stream
      if (isLive) {
        setIsLiveSynced(false);
      }
    }
  }, [playerRef, isLive, setIsLiveSynced]);

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
  }, [isMuted, playerRef]);

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setVolume(playerRef.current.getVolume());
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  }, [isMuted, playerRef, setVolume]);

  const handleQualityChange = useCallback((q: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(q);
      setCurrentQuality(q);
    }
  }, [playerRef]);

  return {
    // State
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    currentQuality,
    isLiveSynced,
    isLive,
    
    // Setters
    setIsPlaying,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setCurrentQuality,
    setIsLiveSynced,
    
    // Handlers
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    handleQualityChange,
  };
}
