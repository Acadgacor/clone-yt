import { useState, useEffect } from 'react';
import { ytService } from '@/services/YouTubeService';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const chatMessageSchema = z.string()
    .max(200, "Pesan terlalu panjang (maksimal 200 karakter)")
    .trim()
    .transform(val => val.replace(/[<&>]/g, ''));

export function useLiveChat(videoId: string) {
    const [liveChatId, setLiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isReplay, setIsReplay] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

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

    // 2. Polling Messages setiap 5 detik
    useEffect(() => {
        if (!liveChatId) return;
        const fetchMsgs = async () => {
            try {
                const items = await ytService.getMessages(liveChatId);
                if (items.length > 0) {
                    setMessages(items);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMsgs();
        const interval = setInterval(fetchMsgs, 5000);
        return () => clearInterval(interval);
    }, [liveChatId]);

    // 3. Handler Kirim Pesan
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
            // Optional: Fetch pesan langsung setelah kirim agar terasa instan
            const items = await ytService.getMessages(liveChatId);
            setMessages(items);
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
        messages,
        newMessage,
        setNewMessage,
        isSending,
        isReplay,
        isLoading,
        handleSendMessage
    };
}
