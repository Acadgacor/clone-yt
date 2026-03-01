import { useState, useEffect } from 'react';

export function useYoutubeViewers(videoId: string | undefined) {
    const [viewersCount, setViewersCount] = useState<number>(0);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!videoId) return;

        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        // Use the explicit API key if provided, else try fallback (will only work if set with NEXT_PUBLIC prefix for client side)
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        if (!apiKey) {
            setError('Missing API Key. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env');
            return;
        }

        const fetchViewers = async () => {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`
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

    return { viewersCount, isLive, error };
}
