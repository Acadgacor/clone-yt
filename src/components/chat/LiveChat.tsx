'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageSquare, ExternalLink, Lock, Send, User as UserIcon, Crown, Wrench, Star, MessageSquareOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AuthButton from '@/components/auth/AuthButton';
import { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface LiveChatProps {
  videoId: string;
  theme: 'dark' | 'light';
  hostname: string;
  user: User | null;
  isFullscreen?: boolean;
}

export default function LiveChat({ videoId, theme, hostname, user, isFullscreen }: LiveChatProps) {
  const [liveChatId, setLiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  useEffect(() => {
    const fetchLiveChatId = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const details = data.items[0].liveStreamingDetails;
          if (details) {
            if (details.activeLiveChatId) {
              setLiveChatId(details.activeLiveChatId);
            } else {
              setIsReplay(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching liveChatId:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (videoId && API_KEY) fetchLiveChatId();
  }, [videoId, API_KEY]);

  useEffect(() => {
    if (!liveChatId || !API_KEY) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${API_KEY}`
        );
        const data = await res.json();
        if (data.items) {
          setMessages(data.items);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [liveChatId, API_KEY]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150); // slight delay to let framer-motion register the new element height
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !liveChatId) return;

    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      toast({ title: "Akses Ditolak", description: "Kamu harus login ulang untuk mengirim pesan.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              liveChatId: liveChatId,
              type: 'textMessageEvent',
              textMessageDetails: {
                messageText: newMessage,
              },
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Gagal mengirim pesan");
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Pesan Ditolak",
        description: "Gagal mengirim pesan. Chat ini mungkin di-set ke 'Members Only' (Khusus Member) oleh kreator, atau Anda terkena Slow Mode.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex flex-col flex-none bg-background transition-all relative z-10 overflow-hidden shadow-sm ${isFullscreen
      ? 'w-full landscape:w-[280px] lg:landscape:w-[320px] h-[35vh] landscape:h-full border-t border-t-white/10 landscape:border-t-0 landscape:border-l landscape:border-l-white/10 rounded-none'
      : 'w-full lg:w-[320px] xl:w-[380px] border-t lg:border-t-0 lg:border-l border-border h-[400px] lg:h-full rounded-xl'
      }`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isFullscreen ? 'border-white/10' : 'border-border bg-muted/20'}`}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">Live Chat</span>
        </div>
        {videoId && (
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-foreground/50 hover:text-primary rounded-lg">
            <a href={`https://www.youtube.com/live_chat?v=${videoId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      <div ref={scrollRef} className={`flex-grow overflow-y-auto overflow-x-hidden bg-card/50 ${isReplay && !liveChatId ? '' : 'p-4 space-y-4'}`}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest text-center">
            Memuat Obrolan...
          </div>
        ) : isReplay && !liveChatId ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="bg-muted/10 p-4 rounded-full">
              <MessageSquareOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold tracking-tight text-foreground">Rekaman Chat Tidak Tersedia</h3>
              <p className="text-[12px] leading-relaxed text-muted-foreground max-w-[250px] mx-auto">
                YouTube memblokir akses pihak ketiga untuk menampilkan siaran ulang Live Chat secara aman.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-2 text-xs font-semibold rounded-full border-white/10 shadow-sm bg-white/5 hover:bg-white/10">
              <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                Lihat di YouTube
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </a>
            </Button>
          </div>
        ) : !liveChatId ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest text-center">
            {API_KEY ? "Chat Tidak Tersedia" : "API Key Belum Diisi"}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const { isChatOwner, isChatModerator, isChatSponsor, displayName, profileImageUrl } = msg.authorDetails;

              let nameColor = "text-muted-foreground";
              let textColor = "text-foreground";
              let BadgeIcon = null;

              if (isChatOwner) {
                nameColor = "text-yellow-500";
                BadgeIcon = <Crown className="h-3 w-3 text-yellow-500" fill="currentColor" />;
              } else if (isChatModerator) {
                nameColor = "text-blue-500";
                BadgeIcon = <Wrench className="h-3 w-3 text-blue-500" />;
              } else if (isChatSponsor) {
                nameColor = "text-green-500 font-bold";
                textColor = "text-foreground";
                BadgeIcon = <Star className="h-3 w-3 text-green-500" fill="currentColor" />;
              }

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex gap-2.5 items-start w-full group"
                >
                  <Avatar className="h-7 w-7 mt-0.5 shrink-0 border border-white/10 shadow-sm">
                    <AvatarImage src={profileImageUrl} />
                    <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 bg-white/5 backdrop-blur-md p-3 rounded-2xl rounded-tl-sm border border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="flex items-center gap-1.5 flex-wrap mb-1 relative z-10">
                      <span className={`text-[12px] font-bold tracking-tight ${nameColor}`}>
                        @{displayName}
                      </span>
                      {BadgeIcon}
                    </div>
                    <span className={`text-[13px] leading-relaxed break-words relative z-10 ${textColor}`}>
                      {msg.snippet.textMessageDetails?.messageText || msg.snippet.displayMessage}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {!isReplay && (
        <div className={`p-3 border-t ${isFullscreen ? 'border-white/10 bg-black/20' : 'border-border bg-background'}`}>
          {!user ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sign in to chat</p>
              <AuthButton />
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Avatar className="h-8 w-8 flex-none">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Kirim pesan publik..."
                disabled={isSending || !liveChatId}
                className="flex-grow bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground"
              />
              <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="rounded-full flex-none h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
