import { useState, useEffect, useRef } from 'react';
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
    const [visibleMessages, setVisibleMessages] = useState<any[]>([]); // Antrean state pesan yang dirender
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isReplay, setIsReplay] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // State & Ref untuk Advanced VOD Sync
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const videoTimeRef = useRef(0);

    const { toast } = useToast();
    
    const supabase = useSupabaseClient();
    const { user } = useUser();

    // Setup Custom Event Listener dari VideoPlayer
    useEffect(() => {
        const handleTimeUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.currentTime === 'number') {
                setCurrentVideoTime(customEvent.detail.currentTime);
                videoTimeRef.current = customEvent.detail.currentTime;
            }
        };
        window.addEventListener('videoTimeUpdate', handleTimeUpdate);
        return () => window.removeEventListener('videoTimeUpdate', handleTimeUpdate);
    }, []);

    // Refs untuk sistem Queue dan mencegah Memory Leak
    const messageQueue = useRef<any[]>([]);
    const lastSeenMessageIds = useRef<Set<string>>(new Set());

    // Fungsi pembantu untuk adaptasi pesan DB ke format YouTube UI (textMessageEvent)
    const adaptDbMessage = (msg: any) => ({
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
        video_timestamp: msg.video_timestamp || 0 // Diambil untuk sinkronisasi VOD
    });

    // 1. Ambil Live Chat ID dan Load History DB (Fetch History)
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

                // Fetch History / Replay Chat dari Supabase
                const { data: history, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('video_id', videoId)
                    .order('created_at', { ascending: true }); // Tanpa limit untuk full replay VOD

                if (error) {
                    console.error("Error fetching chat history dari Supabase:", error);
                } else if (history && isMounted) {
                    // Langsung masukkan history ke visible message agar terbaca tanpa masuk delay/dripping
                    const adaptedHistory = history.map(adaptDbMessage);
                    setVisibleMessages(adaptedHistory);
                    
                    // Supaya API youtube/realtime selanjutnya tidak render duplikat (kalau semisal ID bersinggungan)
                    adaptedHistory.forEach(msg => lastSeenMessageIds.current.add(msg.id));
                }
            } catch (error) {
                console.error("Error inisialisasi live chat:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initChat();

        // 2. Setup Realtime Subscription Supabase (Mendengarkan event baru)
        const channel = supabase
            .channel(`chat_messages_${videoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `video_id=eq.${videoId}`
            }, (payload) => {
                const msg = payload.new;
                if (!lastSeenMessageIds.current.has(msg.id)) {
                    const adaptedMsg = adaptDbMessage(msg);
                    // Masukkan ke antrean queue Dripping Effect!
                    messageQueue.current.push(adaptedMsg);
                    lastSeenMessageIds.current.add(msg.id);
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
            setVisibleMessages([]);
            messageQueue.current = [];
            lastSeenMessageIds.current.clear();
        };
    }, [videoId, supabase]);

    // 3. Polling Messages Youtube
    useEffect(() => {
        if (!liveChatId) return;
        const fetchMsgs = async () => {
            try {
                const items = await ytService.getMessages(liveChatId);
                if (items.length > 0) {
                    const newMessages = items.filter(msg => {
                        // 1. Cek duplikasi ID
                        if (lastSeenMessageIds.current.has(msg.id)) return false;

                        // 2. Fitur Bot Blocker (Filter nama pengirim yang sering spam bot)
                        const senderName = msg.authorDetails?.displayName?.toLowerCase() || '';
                        const isBot = senderName === 'nightbot' ||
                            senderName === 'streamelements' ||
                            senderName === 'streamlabs' ||
                            senderName === 'moobot';

                        if (isBot) return false; 

                        // 3. Izinkan tipe pesan tertentu saja (Dukung UI Chat)
                        const type = msg.snippet.type;
                        return type === 'textMessageEvent' ||
                            type === 'newSponsorEvent' ||
                            type === 'memberMilestoneChatEvent' ||
                            type === 'superChatEvent' ||
                            type === 'superStickerEvent' ||
                            type === 'membershipGiftingEvent';
                    });

                    if (newMessages.length > 0) {
                        messageQueue.current = [...messageQueue.current, ...newMessages];

                        // Anti memory leak: Batasi antrean queue maksimal 200
                        if (messageQueue.current.length > 200) {
                            messageQueue.current = messageQueue.current.slice(-200);
                        }

                        // Tandai sebagai dilihat
                        newMessages.forEach(msg => lastSeenMessageIds.current.add(msg.id));

                        // Anti memory leak: Batasi memori Set ID agar RAM tidak jebol
                        if (lastSeenMessageIds.current.size > 500) {
                            const arr = Array.from(lastSeenMessageIds.current).slice(-250);
                            lastSeenMessageIds.current = new Set(arr);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching YouTube messages:", error);
            }
        };

        fetchMsgs();
        const interval = setInterval(fetchMsgs, 8000); 
        return () => clearInterval(interval);
    }, [liveChatId]);

    // 4. Dripping Effect untuk Antrean Queue UI (Penyalur Antrean untuk cegah render berat GPU)
    useEffect(() => {
        let drainInterval: NodeJS.Timeout;
        
        const startDraining = () => {
            if (messageQueue.current.length === 0) return;

            // Adaptive dripping: Makin panjang antrean, makin cepat ditumpahkan
            const queueLength = messageQueue.current.length;
            const delay = queueLength > 10 ? 100 : queueLength > 5 ? 200 : 300;
            
            drainInterval = setInterval(() => {
                if (messageQueue.current.length > 0) {
                    const nextMessage = messageQueue.current.shift();
                    
                    setVisibleMessages(prev => {
                        // Jangan biarkan DOM UI terlalu banyak, potong slice -200
                        return [...prev, nextMessage].slice(-200);
                    });
                    
                    // Restart interval kalau queue length berubah drastis
                    if (messageQueue.current.length > 0) {
                        clearInterval(drainInterval);
                        startDraining();
                    }
                }
            }, delay);
        };
        
        startDraining();
        
        // Pengecek konstan kalau ada queue mentok tertahan
        const checkerInterval = setInterval(() => {
             if (messageQueue.current.length > 0 && !drainInterval) {
                 startDraining();
             }
        }, 1000);

        return () => {
            clearInterval(drainInterval);
            clearInterval(checkerInterval);
        };
    }, []);

    // 5. Handler Kirim Pesan
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Cek login via user supabase (wajib)
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
            // 1. Simpan (INSERT) ke Supabase terlebih dahulu untuk persistensi Global Chat secara permanen
            const { error: dbError } = await supabase.from('chat_messages').insert({
                video_id: videoId,
                user_id: user.id,
                display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'User',
                avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
                message: parsedMessage.data,
                // Mengambil posisi video yang sedang diputar untuk VOD Sync
                video_timestamp: Math.floor(videoTimeRef.current)
            });
            
            if (dbError) {
                console.error("Gagal simpan riwayat chat:", dbError);
                toast({ title: "Gagal Menyimpan", description: "Pesan Anda mungkin tidak tersimpan secara permanen untuk replay.", variant: "destructive" });
            }

            // 2. Kirim ke YouTube API (Jika user bisa dan video sedang live mendukung)
            const accessToken = localStorage.getItem('google_access_token');
            if (liveChatId && accessToken) {
                try {
                    await ytService.sendMessage(liveChatId, parsedMessage.data, accessToken);
                    // Pesan otomatis akan ke-pull oleh timer polling di #3 atau dripping effect
                } catch (ytError) {
                    console.error("Gagal meneruskan ke sistem YouTube Live Chat:", ytError);
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

    // Filter pesan saat mode Replay berdasarkan durasi video saat ini
    const displayMessages = isReplay 
        ? visibleMessages
            .filter((msg: any) => (msg.video_timestamp || 0) <= currentVideoTime)
            .slice(-200) // Batasi render 200 supaya DOM tidak lag
        : visibleMessages;

    return {
        liveChatId,
        messages: displayMessages, // Mengirim satu antrean history database + live chat streaming saja ke UI
        newMessage,
        setNewMessage,
        isSending,
        isReplay,
        isLoading,
        handleSendMessage
    };
}
