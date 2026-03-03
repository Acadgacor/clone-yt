import { useState, useEffect, useRef } from 'react';
import { ytService } from '@/services/YouTubeService';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const chatMessageSchema = z.string()
    .max(200, "Pesan terlalu panjang (maksimal 200 karakter)")
    .trim()
    .transform(val => val.replace(/[<&>]/g, ''));

export function useLiveChat(videoId: string) {
    const [liveChatId, setLiveChatId] = useState<string | null>(null);
    const [visibleMessages, setVisibleMessages] = useState<any[]>([]); // Ganti nama state
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isReplay, setIsReplay] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Refs untuk sistem Queue dan mencegah Memory Leak
    const messageQueue = useRef<any[]>([]);
    const lastSeenMessageIds = useRef<Set<string>>(new Set());

    // 1. Ambil Live Chat ID
    useEffect(() => {
        if (!videoId) return;
        const initChat = async () => {
            setIsLoading(true);
            try {
                const { liveChatId: id, isReplay: replayStatus } = await ytService.getLiveChatId(videoId);
                setLiveChatId(id);
                setIsReplay(replayStatus);
            } catch (error) {
                console.error("Error init live chat:", error);
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }, [videoId]);

    // 2. Polling Messages setiap 5 detik (Memasukkan data ke Queue)
    useEffect(() => {
        if (!liveChatId) return;
        const fetchMsgs = async () => {
            try {
                const items = await ytService.getMessages(liveChatId);
                if (items.length > 0) {
                    const newMessages = items.filter(msg => {
                        // 1. Cek duplikasi ID
                        if (lastSeenMessageIds.current.has(msg.id)) return false;

                        // 2. Fitur Bot Blocker: Filter nama pengirim yang sering spam
                        const senderName = msg.authorDetails?.displayName?.toLowerCase() || '';
                        const isBot = senderName === 'nightbot' ||
                            senderName === 'streamelements' ||
                            senderName === 'streamlabs' ||
                            senderName === 'moobot';

                        if (isBot) return false; // Buang pesan jika dari bot

                        // 3. IZINKAN TIPE PESAN INI:
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

                        // ANTI-LEAK 1: Batasi ukuran Antrean (Maksimal 200 pesan)
                        // Jika chat masuk terlalu brutal, buang pesan yang terlalu lama ngantre
                        if (messageQueue.current.length > 200) {
                            messageQueue.current = messageQueue.current.slice(-200);
                        }

                        // Catat ID pesan baru
                        newMessages.forEach(msg => lastSeenMessageIds.current.add(msg.id));

                        // ANTI-LEAK 2: Batasi memori Set ID (Maksimal 200 ID)
                        // Hapus ID lama agar RAM tidak penuh
                        if (lastSeenMessageIds.current.size > 200) {
                            const arr = Array.from(lastSeenMessageIds.current).slice(-100);
                            lastSeenMessageIds.current = new Set(arr);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMsgs();
        const interval = setInterval(fetchMsgs, 5000);
        return () => clearInterval(interval);
    }, [liveChatId]);

    // 3. Dripping Effect / Penyalur Antrean (Ngalir mulus tiap 300ms)
    useEffect(() => {
        const drainInterval = setInterval(() => {
            if (messageQueue.current.length > 0) {
                const nextMessage = messageQueue.current.shift(); // Ambil pesan paling lama di antrean
                setVisibleMessages(prev => {
                    // ANTI-LEAK 3: Batasi elemen DOM HTML di layar (Maks 50 chat)
                    return [...prev, nextMessage].slice(-50);
                });
            }
        }, 300);

        return () => clearInterval(drainInterval);
    }, []);

    // 4. Handler Kirim Pesan
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !liveChatId) return;

        const accessToken = localStorage.getItem('google_access_token');
        if (!accessToken) {
            toast({ title: "Akses Ditolak", description: "Kamu harus login ulang untuk mengirim pesan.", variant: "destructive" });
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
            await ytService.sendMessage(liveChatId, parsedMessage.data, accessToken);
            setNewMessage('');
            // Optional: Fetch data lagi biar pesannya masuk ke queue
            const items = await ytService.getMessages(liveChatId);
            // Langsung inject ke queue agar cepat muncul
            const newMessages = items.filter(msg => !lastSeenMessageIds.current.has(msg.id));
            messageQueue.current = [...messageQueue.current, ...newMessages];
            newMessages.forEach(msg => lastSeenMessageIds.current.add(msg.id));
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                title: "Pesan Ditolak",
                description: "Gagal mengirim pesan. Chat ini mungkin di-set ke 'Members Only' atau Anda terkena Slow Mode.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    return {
        liveChatId,
        messages: visibleMessages, // Map visibleMessages ke prop messages agar komponen UI tidak error
        newMessage,
        setNewMessage,
        isSending,
        isReplay,
        isLoading,
        handleSendMessage
    };
}
