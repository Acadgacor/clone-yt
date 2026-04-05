'use client';

import { Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { RefObject } from 'react';

interface SettingsDropdownProps {
  currentQuality: string;
  availableQualities: string[];
  handleQualityChange: (q: string) => void;
  formatQualityLabel: (q: string) => string;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
}

export default function SettingsDropdown({
  currentQuality,
  availableQualities,
  handleQualityChange,
  formatQualityLabel,
  fullscreenWrapperRef,
}: SettingsDropdownProps) {
  return (
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
  );
}
