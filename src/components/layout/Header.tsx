'use client';

import Link from 'next/link';
import {
  Clapperboard,
  ChevronLeft,
  MessageSquare,
  MessageSquareOff,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthButton from '@/components/auth/AuthButton';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({ showChat, setShowChat, theme, toggleTheme }: HeaderProps) {
  return (
    <header className="flex-none h-14 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1 shadow-lg shadow-primary/20">
            <Clapperboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic hidden sm:block">CineView</h1>
        </Link>
        <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest bg-muted border border-border px-4 h-8 hover:bg-muted/80">
          <Link href="/setup">
            <ChevronLeft className="mr-1 h-3 w-3" /> Change Video
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowChat(!showChat)}
          className={cn(
            "rounded-full h-8 w-8 border border-border transition-all",
            showChat ? "bg-primary/10 text-primary border-primary/30" : "bg-muted hover:bg-muted/80"
          )}
        >
          {showChat ? <MessageSquare className="h-4 w-4" /> : <MessageSquareOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 bg-muted border border-border hover:bg-muted/80">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <AuthButton />
      </div>
    </header>
  );
}
