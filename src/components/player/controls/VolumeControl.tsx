'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VolumeControlProps {
  isMuted: boolean;
  volume: number;
  handleToggleMute: () => void;
  handleVolumeChange: (val: number[]) => void;
}

export default function VolumeControl({
  isMuted,
  volume,
  handleToggleMute,
  handleVolumeChange,
}: VolumeControlProps) {
  return (
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
  );
}
