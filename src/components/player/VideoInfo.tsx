'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Eye } from 'lucide-react';

interface VideoInfoProps {
    videoId: string;
}

export default function VideoInfo({ videoId }: VideoInfoProps) {
    const [videoData, setVideoData] = useState<any>(null);
    const [channelAvatar, setChannelAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                if (!apiKey) {
                    console.error("API Key tidak ditemukan");
                    return;
                }
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
                );
                const data = await res.json();

                if (data.items && data.items.length > 0) {
                    const videoDetails = data.items[0];
                    setVideoData(videoDetails);

                    // Fetch Profile Avatar of the Channel
                    if (videoDetails.snippet?.channelId) {
                        try {
                            const channelRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${videoDetails.snippet.channelId}&key=${apiKey}`
                            );
                            const channelData = await channelRes.json();
                            if (channelData.items && channelData.items.length > 0) {
                                const avatarUrl = channelData.items[0].snippet?.thumbnails?.default?.url;
                                if (avatarUrl) {
                                    setChannelAvatar(avatarUrl);
                                }
                            }
                        } catch (avatarError) {
                            console.error("Error fetching channel avatar:", avatarError);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching video info:", error);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) fetchVideoDetails();
    }, [videoId]);

    if (loading) return <div className="h-24 animate-pulse bg-muted/20 rounded-xl mt-4 w-full border border-border/50" />;
    if (!videoData) return null;

    const { snippet, statistics } = videoData;

    const formatNumber = (num: string) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(Number(num));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 p-4 md:p-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col gap-3"
        >
            <h1 className="text-lg md:text-xl font-bold text-foreground line-clamp-2 leading-tight">
                {snippet.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {channelAvatar ? (
                        <img
                            src={channelAvatar}
                            alt={snippet.channelTitle}
                            className="w-10 h-10 rounded-full object-cover border border-border/50 shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                            {snippet.channelTitle.charAt(0)}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{snippet.channelTitle}</span>
                        <span className="text-xs text-muted-foreground">Channel</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-medium border border-border/50">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{formatNumber(statistics.likeCount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-medium border border-border/50">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatNumber(statistics.viewCount || 0)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
