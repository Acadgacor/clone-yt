'use client';

import { useMemo } from 'react';
import { MessageSquare, HelpCircle, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AuthButton from '@/components/auth/AuthButton';
import { User } from 'firebase/auth';

interface LiveChatProps {
  videoId: string;
  theme: 'dark' | 'light';
  hostname: string;
  user: User | null;
}

export default function LiveChat({ videoId, theme, hostname, user }: LiveChatProps) {
  const chatSrc = useMemo(() => {
    const url = new URL('https://www.youtube.com/live_chat');
    url.searchParams.append('v', videoId);
    url.searchParams.append('embed_domain', hostname);
    if (theme === 'dark') {
      url.searchParams.append('dark_theme', '1');
    }
    return url.href;
  }, [videoId, hostname, theme]);

  return (
    <div className="w-full lg:w-[320px] xl:w-[380px] flex-none bg-background border-t lg:border-t-0 lg:border-l border-border flex flex-col h-[300px] lg:h-full transition-all relative z-10">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Live Discussion</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-foreground/20 cursor-help" /></TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[180px] text-[8px] liquid-glass p-2.5 rounded-xl border-white/10 shadow-2xl text-white">
                Check browser "Third-party cookies" settings if chat is empty.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {videoId && (
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-foreground/30 hover:text-primary rounded-lg">
            <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
      
      <div className="flex-grow overflow-hidden bg-black relative">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-3">
            <Lock className="h-6 w-6 text-primary/30" />
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Sign in to Join Chat</p>
            <AuthButton />
          </div>
        ) : (
          <iframe
            src={chatSrc}
            className="w-full h-full border-none opacity-90"
          />
        )}
      </div>
    </div>
  );
}
