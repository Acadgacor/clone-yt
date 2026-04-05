'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePlayerInteractionParams {
  isPlaying: boolean;
  handleTogglePlay: () => void;
  playerRef: React.MutableRefObject<any>;
}

interface UsePlayerInteractionReturn {
  // State
  showControls: boolean;
  isTouch: boolean;
  
  // Handlers
  handleMouseMove: () => void;
  handleMouseLeave: () => void;
  handleContainerClick: () => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function usePlayerInteraction({
  isPlaying,
  handleTogglePlay,
  playerRef,
}: UsePlayerInteractionParams): UsePlayerInteractionReturn {
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  // Touch detection
  useEffect(() => {
    const handleTouch = () => setIsTouch(true);
    window.addEventListener('touchstart', handleTouch, { once: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  // Mouse UI Handlers
  const handleMouseMove = useCallback(() => {
    // KUNCI: Hapus `if (isTouch) return;` di sini biar mouse tetap fungsi walau di laptop touchscreen!
    
    if (!showControls) setShowControls(true);
    
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    
    inactivityTimeoutRef.current = setTimeout(() => { 
      if (isPlaying) setShowControls(false); 
    }, 3000);
  }, [showControls, isPlaying]);

  const handleMouseLeave = useCallback(() => {
    // Kasih sedikit delay (0.5 detik) biar gak glitch kalau mouse numpang lewat
    if (isPlaying) {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 500); 
    }
  }, [isPlaying]);

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
  }, [playerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);

  return {
    // State
    showControls,
    isTouch,
    
    // Handlers
    handleMouseMove,
    handleMouseLeave,
    handleContainerClick,
    handleDoubleClick,
  };
}
