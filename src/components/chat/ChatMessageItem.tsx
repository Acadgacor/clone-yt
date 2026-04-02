'use client';

import { useRef } from 'react';
import { User as UserIcon, Crown, Wrench, Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const BUBBLE_RADIUS = 'rounded-2xl';

interface ChatMessageItemProps {
  msg: any;
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

export default function ChatMessageItem({ msg, isFullscreen = false }: ChatMessageItemProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Timeline untuk animasi bertahap yang lebih terasa
    const tl = gsap.timeline();
    
    tl.set(chatRef.current, {
      opacity: 0,
      scale: 0.1,
      y: 120
    })
    .to(chatRef.current, {
      opacity: 1,
      scale: 1.15,      // Overshoot dulu
      y: 0,
      duration: 0.4,
      ease: "power3.out"
    })
    .to(chatRef.current, {
      scale: 0.95,      // Bounce back ke bawah
      duration: 0.15,
      ease: "power2.in"
    })
    .to(chatRef.current, {
      scale: 1.05,      // Bounce ke atas lagi
      duration: 0.1,
      ease: "power2.out"
    })
    .to(chatRef.current, {
      scale: 1,         // Settle ke ukuran normal
      duration: 0.1,
      ease: "power2.inOut"
    });
  }, { dependencies: [msg.id], scope: chatRef });

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
    customBg = "bg-green-500/15 border-green-500/40";
    messageContent = (
      <div className="flex flex-col mt-0.5">
        <span className={`font-bold text-green-400 ${isFullscreen ? 'text-[10px]' : 'text-[12px]'} uppercase tracking-wide flex items-center gap-1`}>
          🎉 Welcome to {msg.snippet.newSponsorDetails?.memberLevelName || 'Membership'}!
        </span>
      </div>
    );
  } else if (type === 'membershipGiftingEvent') {
    const details = msg.snippet.membershipGiftingDetails;
    customBg = "bg-green-500/15 border-green-500/40";
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
    customBg = "bg-green-500/15 border-green-500/40";
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
      <span className={`${isFullscreen ? 'text-[11px]' : 'text-[10px] sm:text-[11px] md:text-[13px]'} leading-relaxed break-words relative z-10 ${textColor}`}>
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
    <div ref={chatRef} className={`flex items-start w-full group opacity-0 ${isFullscreen ? 'gap-1.5' : 'gap-1.5 sm:gap-2 md:gap-2.5'}`}>
      <Avatar className={`mt-0.5 shrink-0 border border-white/10 shadow-sm ${isFullscreen ? 'h-5 w-5' : 'h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7'}`}>
        <AvatarImage src={profileImageUrl} />
        <AvatarFallback><UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></AvatarFallback>
      </Avatar>

      {/* Terapkan customBg di sini */}
      <div className={`flex flex-col flex-1 min-w-0 border relative overflow-hidden ${BUBBLE_RADIUS} ${isFullscreen ? 'p-1.5' : 'p-1.5 sm:p-2 md:p-2 lg:p-3'} ${customBg}`}>
        {/* Hapus gradient hover untuk hemat GPU */}

        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-0.5 sm:mb-1 relative z-10">
          <span className={`${isFullscreen ? 'text-[10px]' : 'text-[10px] sm:text-[11px] md:text-[12px]'} font-bold tracking-tight ${nameColor}`}>
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
}
