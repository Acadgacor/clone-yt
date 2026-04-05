'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

interface UsePlayerFullscreenParams {
  playerContainerRef: RefObject<HTMLDivElement>;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
}

interface UsePlayerFullscreenReturn {
  isFullscreen: boolean;
  handleToggleFullscreen: () => void;
}

export function usePlayerFullscreen({
  playerContainerRef,
  fullscreenWrapperRef,
}: UsePlayerFullscreenParams): UsePlayerFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      fullscreenWrapperRef.current?.requestFullscreen();
    }
  }, [isFullscreen, fullscreenWrapperRef]);

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
  }, [playerContainerRef]);

  return {
    isFullscreen,
    handleToggleFullscreen,
  };
}
