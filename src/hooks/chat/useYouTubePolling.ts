import { useEffect, useRef } from 'react';
import { ytService } from '@/services/YouTubeService';
import { useSupabaseClient } from '@/supabase/provider';

const POLLING_INTERVAL = 2000; // 2 detik - realtime
const MEMORY_LIMIT = 500;
const MEMORY_TRIM_TO = 250;

// Bot names yang diblokir
const BLOCKED_BOTS = new Set([
    'nightbot',
    'streamelements',
    'streamlabs',
    'moobot'
]);

// Tipe pesan yang diizinkan
const ALLOWED_MESSAGE_TYPES = new Set([
    'textMessageEvent',
    'newSponsorEvent',
    'memberMilestoneChatEvent',
    'superChatEvent',
    'superStickerEvent',
    'membershipGiftingEvent'
]);

interface YouTubeMessage {
    id: string;
    authorDetails?: {
        displayName?: string;
        profileImageUrl?: string;
    };
    snippet: {
        type: string;
        displayMessage?: string;
        textMessageDetails?: { messageText?: string };
        superChatDetails?: { userComment?: string };
        superStickerDetails?: { superStickerMetadata?: { altText?: string } };
        memberMilestoneChatDetails?: { userComment?: string };
    };
}

interface InsertPayload {
    video_id: string;
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    message: string;
    video_timestamp?: number | null;
    youtube_message_id?: string | null;
}

export interface UseYouTubePollingReturn {
    isPolling: boolean;
    lastFetchTime: number | null;
}

// System user ID for YouTube-imported messages
const YOUTUBE_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

export function useYouTubePolling(
    liveChatId: string | null,
    isReplay: boolean,
    videoId: string,
    currentVideoTime: number,
    lastSeenMessageIds: Set<string>,
    onInsertFallback: (messages: YouTubeMessage[]) => void
): UseYouTubePollingReturn {
    const supabase = useSupabaseClient();
    const isPollingRef = useRef(false);
    const lastFetchTimeRef = useRef<number | null>(null);
    const lastSeenIdsRef = useRef(lastSeenMessageIds);

    // Update ref ketika prop berubah
    lastSeenIdsRef.current = lastSeenMessageIds;

    // Ekstrak teks pesan berdasarkan tipe
    const extractMessageText = (msg: YouTubeMessage): string => {
        const type = msg.snippet.type;
        
        switch (type) {
            case 'textMessageEvent':
                return msg.snippet.textMessageDetails?.messageText || '';
            case 'superChatEvent':
                return msg.snippet.superChatDetails?.userComment || 'Super Chat';
            case 'superStickerEvent':
                return msg.snippet.superStickerDetails?.superStickerMetadata?.altText || 'Super Sticker';
            case 'memberMilestoneChatEvent':
                return msg.snippet.memberMilestoneChatDetails?.userComment || 'Member Milestone';
            case 'newSponsorEvent':
                return 'New Member!';
            case 'membershipGiftingEvent':
                return 'Gifted Membership';
            default:
                return msg.snippet.displayMessage || '';
        }
    };

    // Filter pesan
    const filterMessages = (items: YouTubeMessage[]): YouTubeMessage[] => {
        return items.filter(msg => {
            // 1. Cek duplikasi ID
            if (lastSeenIdsRef.current.has(msg.id)) return false;

            // 2. Bot Blocker
            const senderName = msg.authorDetails?.displayName?.toLowerCase() || '';
            if (BLOCKED_BOTS.has(senderName)) return false;

            // 3. Izinkan tipe pesan tertentu saja
            return ALLOWED_MESSAGE_TYPES.has(msg.snippet.type);
        });
    };

    // Convert ke format insert
    const convertToInsertPayload = (messages: YouTubeMessage[]): InsertPayload[] => {
        return messages.map(msg => ({
            video_id: videoId,
            user_id: YOUTUBE_SYSTEM_USER_ID,
            display_name: msg.authorDetails?.displayName || 'YouTube User',
            avatar_url: msg.authorDetails?.profileImageUrl || null,
            message: extractMessageText(msg),
            video_timestamp: Math.floor(currentVideoTime)
        }));
    };

    // Polling effect
    useEffect(() => {
        if (!liveChatId || isReplay) {
            isPollingRef.current = false;
            return;
        }

        isPollingRef.current = true;

        const fetchMsgs = async () => {
            try {
                const items = await ytService.getMessages(liveChatId);
                lastFetchTimeRef.current = Date.now();

                if (items.length === 0) return;

                // Filter pesan baru
                const newMessages = filterMessages(items);
                if (newMessages.length === 0) return;

                // Langsung tampilkan tanpa buffer/drip - realtime
                onInsertFallback(newMessages);
                newMessages.forEach(msg => lastSeenIdsRef.current.add(msg.id));

                // Anti memory leak: Batasi memori Set ID
                if (lastSeenIdsRef.current.size > MEMORY_LIMIT) {
                    const arr = Array.from(lastSeenIdsRef.current).slice(-MEMORY_TRIM_TO);
                    lastSeenIdsRef.current = new Set(arr);
                }
            } catch (error) {
                console.error("Error fetching YouTube messages:", error);
            }
        };

        // Initial fetch
        fetchMsgs();

        // Setup interval
        const interval = setInterval(fetchMsgs, POLLING_INTERVAL);

        return () => {
            clearInterval(interval);
            isPollingRef.current = false;
        };
    }, [liveChatId, isReplay, videoId, currentVideoTime, supabase, onInsertFallback]);

    return {
        isPolling: isPollingRef.current,
        lastFetchTime: lastFetchTimeRef.current
    };
}
