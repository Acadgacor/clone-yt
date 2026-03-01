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
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { RefObject } from 'react';

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
      <div
        className={cn(
          'absolute inset-0 z-10 w-full h-full flex items-center justify-center transition-opacity duration-300 bg-black/20',
          !isPlaying && isPlayerReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={stopPropagation}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTogglePlay}
          className="text-white w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 backdrop-blur-sm"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
          ) : (
            <Play className="w-8 h-8 md:w-10 md:h-10 ml-1 md:ml-2" fill="currentColor" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0',
          isLive ? 'pointer-events-none' : ''
        )}
        onClick={stopPropagation}
      >
         {!isLive && (
          <div className="w-full px-3 md:px-6 lg:px-8 pb-1 md:pb-2 flex items-center gap-2 group/progress">
            <div className="w-full h-3 md:h-4 flex items-center cursor-pointer">
                 <Slider
                value={[currentTime]}
                max={duration}
                onValueChange={(val) => handleSeek(val[0])}
                className="w-full orange-slider h-1 md:h-1.5 group-hover/progress:h-2 md:group-hover/progress:h-2.5 transition-all duration-200"
              />
            </div>
          </div>
        )}

        <div className="p-3 md:px-6 md:pb-6 lg:px-8 lg:pb-8 flex items-center justify-between w-full pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <div className="glass-pill h-9 md:h-11">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePlay}
                className="text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9 rounded-full"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </Button>

              <div className="flex items-center gap-1 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9 rounded-full"
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <div className="hidden md:block w-0 group-hover/volume:w-16 lg:group-hover/volume:w-20 overflow-hidden transition-all duration-300 orange-slider">
                  <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                </div>
              </div>
              {!isLive && duration > 0 && (
                <div className="text-white text-[11px] md:text-xs font-mono tabular-nums tracking-tighter">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
              {isLive && (
                <div
                  className="flex items-center gap-1.5 cursor-pointer group px-1"
                  onClick={handleSyncLive}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-600"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                  </span>
                  <span className="text-white/90 font-black text-[9px] md:text-[10px] tracking-widest uppercase group-hover:text-white transition-colors">
                    Live
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <div className="glass-pill h-9 md:h-11">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  'text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9 rounded-full',
                  showChat && 'bg-white/10'
                )}
              >
                {showChat ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9 rounded-full relative"
                  >
                    <Settings size={16} />
                    {currentQuality.includes('hd') && (
                      <span className="absolute top-0.5 right-0.5 bg-red-600 text-[6px] font-bold px-0.5 rounded-sm uppercase">
                        HD
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  container={fullscreenWrapperRef.current}
                  className="liquid-glass text-white rounded-xl min-w-[100px] p-1.5 border-white/10 mb-2 shadow-2xl"
                >
                  <div className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                    Quality
                  </div>
                  {availableQualities.map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className="text-[11px] font-bold cursor-pointer rounded-lg hover:bg-white/10 p-1.5 uppercase tracking-widest flex justify-between items-center"
                    >
                      {formatQualityLabel(q)} {currentQuality === q && <Check className="h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9 rounded-full"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
