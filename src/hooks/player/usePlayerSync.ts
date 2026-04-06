'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UsePlayerSyncParams {
  playerRef: React.MutableRefObject<any>;
  videoId: string;
  isPlayerReady: boolean;
  isLive: boolean;
  availableQualities: string[];
  checkIsLive: (player: any) => boolean;
  refreshQualities: () => void;
  setIsPlaying: (value: boolean) => void;
  setIsMuted: (value: boolean) => void;
  setVolume: (value: number) => void;
  setCurrentTime: (value: number) => void;
  setDuration: (value: number) => void;
  setCurrentQuality: (value: string) => void;
  setIsLiveSynced: (value: boolean) => void;
}

interface UsePlayerSyncReturn {
  onPlayerReadyRef: React.MutableRefObject<((event: any) => void) | null>;
  onPlayerStateChangeRef: React.MutableRefObject<((event: any) => void) | null>;
  onPlaybackQualityChangeRef: React.MutableRefObject<((event: any) => void) | null>;
  handleSyncLive: () => void;
  formatQualityLabel: (q: string) => string;
}

export function usePlayerSync({
  playerRef,
  videoId,
  isLive,
  availableQualities,
  checkIsLive,
  refreshQualities,
  setIsPlaying,
  setIsMuted,
  setVolume,
  setCurrentTime,
  setDuration,
  setCurrentQuality,
  setIsLiveSynced,
}: UsePlayerSyncParams): UsePlayerSyncReturn {
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onPlayerReadyRef = useRef<((event: any) => void) | null>(null);
  const onPlayerStateChangeRef = useRef<((event: any) => void) | null>(null);
  const onPlaybackQualityChangeRef = useRef<((event: any) => void) | null>(null);

  // Update progress
  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const time = playerRef.current.getCurrentTime();
      setCurrentTime(time);
      setDuration(playerRef.current.getDuration());
      if (availableQualities.length === 0) refreshQualities();
      
      // PANCARKAN EVENT videoTimeUpdate UNTUK SINKRONISASI CHAT (SSOT)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('videoTimeUpdate', {
            detail: { currentTime: time }
          })
        );
      }
    }
  }, [availableQualities.length, refreshQualities, setCurrentTime, setDuration, playerRef]);

  // Player ready handler
  onPlayerReadyRef.current = useCallback((event: any) => {
    setVolume(event.target.getVolume());
    setIsMuted(event.target.isMuted());
    updateProgress();

    const savedTime = localStorage.getItem(`yt_progress_${videoId}`);
    if (savedTime && !checkIsLive(event.target)) {
      event.target.seekTo(parseFloat(savedTime), true);
    }
  }, [videoId, updateProgress, checkIsLive, setVolume, setIsMuted]);

  // Player state change handler
  onPlayerStateChangeRef.current = useCallback((event: any) => {
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
  }, [updateProgress, setIsPlaying]);

  // Playback quality change handler
  onPlaybackQualityChangeRef.current = useCallback((event: any) => {
    setCurrentQuality(event.data);
  }, [setCurrentQuality]);

  // Sync to live edge
  const handleSyncLive = useCallback(() => {
    if (playerRef.current && isLive) {
      playerRef.current.seekTo(playerRef.current.getDuration(), true);
      setIsLiveSynced(true);
    }
  }, [isLive, playerRef, setIsLiveSynced]);

  // Format quality label
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

  // Sync progress to localStorage
  useEffect(() => {
    const currentTime = playerRef.current?.getCurrentTime?.() ?? 0;
    if (currentTime > 5 && !isLive) {
      localStorage.setItem(`yt_progress_${videoId}`, currentTime.toString());
    }
  }, [videoId, isLive, playerRef]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return {
    onPlayerReadyRef,
    onPlayerStateChangeRef,
    onPlaybackQualityChangeRef,
    handleSyncLive,
    formatQualityLabel,
  };
}
