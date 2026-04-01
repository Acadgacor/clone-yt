import { useState, useEffect, useMemo } from 'react';
import { ytService } from '@/services/YouTubeService';
import { createClient } from '@/lib/supabase/client';

export function useYoutubeViewers(videoId: string | undefined) {
    const [viewersCount, setViewersCount] = useState<number>(0);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<{ time: string, count: number }[]>([]);
    
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!videoId) return;

        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        const fetchInitialHistory = async () => {
            const { data, error } = await supabase
                .from('live_history')
                .select('time, viewers_count')
                .eq('youtube_video_id', videoId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data && isMounted) {
                const formattedHistory = data.reverse().map(item => ({
                    time: item.time,
                    count: item.viewers_count
                }));
                setHistory(formattedHistory);
            }
        };

        fetchInitialHistory();

        const fetchViewers = async () => {
            try {
                const response = await ytService.fetchWithRetry((key) =>
                    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}` 
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch from YouTube API');
                }

                const data = await response.json();

                if (isMounted) {
                    if (!data.items || data.items.length === 0 || !data.items[0].liveStreamingDetails) {
                        setViewersCount(0);
                        setIsLive(false);
                    } else {
                        const liveStreamingDetails = data.items[0].liveStreamingDetails;
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
                            
                            supabase.from('live_history').insert({
                                youtube_video_id: videoId,
                                time: now,
                                viewers_count: viewers
                            }).then(({ error: insertError }) => {
                                if (insertError) console.error("Gagal menyimpan ke Supabase:", insertError);
                            });

                            return newHistory;
                        });
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

        fetchViewers();

        pollInterval = setInterval(fetchViewers, 30000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [videoId, supabase]);

    return { viewersCount, isLive, error, history };
}
