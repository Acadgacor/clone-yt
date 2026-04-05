import { useState, useEffect, useRef, useCallback } from 'react';
import { ytService } from '@/services/YouTubeService';
import { useSupabaseClient } from '@/supabase/provider';

export interface ChatMessage {
    id: string;
    isDbMessage: boolean;
    authorDetails: {
        displayName: string;
        profileImageUrl: string | null;
        isChatOwner: boolean;
        isChatModerator: boolean;
        isChatSponsor: boolean;
    };
    snippet: {
        type: string;
        displayMessage: string;
        textMessageDetails: {
            messageText: string;
        };
    };
    created_at: string;
    video_timestamp: number;
}

export interface UseSupabaseChatReturn {
    liveChatId: string | null;
    isReplay: boolean;
    isLoading: boolean;
    chatHistory: ChatMessage[];
    lastSeenMessageIds: Set<string>;
    addToQueue: (msg: ChatMessage) => void;
    refreshHistory: () => Promise<void>;
}

export function useSupabaseChat(
    videoId: string,
    isReplay: boolean,
    onNewMessage: (msg: ChatMessage) => void
): UseSupabaseChatReturn {
    const [liveChatId, setLiveChatId] = useState<string | null>(null);
    const [isReplayState, setIsReplayState] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

    const supabase = useSupabaseClient();

    // Refs untuk tracking
    const chatHistoryRef = useRef<ChatMessage[]>([]);
    const lastSeenMessageIds = useRef<Set<string>>(new Set());

    // Fungsi pembantu - Adaptasi pesan DB ke format UI
    const adaptDbMessage = useCallback((msg: any): ChatMessage => ({
        id: msg.id,
        isDbMessage: true,
        authorDetails: {
            displayName: msg.display_name,
            profileImageUrl: msg.avatar_url,
            isChatOwner: false,
            isChatModerator: false,
            isChatSponsor: false,
        },
        snippet: {
            type: 'textMessageEvent',
            displayMessage: msg.message,
            textMessageDetails: {
                messageText: msg.message
            }
        },
        created_at: msg.created_at,
        video_timestamp: msg.video_timestamp || 0
    }), []);

    // Refresh history manual
    const refreshHistory = useCallback(async () => {
        if (!videoId) return;

        try {
            const { data: history, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('video_id', videoId)
                .order('video_timestamp', { ascending: true });

            if (error) {
                console.error("Error fetching chat history dari Supabase:", error);
                return;
            }

            if (history) {
                const adaptedHistory = history.map(adaptDbMessage);
                chatHistoryRef.current = adaptedHistory;
                setChatHistory(adaptedHistory);
                
                // Tandai semua ID sebagai sudah dilihat
                adaptedHistory.forEach(msg => lastSeenMessageIds.current.add(msg.id));
            }
        } catch (error) {
            console.error("Error refreshing chat history:", error);
        }
    }, [videoId, supabase, adaptDbMessage]);

    // Inisialisasi - Ambil Live Chat ID dan Load History Supabase
    useEffect(() => {
        if (!videoId) return;
        let isMounted = true;

        const initChat = async () => {
            setIsLoading(true);
            try {
                // Fetch status chat YouTube
                const { liveChatId: id, isReplay: replayStatus } = await ytService.getLiveChatId(videoId);
                if (isMounted) {
                    setLiveChatId(id);
                    setIsReplayState(replayStatus);
                }

                // Fetch History Chat dari Supabase (SSOT)
                const { data: history, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('video_id', videoId)
                    .order('video_timestamp', { ascending: true });

                if (error) {
                    console.error("Error fetching chat history dari Supabase:", error);
                } else if (history && isMounted) {
                    const adaptedHistory = history.map(adaptDbMessage);
                    
                    // Simpan ke ref untuk mode replay
                    chatHistoryRef.current = adaptedHistory;
                    setChatHistory(adaptedHistory);
                    
                    // Tandai semua ID sebagai sudah dilihat
                    adaptedHistory.forEach(msg => lastSeenMessageIds.current.add(msg.id));
                }
            } catch (error) {
                console.error("Error inisialisasi live chat:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initChat();

        // Supabase Realtime Subscription (SSOT - Sumber Pesan untuk UI)
        const channel = supabase
            .channel(`chat_messages_${videoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `video_id=eq.${videoId}`
            }, (payload) => {
                const msg = payload.new;
                
                // Cek duplikasi
                if (lastSeenMessageIds.current.has(msg.id)) return;
                
                const adaptedMsg = adaptDbMessage(msg);
                lastSeenMessageIds.current.add(msg.id);
                
                // Jika mode replay, tambahkan ke history ref (untuk sinkronisasi)
                if (isReplay) {
                    chatHistoryRef.current.push(adaptedMsg);
                    // Sort berdasarkan video_timestamp
                    chatHistoryRef.current.sort((a, b) => (a.video_timestamp || 0) - (b.video_timestamp || 0));
                    setChatHistory([...chatHistoryRef.current]);
                }
                
                // Callback ke parent untuk dripping effect
                onNewMessage(adaptedMsg);
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
            chatHistoryRef.current = [];
            lastSeenMessageIds.current.clear();
        };
    }, [videoId, supabase, adaptDbMessage, isReplay, onNewMessage]);

    // Helper untuk menambah ke queue (dari luar)
    const addToQueue = useCallback((msg: ChatMessage) => {
        lastSeenMessageIds.current.add(msg.id);
    }, []);

    return {
        liveChatId,
        isReplay: isReplayState,
        isLoading,
        chatHistory,
        lastSeenMessageIds: lastSeenMessageIds.current,
        addToQueue,
        refreshHistory
    };
}
