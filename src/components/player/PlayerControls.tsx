'use client';

import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  Check,
  MessageSquare,
  MessageSquareOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
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
      {((isTouch ? showControls : !isPlaying) && isPlayerReady) && (
        <AnimatedContent
          distance={12}
          duration={0.25}
          initialOpacity={0}
          scale={0.95}
          className="absolute inset-0 z-25 w-full h-full flex items-center justify-center"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
            className="text-white w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-150"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 ml-0.5" fill="currentColor" />
            )}
          </Button>
        </AnimatedContent>
      )}

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
          {!isLive && (
            <div className="w-full px-3 sm:px-4 md:px-6 pb-1.5 md:pb-2 flex items-center gap-2 group/progress pointer-events-auto">
              <div className="w-full h-4 flex items-center cursor-pointer">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  onValueChange={(val) => handleSeek(val[0])}
                  className="w-full orange-slider h-1.5 sm:h-1 transition-all duration-150 hover:h-2 sm:hover:h-1.5"
                />
              </div>
            </div>
          )}

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

                <div className="flex items-center gap-0.5 group/volume">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleMute}
                    className="text-white hover:bg-white/10 hover:scale-105 active:scale-95 h-8 w-8 sm:h-9 sm:w-9 md:h-9 md:w-9 rounded-lg transition-all duration-150"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </Button>
                  <div className="hidden md:block w-0 group-hover/volume:w-16 lg:group-hover/volume:w-20 overflow-hidden transition-all duration-200 orange-slider">
                    <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                  </div>
                </div>
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 hover:scale-105 active:scale-95 h-8 w-8 sm:h-9 sm:w-9 md:h-9 md:w-9 rounded-lg relative transition-all duration-150"
                    >
                      <Settings size={16} />
                      {currentQuality.includes('hd') && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-[7px] font-bold px-1 py-0.5 rounded-full uppercase">
                          HD
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="top"
                    container={fullscreenWrapperRef.current}
                    className="liquid-glass text-white rounded-xl min-w-[100px] p-1.5 border-white/[0.06] mb-1.5 shadow-xl z-[100]"
                  >
                    <div className="px-2 py-1 text-[8px] font-semibold uppercase tracking-widest text-white/40">
                      Quality
                    </div>
                    {availableQualities.map((q) => (
                      <DropdownMenuItem
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        className="text-[10px] font-medium cursor-pointer rounded-lg hover:bg-white/10 px-2 py-1.5 uppercase tracking-wide flex justify-between items-center transition-colors duration-100"
                      >
                        {formatQualityLabel(q)} {currentQuality === q && <Check className="h-3 w-3 text-[#FF6B00]" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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