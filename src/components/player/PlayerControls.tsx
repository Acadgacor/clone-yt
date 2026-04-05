'use client';

import {
  Play,
  Pause,
  Maximize,
  Minimize,
  MessageSquare,
  MessageSquareOff
} from 'lucide-react';
import MainPlayButton from './controls/MainPlayButton';
import ProgressBar from './controls/ProgressBar';
import VolumeControl from './controls/VolumeControl';
import SettingsDropdown from './controls/SettingsDropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RefObject } from 'react';
import AnimatedContent from '@/components/AnimatedContent';

interface PlayerControlsProps {
  isPlaying: boolean;
  isPlayerReady: boolean;
  handleTogglePlay: () => void;
  showControls: boolean;
  isMuted: boolean;
  volume: number;
  handleToggleMute: () => void;
  handleVolumeChange: (val: number[]) => void;
  isLive: boolean;
  handleSyncLive: () => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  currentQuality: string;
  availableQualities: string[];
  handleQualityChange: (q: string) => void;
  formatQualityLabel: (q: string) => string;
  isFullscreen: boolean;
  handleToggleFullscreen: () => void;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
  duration: number;
  currentTime: number;
  handleSeek: (time: number) => void;
  isTouch?: boolean;
}

export default function PlayerControls({
  isPlaying,
  isPlayerReady,
  handleTogglePlay,
  showControls,
  isMuted,
  volume,
  handleToggleMute,
  handleVolumeChange,
  isLive,
  handleSyncLive,
  showChat,
  setShowChat,
  currentQuality,
  availableQualities,
  handleQualityChange,
  formatQualityLabel,
  isFullscreen,
  handleToggleFullscreen,
  fullscreenWrapperRef,
  duration,
  currentTime,
  handleSeek,
  isTouch,
}: PlayerControlsProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return duration >= 3600 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* Tombol Play Besar di Tengah */}
      <MainPlayButton
        isPlaying={isPlaying}
        isPlayerReady={isPlayerReady}
        isTouch={isTouch}
        showControls={showControls}
        handleTogglePlay={handleTogglePlay}
      />

      {/* Control Bar Bawah */}
      <div
        className={`absolute bottom-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          showControls
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        <AnimatedContent
          distance={10}
          duration={0.25}
          direction="vertical"
          initialOpacity={0}
          className="w-full"
          onClick={stopPropagation}
        >
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            handleSeek={handleSeek}
            isLive={isLive}
          />

          <div className="p-2 sm:p-3 md:px-6 md:pb-4 lg:pb-6 flex items-center justify-between w-full pointer-events-none">
            <div className="flex gap-1 sm:gap-1.5 pointer-events-auto">
              <div className="glass-pill h-9 sm:h-9 md:h-10 flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTogglePlay}
                  className="text-white hover:bg-white/10 hover:scale-105 active:scale-95 h-8 w-8 sm:h-9 sm:w-9 md:h-9 md:w-9 rounded-lg transition-all duration-150"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </Button>

                <VolumeControl
                  isMuted={isMuted}
                  volume={volume}
                  handleToggleMute={handleToggleMute}
                  handleVolumeChange={handleVolumeChange}
                />
                {!isLive && duration > 0 && (
                  <div className="text-white text-[9px] sm:text-[10px] md:text-[11px] font-mono tabular-nums tracking-tight px-1 sm:px-1.5">
                    {formatTime(currentTime)} <span className="text-white/30">/</span> {formatTime(duration)}
                  </div>
                )}
                {isLive && (
                  <div
                    className="flex items-center gap-1.5 cursor-pointer group px-1.5"
                    onClick={handleSyncLive}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-500"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span className="text-white font-semibold text-[9px] md:text-[10px] tracking-wider uppercase">
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1 sm:gap-1.5 pointer-events-auto">
              <div className="glass-pill h-9 sm:h-9 md:h-10 flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(!showChat)}
                  className={cn(
                    'text-white hover:bg-white/10 hover:scale-105 active:scale-95 h-8 w-8 sm:h-9 sm:w-9 md:h-9 md:w-9 rounded-lg transition-all duration-150',
                    showChat && 'bg-white/[0.06]'
                  )}
                >
                  {showChat ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
                </Button>

                <SettingsDropdown
                  currentQuality={currentQuality}
                  availableQualities={availableQualities}
                  handleQualityChange={handleQualityChange}
                  formatQualityLabel={formatQualityLabel}
                  fullscreenWrapperRef={fullscreenWrapperRef}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFullscreen}
                  className="text-white hover:bg-white/10 hover:scale-105 active:scale-95 h-8 w-8 sm:h-9 sm:w-9 md:h-9 md:w-9 rounded-lg transition-all duration-150"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </>
  );
}