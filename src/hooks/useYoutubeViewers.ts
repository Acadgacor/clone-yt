import { useState, useEffect } from 'react';
import { ytService } from '@/services/YouTubeService';

export function useYoutubeViewers(videoId: string | undefined) {
    const [viewersCount, setViewersCount] = useState<number>(0);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<{ time: string, count: number }[]>(() => {
        if (typeof window !== 'undefined' && videoId) {
            const saved = localStorage.getItem(`analytics_${videoId}`);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) { }
            }
        }
        return [];
    });

    useEffect(() => {
        if (!videoId) return;

        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        const fetchViewers = async () => {
            try {
                const response = await ytService.fetchWithRetry((key) =>
                    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('YouTube API Error:', errorText);
                    throw new Error('Failed to fetch from YouTube API');
                }

                const data = await response.json();

                if (isMounted) {
                    if (!data.items || data.items.length === 0) {
                        setViewersCount(0);
                        setIsLive(false);
                    } else {
                        const liveStreamingDetails = data.items[0].liveStreamingDetails;
                        if (!liveStreamingDetails) {
                            setViewersCount(0);
                            setIsLive(false);
                        } else {
                            const viewers = liveStreamingDetails.concurrentViewers
                                ? parseInt(liveStreamingDetails.concurrentViewers, 10)
                                : 0;
                            setViewersCount(viewers);
                            setIsLive(viewers > 0);

                            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            setHistory(prev => {
                                if (prev.length > 0 && prev[prev.length - 1].time === now) {
                                    return prev;
                                }
                                const newHistory = [...prev, { time: now, count: viewers }].slice(-20);
                                localStorage.setItem(`analytics_${videoId}`, JSON.stringify(newHistory));
                                return newHistory;
                            });
                        }
                    }
                    setError(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error(err);
                    setError(err.message);
                }
            }
        };

        // Initial fetch
        fetchViewers();

        // Poll every 30 seconds
        pollInterval = setInterval(fetchViewers, 30000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [videoId]);

    return { viewersCount, isLive, error, history };
}
