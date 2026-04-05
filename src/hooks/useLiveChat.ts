import { useState, useEffect, useRef, useCallback } from 'react';
import { ytService } from '@/services/YouTubeService';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useSupabaseClient, useUser } from '@/supabase/provider';

const chatMessageSchema = z.string()
    .max(200, "Pesan terlalu panjang (maksimal 200 karakter)")
    .trim()
    .transform(val => val.replace(/[<&>]/g, ''));

export function useLiveChat(videoId: string) {
    const [liveChatId, setLiveChatId] = useState<string | null>(null);
    const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isReplay, setIsReplay] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // ============================================================
    // ADVANCED VOD SYNC - Single Source of Truth (SSOT)
    // ============================================================
    // Ref untuk menyimpan waktu video saat ini (dari event videoTimeUpdate)
    const currentVideoTime = useRef(0);
    // Ref untuk menyimpan history chat dari Supabase (untuk mode replay)
    const chatHistoryRef = useRef<any[]>([]);
    // Ref untuk melacak pesan yang sudah ditampilkan di mode replay
    const lastDisplayedIndexRef = useRef(0);
    // Ref untuk melacak waktu video sebelumnya (deteksi skip/seek)
    const previousVideoTimeRef = useRef(0);

    const { toast } = useToast();
    
    const supabase = useSupabaseClient();
    const { user } = useUser();

    // Refs untuk sistem Queue dan mencegah Memory Leak
    const messageQueue = useRef<any[]>([]);
    const lastSeenMessageIds = useRef<Set<string>>(new Set());

    // ============================================================
    // 1. LISTENER VIDEO TIME UPDATE (dari VideoPlayer via event)
    // ============================================================
    useEffect(() => {
        const handleTimeUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.currentTime === 'number') {
                const newTime = customEvent.detail.currentTime;
                
                // Deteksi skip/seek (lompatan waktu > 3 detik)
                const timeDiff = Math.abs(newTime - previousVideoTimeRef.current);
                if (isReplay && timeDiff > 3) {
                    // Reset tracking saat video di-skip
                    handleVideoSeek(newTime);
                }
                
                previousVideoTimeRef.current = currentVideoTime.current;
                currentVideoTime.current = newTime;
            }
        };
        
        window.addEventListener('videoTimeUpdate', handleTimeUpdate);
        return () => window.removeEventListener('videoTimeUpdate', handleTimeUpdate);
    }, [isReplay]);

    // Handler saat video di-skip (maju/mundur)
    const handleVideoSeek = useCallback((newTime: number) => {
        if (!isReplay) return;
        
        // Hitung ulang index terakhir yang harus ditampilkan
        const targetIndex = chatHistoryRef.current.findIndex(
            (msg, idx) => {
                const nextMsg = chatHistoryRef.current[idx + 1];
                if (!nextMsg) return true;
                return (msg.video_timestamp || 0) <= newTime && (nextMsg.video_timestamp || 0) > newTime;
            }
        );
        
        if (targetIndex !== -1) {
            lastDisplayedIndexRef.current = targetIndex;
            // Update visible messages berdasarkan waktu baru
            const filteredMessages = chatHistoryRef.current.slice(0, targetIndex + 1);
            setVisibleMessages(filteredMessages.slice(-200));
        }
    }, [isReplay]);

    // ============================================================
    // 2. FUNKSI PEMBANTU - Adaptasi pesan DB ke format UI
    // ============================================================
    const adaptDbMessage = useCallback((msg: any) => ({
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

    // ============================================================
    // 3. INISIALISASI - Ambil Live Chat ID dan Load History Supabase
    // ============================================================
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
                    setIsReplay(replayStatus);
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
                    
                    // Tandai semua ID sebagai sudah dilihat
                    adaptedHistory.forEach(msg => lastSeenMessageIds.current.add(msg.id));
                    
                    // Jika BUKAN replay, tampilkan semua pesan
                    // Jika replay, pesan akan ditampilkan via dripping effect berdasarkan video_timestamp
                    if (!replayStatus) {
                        setVisibleMessages(adaptedHistory.slice(-200));
                    } else {
                        // Mode replay: mulai dengan pesan kosong, akan diisi via dripping
                        setVisibleMessages([]);
                        lastDisplayedIndexRef.current = 0;
                    }
                }
            } catch (error) {
                console.error("Error inisialisasi live chat:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initChat();

        // ============================================================
        // 4. SUPABASE REALTIME SUBSCRIPTION (SSOT - Sumber Pesan untuk UI)
        // ============================================================
        // Semua pesan yang ditampilkan di UI HANYA berasal dari Supabase Realtime
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
                }
                
                // Masukkan ke messageQueue untuk dripping effect ke UI
                // Untuk live streaming, langsung masuk queue
                // Untuk replay, akan ditampilkan berdasarkan video_timestamp
                if (!isReplay) {
                    messageQueue.current.push(adaptedMsg);
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
            setVisibleMessages([]);
            messageQueue.current = [];
            chatHistoryRef.current = [];
            lastSeenMessageIds.current.clear();
            lastDisplayedIndexRef.current = 0;
        };
    }, [videoId, supabase, adaptDbMessage, isReplay]);

    // ============================================================
    // 5. POLLING YOUTUBE API (SAAT LIVE) - BULK INSERT KE SUPABASE
    // ============================================================
    useEffect(() => {
        if (!liveChatId || isReplay) return;
        
        const fetchMsgs = async () => {
            try {
                const items = await ytService.getMessages(liveChatId);
                if (items.length === 0) return;

                // Filter pesan baru
                const newMessages = items.filter(msg => {
                    // 1. Cek duplikasi ID
                    if (lastSeenMessageIds.current.has(msg.id)) return false;

                    // 2. Bot Blocker
                    const senderName = msg.authorDetails?.displayName?.toLowerCase() || '';
                    const isBot = senderName === 'nightbot' ||
                        senderName === 'streamelements' ||
                        senderName === 'streamlabs' ||
                        senderName === 'moobot';

                    if (isBot) return false;

                    // 3. Izinkan tipe pesan tertentu saja
                    const type = msg.snippet.type;
                    return type === 'textMessageEvent' ||
                        type === 'newSponsorEvent' ||
                        type === 'memberMilestoneChatEvent' ||
                        type === 'superChatEvent' ||
                        type === 'superStickerEvent' ||
                        type === 'membershipGiftingEvent';
                });

                if (newMessages.length === 0) return;

                // ============================================================
                // BULK INSERT KE SUPABASE (SSOT)
                // Pesan dari YouTube API disimpan dulu ke Supabase
                // Kemudian Supabase Realtime akan memancarkan ke UI
                // ============================================================
                const messagesToInsert = newMessages.map(msg => {
                    // Ekstrak teks pesan berdasarkan tipe
                    let messageText = '';
                    const type = msg.snippet.type;
                    
                    if (type === 'textMessageEvent') {
                        messageText = msg.snippet.textMessageDetails?.messageText || '';
                    } else if (type === 'superChatEvent') {
                        messageText = msg.snippet.superChatDetails?.userComment || 'Super Chat';
                    } else if (type === 'superStickerEvent') {
                        messageText = msg.snippet.superStickerDetails?.superStickerMetadata?.altText || 'Super Sticker';
                    } else if (type === 'memberMilestoneChatEvent') {
                        messageText = msg.snippet.memberMilestoneChatDetails?.userComment || 'Member Milestone';
                    } else if (type === 'newSponsorEvent') {
                        messageText = 'New Member!';
                    } else if (type === 'membershipGiftingEvent') {
                        messageText = 'Gifted Membership';
                    } else {
                        messageText = msg.snippet.displayMessage || '';
                    }

                    return {
                        video_id: videoId,
                        user_id: null, // YouTube user, bukan user Supabase kita
                        display_name: msg.authorDetails?.displayName || 'YouTube User',
                        avatar_url: msg.authorDetails?.profileImageUrl || null,
                        message: messageText,
                        video_timestamp: Math.floor(currentVideoTime.current), // Ambil dari waktu video saat ini
                        youtube_message_id: msg.id // Simpan ID YouTube untuk referensi
                    };
                });

                // Bulk insert ke Supabase
                const { error: insertError } = await supabase
                    .from('chat_messages')
                    .insert(messagesToInsert);

                if (insertError) {
                    console.error("Error bulk insert ke Supabase:", insertError);
                    // Fallback: langsung masukkan ke queue jika insert gagal
                    newMessages.forEach(msg => {
                        if (!lastSeenMessageIds.current.has(msg.id)) {
                            messageQueue.current.push(msg);
                            lastSeenMessageIds.current.add(msg.id);
                        }
                    });
                } else {
                    // Tandai sebagai sudah diproses
                    newMessages.forEach(msg => lastSeenMessageIds.current.add(msg.id));
                }

                // Anti memory leak: Batasi memori Set ID
                if (lastSeenMessageIds.current.size > 500) {
                    const arr = Array.from(lastSeenMessageIds.current).slice(-250);
                    lastSeenMessageIds.current = new Set(arr);
                }
            } catch (error) {
                console.error("Error fetching YouTube messages:", error);
            }
        };

        fetchMsgs();
        const interval = setInterval(fetchMsgs, 8000);
        return () => clearInterval(interval);
    }, [liveChatId, isReplay, videoId, supabase]);

    // ============================================================
    // 6. DRIPPING EFFECT - UNTUK LIVE STREAMING
    // ============================================================
    useEffect(() => {
        if (isReplay) return; // Dripping untuk live saja
        
        let drainInterval: NodeJS.Timeout;
        
        const startDraining = () => {
            if (messageQueue.current.length === 0) return;

            const queueLength = messageQueue.current.length;
            const delay = queueLength > 10 ? 100 : queueLength > 5 ? 200 : 300;
            
            drainInterval = setInterval(() => {
                if (messageQueue.current.length > 0) {
                    const nextMessage = messageQueue.current.shift();
                    
                    setVisibleMessages(prev => [...prev, nextMessage].slice(-200));
                    
                    if (messageQueue.current.length > 0) {
                        clearInterval(drainInterval);
                        startDraining();
                    }
                }
            }, delay);
        };
        
        startDraining();
        
        const checkerInterval = setInterval(() => {
            if (messageQueue.current.length > 0) {
                startDraining();
            }
        }, 1000);

        return () => {
            clearInterval(drainInterval);
            clearInterval(checkerInterval);
        };
    }, [isReplay]);

    // ============================================================
    // 7. REPLAY SYNC EFFECT - Tampilkan pesan berdasarkan video_timestamp
    // ============================================================
    useEffect(() => {
        if (!isReplay || chatHistoryRef.current.length === 0) return;

        const currentTime = currentVideoTime.current;
        const history = chatHistoryRef.current;
        
        // Cari pesan yang harus ditampilkan berdasarkan waktu video saat ini
        // Hanya tampilkan pesan dengan video_timestamp <= currentTime
        let newLastIndex = lastDisplayedIndexRef.current;
        
        // Scan dari index terakhir yang ditampilkan
        for (let i = newLastIndex; i < history.length; i++) {
            const msg = history[i];
            const msgTimestamp = msg.video_timestamp || 0;
            
            if (msgTimestamp <= currentTime && i >= newLastIndex) {
                newLastIndex = i;
            } else if (msgTimestamp > currentTime) {
                break;
            }
        }

        // Jika ada pesan baru yang harus ditampilkan
        if (newLastIndex > lastDisplayedIndexRef.current) {
            const newMessages = history.slice(lastDisplayedIndexRef.current + 1, newLastIndex + 1);
            
            if (newMessages.length > 0) {
                setVisibleMessages(prev => {
                    const combined = [...prev, ...newMessages];
                    return combined.slice(-200);
                });
                lastDisplayedIndexRef.current = newLastIndex;
            }
        }
    }, [isReplay]); // Di-trigger saat isReplay berubah, actual sync via interval

    // Interval untuk sync replay dengan waktu video
    useEffect(() => {
        if (!isReplay) return;

        const syncInterval = setInterval(() => {
            const currentTime = currentVideoTime.current;
            const history = chatHistoryRef.current;
            
            if (history.length === 0) return;

            // Cari pesan baru yang harus ditampilkan
            const newMessages: any[] = [];
            
            for (let i = lastDisplayedIndexRef.current; i < history.length; i++) {
                const msg = history[i];
                const msgTimestamp = msg.video_timestamp || 0;
                
                if (msgTimestamp <= currentTime && i >= lastDisplayedIndexRef.current) {
                    // Pesan ini sudah seharusnya ditampilkan
                    if (i > lastDisplayedIndexRef.current) {
                        newMessages.push(msg);
                    }
                } else if (msgTimestamp > currentTime) {
                    break;
                }
            }

            if (newMessages.length > 0) {
                setVisibleMessages(prev => {
                    const combined = [...prev, ...newMessages];
                    return combined.slice(-200);
                });
                lastDisplayedIndexRef.current += newMessages.length;
            }
        }, 500); // Cek setiap 500ms

        return () => clearInterval(syncInterval);
    }, [isReplay]);

    // ============================================================
    // 8. HANDLER KIRIM PESAN
    // ============================================================
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user && !newMessage.trim()) return;

        if (!user) {
            toast({ title: "Akses Ditolak", description: "Kamu harus login untuk mengirim pesan.", variant: "destructive" });
            return;
        }

        const parsedMessage = chatMessageSchema.safeParse(newMessage);
        if (!parsedMessage.success) {
            toast({
                variant: "destructive",
                title: "Pesan tidak valid",
                description: parsedMessage.error.errors[0].message,
            });
            return;
        }

        setIsSending(true);
        try {
            // INSERT ke Supabase (SSOT)
            const { error: dbError } = await supabase.from('chat_messages').insert({
                video_id: videoId,
                user_id: user.id,
                display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'User',
                avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
                message: parsedMessage.data,
                video_timestamp: Math.floor(currentVideoTime.current)
            });
            
            if (dbError) {
                console.error("Gagal simpan riwayat chat:", dbError);
                toast({ title: "Gagal Menyimpan", description: "Pesan Anda mungkin tidak tersimpan secara permanen.", variant: "destructive" });
            }

            // Kirim ke YouTube API (jika live dan ada token)
            const accessToken = localStorage.getItem('google_access_token');
            if (liveChatId && accessToken) {
                try {
                    await ytService.sendMessage(liveChatId, parsedMessage.data, accessToken);
                } catch (ytError) {
                    console.error("Gagal meneruskan ke YouTube Live Chat:", ytError);
                }
            }

            setNewMessage('');
        } catch (error) {
            console.error("Error mengirim pesan:", error);
            toast({
                title: "Terjadi Kesalahan",
                description: "Tidak dapat memproses pengiriman chat saat ini.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    // Untuk mode live, tampilkan visibleMessages langsung
    // Untuk mode replay, visibleMessages sudah difilter berdasarkan video_timestamp
    const displayMessages = visibleMessages;

    return {
        liveChatId,
        messages: displayMessages,
        newMessage,
        setNewMessage,
        isSending,
        isReplay,
        isLoading,
        handleSendMessage,
        currentVideoTime: currentVideoTime.current // Expose untuk debugging jika perlu
    };
}
