'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, ExternalLink, Lock, Send, User as UserIcon, Crown, Wrench, Star, MessageSquareOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AuthButton from '@/components/auth/AuthButton';
import { User } from 'firebase/auth';
import { useLiveChat } from '@/hooks/useLiveChat';
import { ytService } from '@/services/YouTubeService';

const BUBBLE_RADIUS = 'rounded-2xl';

interface LiveChatProps {
  videoId: string;
  theme: 'dark' | 'light';
  hostname: string;
  user: User | null;
  isFullscreen?: boolean;
}

const formatChatMessage = (text: string | undefined) => {
  if (!text) return null;
  // Regex untuk mendeteksi teks di antara dua titik dua, misal :nama-emot:
  const parts = text.split(/(:[a-zA-Z0-9_-]+:)/g);

  return parts.map((part, i) => {
    if (part.startsWith(':') && part.endsWith(':')) {
      // Hapus titik dua dan ubah strip menjadi spasi untuk dibaca
      const emotName = part.slice(1, -1).replace(/-/g, ' ');
      return (
        <span key={i} className="inline-flex items-center justify-center bg-white/10 text-muted-foreground text-[9px] px-1.5 py-[1px] rounded mx-0.5 uppercase tracking-wider font-bold border border-white/5">
          {emotName}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

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
              behavior: 'smooth'
            });
          }
        }, 30);
      });
    }
  }, [messages]);



  return (
    <div className={`flex flex-col flex-none bg-background transition-all relative z-10 overflow-hidden shadow-sm ${isFullscreen
      ? 'w-full h-[35vh] landscape:h-full border-t border-t-white/10 landscape:border-t-0 landscape:border-l landscape:border-l-white/10 rounded-none'
      : 'w-full border-t lg:border-t-0 lg:border-l border-border h-[400px] lg:h-full rounded-xl'
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
            {hasApiKey ? "Chat Tidak Tersedia" : "API Key Belum Diisi"}
          </div>
        ) : (
          messages.slice(-50).map((msg) => {
            const { isChatOwner, isChatModerator, isChatSponsor, displayName, profileImageUrl } = msg.authorDetails;
            const type = msg.snippet.type;

            let nameColor = "text-muted-foreground";
            let textColor = "text-foreground";
            let BadgeIcon = null;

            // Default background untuk chat biasa
            let customBg = "bg-white/5 backdrop-blur-md border-white/10 shadow-sm";
            let messageContent = null;

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

            // --- LOGIKA SUPER CHAT & MEMBERSHIP ---
            if (type === 'superChatEvent') {
              const details = msg.snippet.superChatDetails;
              customBg = "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 backdrop-blur-md shadow-[0_0_10px_rgba(234,179,8,0.2)]";
              messageContent = (
                <div className="flex flex-col mt-0.5">
                  <span className={`font-black text-yellow-500 ${isFullscreen ? 'text-[11px]' : 'text-[13px]'}`}>{details?.amountDisplayString}</span>
                  {details?.userComment && (
                    <span className={`${isFullscreen ? 'text-[11px]' : 'text-[13px]'} leading-relaxed break-words text-foreground mt-0.5`}>
                      {formatChatMessage(details.userComment)}
                    </span>
                  )}
                </div>
              );
            } else if (type === 'superStickerEvent') {
              const details = msg.snippet.superStickerDetails;
              customBg = "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 backdrop-blur-md shadow-[0_0_10px_rgba(6,182,212,0.2)]";
              messageContent = (
                <div className="flex flex-col mt-0.5">
                  <span className={`font-black text-cyan-400 ${isFullscreen ? 'text-[11px]' : 'text-[13px]'}`}>{details?.amountDisplayString}</span>
                  {details?.superStickerMetadata?.url && (
                    <img
                      src={details.superStickerMetadata.url}
                      alt={details.superStickerMetadata.altText}
                      className="h-14 w-14 mt-1 object-contain drop-shadow-lg"
                    />
                  )}
                </div>
              );
            } else if (type === 'newSponsorEvent') {
              customBg = "bg-green-500/20 border-green-500/50 backdrop-blur-md";
              messageContent = (
                <div className="flex flex-col mt-0.5">
                  <span className={`font-bold text-green-400 ${isFullscreen ? 'text-[10px]' : 'text-[12px]'} uppercase tracking-wide flex items-center gap-1`}>
                    🎉 Welcome to {msg.snippet.newSponsorDetails?.memberLevelName || 'Membership'}!
                  </span>
                </div>
              );
            } else if (type === 'membershipGiftingEvent') {
              const details = msg.snippet.membershipGiftingDetails;
              customBg = "bg-green-600/30 border-green-500/50 backdrop-blur-md";
              messageContent = (
                <div className="flex flex-col mt-0.5">
                  <span className={`font-bold text-green-400 ${isFullscreen ? 'text-[11px]' : 'text-[13px]'} uppercase tracking-wide`}>
                    🎁 Merch/Member Gift!
                  </span>
                  <span className={`${isFullscreen ? 'text-[11px]' : 'text-[13px]'} text-white mt-0.5`}>
                    Berhasil memberikan {details?.giftCount || 1} membership.
                  </span>
                </div>
              );
            } else if (type === 'memberMilestoneChatEvent') {
              const details = msg.snippet.memberMilestoneChatDetails;
              customBg = "bg-green-500/20 border-green-500/50 backdrop-blur-md";
              messageContent = (
                <div className="flex flex-col mt-0.5">
                  <span className={`font-bold text-green-400 ${isFullscreen ? 'text-[10px]' : 'text-[12px]'} uppercase tracking-wide`}>
                    ⭐ Member for {details?.memberMonth} months!
                  </span>
                  {details?.userComment && (
                    <span className={`${isFullscreen ? 'text-[11px]' : 'text-[13px]'} leading-relaxed break-words text-foreground mt-0.5`}>
                      {formatChatMessage(details.userComment)}
                    </span>
                  )}
                </div>
              );
            } else if (type === 'textMessageEvent') {
              // Teks Biasa (textMessageEvent)
              const textMessage = msg.snippet.textMessageDetails?.messageText || msg.snippet.displayMessage;
              if (!textMessage) return null; // Sembunyikan bubble jika tidak ada pesan

              messageContent = (
                <span className={`${isFullscreen ? 'text-[11px]' : 'text-[13px]'} leading-relaxed break-words relative z-10 ${textColor}`}>
                  {formatChatMessage(textMessage)}
                </span>
              );
            } else {
              // Event sistem seperti timeout moderator (menghindari bubble kosong)
              if (!msg.snippet.displayMessage) return null;

              messageContent = (
                <span className={`${isFullscreen ? 'text-[11px]' : 'text-[13px]'} italic opacity-70 leading-relaxed break-words relative z-10 ${textColor}`}>
                  {formatChatMessage(msg.snippet.displayMessage)}
                </span>
              );
            }

            return (
              <div key={msg.id} className="flex gap-2.5 items-start w-full group">
                <Avatar className={`mt-0.5 shrink-0 border border-white/10 shadow-sm ${isFullscreen ? 'h-5 w-5' : 'h-7 w-7'}`}>
                  <AvatarImage src={profileImageUrl} />
                  <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                </Avatar>

                {/* Terapkan customBg di sini */}
                <div className={`flex flex-col flex-1 min-w-0 p-2 lg:p-3 ${BUBBLE_RADIUS} border relative overflow-hidden ${customBg}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex items-center gap-1.5 flex-wrap mb-1 relative z-10">
                    <span className={`${isFullscreen ? 'text-[10px]' : 'text-[12px]'} font-bold tracking-tight ${nameColor}`}>
                      {displayName}
                    </span>
                    {BadgeIcon}
                  </div>

                  {/* Render Konten Pesan */}
                  <div className="relative z-10">
                    {messageContent}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isReplay && (
        <div className={`p-3 pb-6 border-t ${isFullscreen ? 'border-white/10 bg-black/20' : 'border-border bg-background'}`}>
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
