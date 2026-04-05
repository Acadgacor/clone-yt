import { useState, useEffect, useRef, useCallback } from 'react';

const DRIP_DELAY_HIGH = 100;   // Queue > 10 messages
const DRIP_DELAY_MEDIUM = 200; // Queue > 5 messages
const DRIP_DELAY_LOW = 300;    // Queue <= 5 messages
const DRIP_CHECK_INTERVAL = 1000; // 1 detik
const MAX_VISIBLE_MESSAGES = 200;
const REPLAY_SYNC_INTERVAL = 500; // 500ms

// Re-export ChatMessage type untuk konsistensi
export type { ChatMessage } from './useSupabaseChat';

// Local ChatMessage type yang kompatibel
interface LocalChatMessage {
    id: string;
    video_timestamp?: number;
    [key: string]: any;
}

interface UseChatRendererReturn {
    visibleMessages: LocalChatMessage[];
    messageQueue: React.MutableRefObject<LocalChatMessage[]>;
    lastDisplayedIndex: number;
    resetRenderer: () => void;
    addToVisibleMessages: (messages: LocalChatMessage[]) => void;
    handleVideoSeek: (newTime: number, chatHistory: LocalChatMessage[]) => void;
}

export function useChatRenderer(
    isReplay: boolean,
    currentVideoTime: number
): UseChatRendererReturn {
    const [visibleMessages, setVisibleMessages] = useState<LocalChatMessage[]>([]);
    const messageQueue = useRef<LocalChatMessage[]>([]);
    const lastDisplayedIndexRef = useRef(0);

    // Reset semua state
    const resetRenderer = useCallback(() => {
        setVisibleMessages([]);
        messageQueue.current = [];
        lastDisplayedIndexRef.current = 0;
    }, []);

    // Add to visible messages (batch)
    const addToVisibleMessages = useCallback((messages: LocalChatMessage[]) => {
        setVisibleMessages(prev => {
            const combined = [...prev, ...messages];
            return combined.slice(-MAX_VISIBLE_MESSAGES);
        });
    }, []);

    // Handler saat video di-skip (maju/mundur) - Replay mode only
    const handleVideoSeek = useCallback((newTime: number, chatHistory: LocalChatMessage[]) => {
        if (!isReplay) return;

        // Hitung ulang index terakhir yang harus ditampilkan
        const targetIndex = chatHistory.findIndex((msg, idx) => {
            const nextMsg = chatHistory[idx + 1];
            if (!nextMsg) return true;
            return (msg.video_timestamp || 0) <= newTime && (nextMsg.video_timestamp || 0) > newTime;
        });

        if (targetIndex !== -1) {
            lastDisplayedIndexRef.current = targetIndex;
            // Update visible messages berdasarkan waktu baru
            const filteredMessages = chatHistory.slice(0, targetIndex + 1);
            setVisibleMessages(filteredMessages.slice(-MAX_VISIBLE_MESSAGES));
        }
    }, [isReplay]);

    // ============================================================
    // DRIPPING EFFECT - UNTUK LIVE STREAMING
    // ============================================================
    useEffect(() => {
        if (isReplay) return; // Dripping untuk live saja

        let drainInterval: NodeJS.Timeout;

        const startDraining = () => {
            if (messageQueue.current.length === 0) return;

            const queueLength = messageQueue.current.length;
            const delay = queueLength > 10 ? DRIP_DELAY_HIGH : queueLength > 5 ? DRIP_DELAY_MEDIUM : DRIP_DELAY_LOW;

            drainInterval = setInterval(() => {
                if (messageQueue.current.length > 0) {
                    const nextMessage = messageQueue.current.shift();

                    setVisibleMessages(prev => [...prev, nextMessage!].slice(-MAX_VISIBLE_MESSAGES));

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
        }, DRIP_CHECK_INTERVAL);

        return () => {
            clearInterval(drainInterval);
            clearInterval(checkerInterval);
        };
    }, [isReplay]);

    // ============================================================
    // REPLAY SYNC EFFECT - Tampilkan pesan berdasarkan video_timestamp
    // ============================================================
    // Effect trigger saat isReplay berubah (initial setup)
    useEffect(() => {
        if (!isReplay) {
            resetRenderer();
            return;
        }
    }, [isReplay, resetRenderer]);

    // Interval untuk sync replay dengan waktu video
    useEffect(() => {
        if (!isReplay) return;

        const syncInterval = setInterval(() => {
            // Logic ini akan dipanggil dengan chatHistory dari parent
            // via ref atau callback - kita butuh chatHistory dari luar
            // Tapi karena chatHistory di sini hanya untuk state management,
            // kita expose lastDisplayedIndexRef untuk parent mengelola
        }, REPLAY_SYNC_INTERVAL);

        return () => clearInterval(syncInterval);
    }, [isReplay]);

    return {
        visibleMessages,
        messageQueue,
        lastDisplayedIndex: lastDisplayedIndexRef.current,
        resetRenderer,
        addToVisibleMessages,
        handleVideoSeek
    };
}

// Hook tambahan untuk replay sync dengan chat history eksternal
export function useReplaySync(
    isReplay: boolean,
    currentVideoTime: number,
    chatHistory: LocalChatMessage[],
    onMessagesToShow: (messages: LocalChatMessage[], lastIndex: number) => void
) {
    const lastDisplayedIndexRef = useRef(0);

    useEffect(() => {
        if (!isReplay || chatHistory.length === 0) return;

        const currentTime = currentVideoTime;

        // Cari pesan yang harus ditampilkan berdasarkan waktu video saat ini
        let newLastIndex = lastDisplayedIndexRef.current;

        // Scan dari index terakhir yang ditampilkan
        for (let i = newLastIndex; i < chatHistory.length; i++) {
            const msg = chatHistory[i];
            const msgTimestamp = msg.video_timestamp || 0;

            if (msgTimestamp <= currentTime && i >= newLastIndex) {
                newLastIndex = i;
            } else if (msgTimestamp > currentTime) {
                break;
            }
        }

        // Jika ada pesan baru yang harus ditampilkan
        if (newLastIndex > lastDisplayedIndexRef.current) {
            const newMessages = chatHistory.slice(lastDisplayedIndexRef.current + 1, newLastIndex + 1);

            if (newMessages.length > 0) {
                onMessagesToShow(newMessages, newLastIndex);
                lastDisplayedIndexRef.current = newLastIndex;
            }
        }
    }, [isReplay]); // Di-trigger saat isReplay berubah

    // Interval untuk sync replay dengan waktu video
    useEffect(() => {
        if (!isReplay) return;

        const syncInterval = setInterval(() => {
            if (chatHistory.length === 0) return;

            const currentTime = currentVideoTime;
            const newMessages: LocalChatMessage[] = [];

            for (let i = lastDisplayedIndexRef.current; i < chatHistory.length; i++) {
                const msg = chatHistory[i];
                const msgTimestamp = msg.video_timestamp || 0;

                if (msgTimestamp <= currentTime && i >= lastDisplayedIndexRef.current) {
                    if (i > lastDisplayedIndexRef.current) {
                        newMessages.push(msg);
                    }
                } else if (msgTimestamp > currentTime) {
                    break;
                }
            }

            if (newMessages.length > 0) {
                onMessagesToShow(newMessages, lastDisplayedIndexRef.current + newMessages.length);
                lastDisplayedIndexRef.current += newMessages.length;
            }
        }, REPLAY_SYNC_INTERVAL);

        return () => clearInterval(syncInterval);
    }, [isReplay, currentVideoTime, chatHistory, onMessagesToShow]);

    return {
        lastDisplayedIndex: lastDisplayedIndexRef.current,
        resetIndex: () => {
            lastDisplayedIndexRef.current = 0;
        }
    };
}
