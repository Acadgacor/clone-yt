'use client';

import { Slider } from '@/components/ui/slider';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  isLive: boolean;
}

export default function ProgressBar({
  currentTime,
  duration,
  handleSeek,
  isLive,
}: ProgressBarProps) {
  if (isLive) {
    return null;
  }

  return (
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
  );
}
