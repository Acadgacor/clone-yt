
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
  fullscreenWrapperRef
}: PlayerControlsProps) {
  return (
    <>
      <div
        className={cn(
          'absolute inset-0 z-10 w-full h-full flex items-center justify-center transition-opacity duration-300 bg-black/20',
          !isPlaying && isPlayerReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTogglePlay}
          className="text-white w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm"
        >
          {isPlaying ? (
            <Pause size={40} fill="currentColor" />
          ) : (
            <Play size={40} fill="currentColor" className="ml-2" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to parent
      >
        <div className="px-4 md:px-8 pb-4 md:pb-8">
          {/* TODO: Add progress bar */}

          <div className="flex justify-between gap-4">
            <div className="glass-pill h-10 md:h-12">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePlay}
                className="text-white hover:bg-white/10 h-10 w-10 rounded-full"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white/10 h-10 w-10 rounded-full"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                <div className="hidden md:block w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 orange-slider">
                  <Slider value={[isMuted ? 0 : volume]} max={100} onValueChange={handleVolumeChange} />
                </div>
              </div>

              {isLive && (
                <div
                  className="flex items-center gap-2 cursor-pointer group px-2"
                  onClick={handleSyncLive}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-red-600"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-white/90 font-black text-xs tracking-widest uppercase group-hover:text-white transition-colors">
                    Live
                  </span>
                </div>
              )}
            </div>

            <div className="glass-pill h-10 md:h-12">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  'text-white hover:bg-white/10 h-10 w-10 rounded-full',
                  showChat && 'bg-white/15'
                )}
              >
                {showChat ? <MessageSquare size={18} /> : <MessageSquareOff size={18} />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-10 w-10 rounded-full relative"
                  >
                    <Settings size={18} />
                    {currentQuality.includes('hd') && (
                      <span className="absolute top-1 right-1 bg-red-600 text-[8px] font-bold px-1 rounded-sm uppercase">
                        HD
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  container={fullscreenWrapperRef.current}
                  className="liquid-glass text-white rounded-xl min-w-[120px] p-2 border-white/10 mb-2 shadow-2xl"
                >
                  <div className="px-2 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/40">
                    Quality
                  </div>
                  {availableQualities.map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className="text-sm font-bold cursor-pointer rounded-lg hover:bg-white/10 p-2 uppercase tracking-widest flex justify-between items-center"
                    >
                      {formatQualityLabel(q)} {currentQuality === q && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="text-white hover:bg-white/10 h-10 w-10 rounded-full"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
