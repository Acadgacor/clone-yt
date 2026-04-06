'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePlayerInteractionParams {
  isPlaying: boolean;
  handleTogglePlay: () => void;
  playerRef: React.MutableRefObject<any>;
}

export function usePlayerInteraction({
  handleTogglePlay,
  playerRef,
}: UsePlayerInteractionParams) {
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);

  const isVideoPlaying = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
      return playerRef.current.getPlayerState() === 1;
    }
    return false;
  }, [playerRef]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    
    inactivityTimeoutRef.current = setTimeout(() => { 
      if (isVideoPlaying()) setShowControls(false); 
    }, 2500);
  }, [isVideoPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (isVideoPlaying()) setShowControls(false);
  }, [isVideoPlaying]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Cegah event bubbling
    e.stopPropagation();
    
    // Panggil toggle play (yang sekarang sudah diperbaiki)
    handleTogglePlay(); 
    
    setShowControls(true);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => { 
      if (playerRef.current?.getPlayerState() === 1) setShowControls(false); 
    }, 2500);
  }, [handleTogglePlay, playerRef]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
    } else {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    }
  }, [playerRef]);

  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);

  return {
    showControls,
    isTouch: false,
    handleMouseMove,
    handleMouseLeave,
    handleContainerClick,
    handleDoubleClick,
  };
}