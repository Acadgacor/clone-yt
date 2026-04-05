import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ytService } from '@/services/YouTubeService';
import { useSupabaseClient, useUser } from '@/supabase/provider';

const chatMessageSchema = z.string()
    .max(200, "Pesan terlalu panjang (maksimal 200 karakter)")
    .trim()
    .transform(val => val.replace(/[<&>]/g, ''));

export interface SendMessageParams {
    videoId: string;
    liveChatId: string | null;
    currentVideoTime: number;
    newMessage: string;
}

export interface UseSendMessageReturn {
    isSending: boolean;
    handleSendMessage: (e: React.FormEvent, messageText: string) => Promise<void>;
    setIsSending: (value: boolean) => void;
}

export function useSendMessage(
    videoId: string,
    liveChatId: string | null,
    currentVideoTime: number,
    onSuccess?: () => void
): UseSendMessageReturn {
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const supabase = useSupabaseClient();
    const { user } = useUser();

    const handleSendMessage = useCallback(async (e: React.FormEvent, messageText: string) => {
        e.preventDefault();

        if (!user && !messageText.trim()) return;

        if (!user) {
            toast({
                title: "Akses Ditolak",
                description: "Kamu harus login untuk mengirim pesan.",
                variant: "destructive"
            });
            return;
        }

        const parsedMessage = chatMessageSchema.safeParse(messageText);
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
                video_timestamp: Math.floor(currentVideoTime)
            });

            if (dbError) {
                console.error("Gagal simpan riwayat chat:", dbError);
                toast({
                    title: "Gagal Menyimpan",
                    description: "Pesan Anda mungkin tidak tersimpan secara permanen.",
                    variant: "destructive"
                });
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

            // Clear message on success
            onSuccess?.();
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
    }, [user, videoId, liveChatId, currentVideoTime, supabase, toast, onSuccess]);

    return {
        isSending,
        handleSendMessage,
        setIsSending
    };
}
