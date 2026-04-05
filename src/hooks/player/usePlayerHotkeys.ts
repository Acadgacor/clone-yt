'use client';

import { useHotkeys } from 'react-hotkeys-hook';

interface UsePlayerHotkeysParams {
  playerRef: React.MutableRefObject<any>;
  isPlayerReady: boolean;
  volume: number;
  duration: number;
  handleTogglePlay: () => void;
  handleToggleMute: () => void;
  handleToggleFullscreen: () => void;
  handleVolumeChange: (val: number[]) => void;
}

export function usePlayerHotkeys({
  playerRef,
  isPlayerReady,
  volume,
  duration,
  handleTogglePlay,
  handleToggleMute,
  handleToggleFullscreen,
  handleVolumeChange,
}: UsePlayerHotkeysParams): void {
  // Play/Pause
  useHotkeys('space, k', handleTogglePlay, { preventDefault: true });

  // Mute
  useHotkeys('m', handleToggleMute, { preventDefault: true });

  // Fullscreen
  useHotkeys('f', handleToggleFullscreen, { preventDefault: true });

  // Seek forward
  useHotkeys('ArrowRight, l', () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    }
  }, { preventDefault: true });

  // Seek backward
  useHotkeys('ArrowLeft, j', () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10, true);
    }
  }, { preventDefault: true });

  // Volume up
  useHotkeys('ArrowUp', () => {
    handleVolumeChange([Math.min(volume + 10, 100)]);
  }, { preventDefault: true }, [volume, handleVolumeChange]);

  // Volume down
  useHotkeys('ArrowDown', () => {
    handleVolumeChange([Math.max(volume - 10, 0)]);
  }, { preventDefault: true }, [volume, handleVolumeChange]);

  // Seek to percentage
  useHotkeys('0,1,2,3,4,5,6,7,8,9', (event) => {
    if (playerRef.current && duration > 0 && event.key) {
      const percent = parseInt(event.key, 10);
      if (!isNaN(percent)) {
        playerRef.current.seekTo((duration / 10) * percent, true);
      }
    }
  }, { preventDefault: true }, [duration]);
}
