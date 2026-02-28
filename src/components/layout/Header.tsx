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
    <header className="flex-none h-12 md:h-14 border-b border-border bg-background/80 backdrop-blur-xl px-3 md:px-8 flex items-center justify-between z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/" className="flex items-center gap-1.5 md:gap-2">
          <div className="rounded-lg bg-primary p-1 shadow-lg shadow-primary/20">
            <Clapperboard className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase italic hidden xs:block">CineView</h1>
        </Link>
        <Button variant="ghost" size="sm" asChild className="rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-muted border border-border px-3 md:px-4 h-7 md:h-8 hover:bg-muted/80">
          <Link href="/setup">
            <ChevronLeft className="mr-0.5 md:mr-1 h-3 w-3" /> <span className="hidden sm:inline">Change Video</span><span className="sm:hidden">Setup</span>
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-7 w-7 md:h-8 md:w-8 bg-muted border border-border hover:bg-muted/80">
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
        </Button>
        <AuthButton />
      </div>
    </header>
  );
}
