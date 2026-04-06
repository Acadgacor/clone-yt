'use client';

import { useRef, RefObject } from 'react';
import { useYouTubeIframe } from './player/useYouTubeIframe';
import { usePlayerState } from './player/usePlayerState';
import { usePlayerInteraction } from './player/usePlayerInteraction';
import { usePlayerHotkeys } from './player/usePlayerHotkeys';
import { usePlayerFullscreen } from './player/usePlayerFullscreen';
import { usePlayerSync } from './player/usePlayerSync';

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
  isLiveSynced: boolean;
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
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // 1. YouTube Iframe API initialization (refs will be populated by usePlayerSync)
  const onPlayerReadyRef = useRef<((event: any) => void) | null>(null);
  const onPlayerStateChangeRef = useRef<((event: any) => void) | null>(null);
  const onPlaybackQualityChangeRef = useRef<((event: any) => void) | null>(null);

  const { playerRef, isPlayerReady, isLive, availableQualities, checkIsLive, refreshQualities } = useYouTubeIframe({
    videoId,
    onPlayerReadyRef,
    onPlayerStateChangeRef,
    onPlaybackQualityChangeRef,
  });

  // 2. Player state management
  const {
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    currentQuality,
    isLiveSynced,
    setIsPlaying,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setCurrentQuality,
    setIsLiveSynced,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    handleToggleMute,
    handleQualityChange,
  } = usePlayerState({ playerRef, isPlayerReady, isLive });

  // 3. Player sync (progress, localStorage, callbacks)
  const { handleSyncLive, formatQualityLabel } = usePlayerSync({
    playerRef,
    videoId,
    isPlayerReady,
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
  });

  // 4. Player interaction (touch, mouse, controls visibility)
  const {
    showControls,
    isTouch,
    handleMouseMove,
    handleMouseLeave,
    handleContainerClick,
    handleDoubleClick,
  } = usePlayerInteraction({
    isPlaying,
    handleTogglePlay,
    playerRef,
  });

  // 5. Fullscreen management
  const { isFullscreen, handleToggleFullscreen } = usePlayerFullscreen({
    playerContainerRef,
    fullscreenWrapperRef,
  });

  // 6. Keyboard shortcuts
  usePlayerHotkeys({
    playerRef,
    isPlayerReady,
    volume,
    duration,
    handleTogglePlay,
    handleToggleMute,
    handleToggleFullscreen,
    handleVolumeChange,
  });

  // Return combined state and handlers
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
    isLiveSynced,
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
