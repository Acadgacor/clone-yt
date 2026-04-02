'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, ExternalLink, Send, User as UserIcon, MessageSquareOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AuthButton from '@/components/auth/AuthButton';
import { User } from '@supabase/supabase-js';
import { useLiveChat } from '@/hooks/useLiveChat';
import { ytService } from '@/services/YouTubeService';
import ChatMessageItem from './ChatMessageItem';

interface LiveChatProps {
  videoId: string;
  theme: 'dark' | 'light';
  hostname: string;
  user: User | null;
  isFullscreen?: boolean;
}

export default function LiveChat({ videoId, theme, hostname, user, isFullscreen }: LiveChatProps) {
  const {
    liveChatId,
    messages,
    newMessage,
    setNewMessage,
    isSending,
    isReplay,
    isLoading,
    handleSendMessage
  } = useLiveChat(videoId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasApiKey = ytService.getKey() !== '';

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (scrollElement) {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'auto'
            });
          }
        }, 30);
      });
    }
  }, [messages]);

  return (
    <div className={`flex flex-col flex-none bg-background transition-all relative z-10 overflow-hidden shadow-sm ${isFullscreen
      ? 'w-full h-[40vh] min-h-[200px] landscape:h-full landscape:min-h-0 border-t border-white/10 landscape:border-t-0 landscape:border-l landscape:border-l-white/10 rounded-none'
      : 'w-full border-t lg:border-t-0 lg:border-l border-border h-full rounded-xl'
      }`}>
      <div className={`px-2 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between border-b shrink-0 ${isFullscreen ? 'border-white/10 bg-black/30' : 'border-border bg-muted/20'}`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MessageSquare className={`text-primary ${isFullscreen ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          <span className={`font-bold uppercase tracking-widest text-foreground ${isFullscreen ? 'text-[10px]' : 'text-[10px] sm:text-xs'}`}>Live Chat</span>
        </div>
        {videoId && (
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-foreground/50 hover:text-primary rounded-lg">
            <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      <div ref={scrollRef} className={`flex-grow overflow-y-auto overflow-x-hidden bg-card/50 ${isReplay && !liveChatId ? '' : isFullscreen ? 'p-2 space-y-2' : 'p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4'}`}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest text-center">
            Memuat Obrolan...
          </div>
        ) : isReplay && !liveChatId ? (
          <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
            <div className="bg-muted/10 p-3 sm:p-4 rounded-full">
              <MessageSquareOff className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">Rekaman Chat Tidak Tersedia</h3>
              <p className="text-[11px] sm:text-[12px] leading-relaxed text-muted-foreground max-w-[200px] sm:max-w-[250px] mx-auto">
                YouTube memblokir akses pihak ketiga untuk menampilkan siaran ulang Live Chat secara aman.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-2 text-[11px] sm:text-xs font-semibold rounded-full border-white/10 shadow-sm bg-white/5 hover:bg-white/10">
              <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                Lihat di YouTube
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </a>
            </Button>
          </div>
        ) : !liveChatId ? (
          <div className="h-full flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest text-center">
            {hasApiKey ? "Chat Tidak Tersedia" : "API Key Belum Diisi"}
          </div>
        ) : (
          messages.slice(-50).map((msg) => (
            <ChatMessageItem key={msg.id} msg={msg} isFullscreen={isFullscreen} />
          ))
        )}
      </div>

      {!isReplay && (
        <div className={`border-t shrink-0 ${isFullscreen ? 'p-2 border-white/10 bg-black/40' : 'p-2 sm:p-3 pb-4 sm:pb-6 border-border bg-background'}`}>
          {!user ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground">Sign in to chat</p>
              <AuthButton />
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-1.5 sm:gap-2'}`}>
              <Avatar className={`flex-none ${isFullscreen ? 'h-6 w-6' : 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8'}`}>
                <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture || ''} />
                <AvatarFallback><UserIcon className={`${isFullscreen ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4'}`} /></AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Kirim pesan..."
                disabled={isSending || !liveChatId}
                className={`flex-grow bg-muted/50 border border-border rounded-full focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground ${isFullscreen ? 'px-3 py-1.5 text-xs' : 'px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs md:text-sm'}`}
              />
              <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className={`rounded-full flex-none ${isFullscreen ? 'h-7 w-7' : 'h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9'}`}>
                <Send className={`${isFullscreen ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4'}`} />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
