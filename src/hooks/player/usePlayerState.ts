'use client';

import { useState, useCallback } from 'react';

interface UsePlayerStateParams {
  playerRef: React.MutableRefObject<any>;
  isPlayerReady: boolean;
}

interface UsePlayerStateReturn {
  // State
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  currentQuality: string;
  
  // Setters (for external control)
  setIsPlaying: (value: boolean) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setCurrentTime: (value: number) => void;
  setDuration: (value: number) => void;
  setCurrentQuality: (value: string) => void;
  
  // Handlers
  handleTogglePlay: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (val: number[]) => void;
  handleToggleMute: () => void;
  handleQualityChange: (q: string) => void;
}

export function usePlayerState({ playerRef, isPlayerReady }: UsePlayerStateParams): UsePlayerStateReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');

  const handleTogglePlay = useCallback(() => {
    if (!isPlayerReady || !playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  }, [isPlayerReady, isPlaying, playerRef]);

  const handleSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, [playerRef]);

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
    
    // Setters
    setIsPlaying,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setCurrentQuality,
    
    // Handlers
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    handleQualityChange,
  };
}
