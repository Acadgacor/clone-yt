'use client';

import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedContent from '@/components/AnimatedContent';

interface MainPlayButtonProps {
  isPlaying: boolean;
  isPlayerReady: boolean;
  handleTogglePlay: () => void;

  isTouch?: boolean;
  showControls?: boolean;
}

export default function MainPlayButton({
  isPlaying,
  isPlayerReady,
  handleTogglePlay,
  showControls = true,
}: MainPlayButtonProps) {

  if (!isPlayerReady || !showControls) {
    return null;
  }

  return (
    <AnimatedContent
      distance={12}
      duration={0.25}
      initialOpacity={0}
      scale={0.95}
      className="absolute inset-0 z-30 w-full h-full flex items-center justify-center pointer-events-none"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleTogglePlay();
        }}
        className="pointer-events-auto text-white w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-150"
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9" fill="currentColor" />
        ) : (
          <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 ml-0.5" fill="currentColor" />
        )}
      </Button>
    </AnimatedContent>
  );
}