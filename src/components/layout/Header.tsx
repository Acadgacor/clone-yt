'use client';

import Link from 'next/link';
import {
  Clapperboard,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthButton from '@/components/auth/AuthButton';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="flex-none h-14 md:h-16 bg-black/80 border-b border-white/[0.04] px-5 md:px-8 flex items-center justify-between z-50 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/" className="flex items-center gap-3 md:gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 blur-lg bg-gradient-to-br from-red-600/40 to-red-700/40 rounded-xl scale-110 group-hover:scale-125 transition-transform duration-500" />
            <div className="relative rounded-xl bg-gradient-to-br from-red-600 to-red-700 p-2 shadow-lg shadow-red-600/40 group-hover:shadow-red-600/60 transition-all duration-300">
              <Clapperboard className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
          <h1 className="text-base md:text-xl font-bold tracking-tight uppercase italic hidden xs:block bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">CineView</h1>
        </Link>
        <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] px-4 md:px-5 h-8 md:h-9 transition-all duration-300">
          <Link href="/setup">
            <ChevronLeft className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">Change Video</span><span className="sm:hidden">Setup</span>
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 md:h-9 md:w-9 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] hover:scale-110 active:scale-95 transition-all duration-200">
          {theme === 'dark' ? <Sun className="h-4 w-4 md:h-4.5 md:w-4.5" /> : <Moon className="h-4 w-4 md:h-4.5 md:w-4.5" />}
        </Button>
        <AuthButton />
      </div>
    </header>
  );
}
