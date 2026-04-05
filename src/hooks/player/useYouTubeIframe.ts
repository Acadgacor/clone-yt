'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseYouTubeIframeParams {
  videoId: string;
  onPlayerReadyRef: React.MutableRefObject<((event: any) => void) | null>;
  onPlayerStateChangeRef: React.MutableRefObject<((event: any) => void) | null>;
  onPlaybackQualityChangeRef: React.MutableRefObject<((event: any) => void) | null>;
}

interface UseYouTubeIframeReturn {
  playerRef: React.MutableRefObject<any>;
  isPlayerReady: boolean;
  isLive: boolean;
  availableQualities: string[];
  checkIsLive: (player: any) => boolean;
  refreshQualities: () => void;
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubeIframe({
  videoId,
  onPlayerReadyRef,
  onPlayerStateChangeRef,
  onPlaybackQualityChangeRef,
}: UseYouTubeIframeParams): UseYouTubeIframeReturn {
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

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

  // Internal ready handler
  const handlePlayerReady = useCallback((event: any) => {
    setIsPlayerReady(true);
    setIsLive(checkIsLive(event.target));
    // Delay refreshQualities to allow YouTube API to load quality levels
    setTimeout(() => refreshQualities(), 500);
    onPlayerReadyRef.current?.(event);
  }, [checkIsLive, refreshQualities, onPlayerReadyRef]);

  // Internal state change handler
  const handlePlayerStateChange = useCallback((event: any) => {
    onPlayerStateChangeRef.current?.(event);
  }, [onPlayerStateChangeRef]);

  // Internal quality change handler
  const handlePlaybackQualityChange = useCallback((event: any) => {
    onPlaybackQualityChangeRef.current?.(event);
  }, [onPlaybackQualityChangeRef]);

  // Setup YouTube Iframe API
  useEffect(() => {
    if (!videoId) return;
    setIsPlayerReady(false);
    setIsLive(false);
    setAvailableQualities([]);

    const setupPlayer = () => {
      const existingPlayer = document.getElementById('youtube-player');
      if (existingPlayer) {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
        }
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: handlePlayerReady,
            onStateChange: handlePlayerStateChange,
            onPlaybackQualityChange: handlePlaybackQualityChange,
          },
        });
      }
    };

    // Load YouTube IFrame API if not already loaded
    if (!window.YT?.Player) {
      // Check if script is already being loaded
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = setupPlayer;
    } else {
      setupPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, handlePlayerReady, handlePlayerStateChange, handlePlaybackQualityChange]);

  return {
    playerRef,
    isPlayerReady,
    isLive,
    availableQualities,
    checkIsLive,
    refreshQualities,
  };
}
