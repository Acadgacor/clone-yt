'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Eye, Check, Bell, Youtube, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useYoutubeViewers } from '@/hooks/useYoutubeViewers';
import { useSupabase } from '@/supabase';
import { LiveAnalyticsChart } from './LiveAnalyticsChart';
import DOMPurify from 'dompurify';
import { ytService } from '@/services/YouTubeService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface VideoInfoProps {
    videoId: string;
}

export default function VideoInfo({ videoId }: VideoInfoProps) {
    const [videoData, setVideoData] = useState<any>(null);
    const [channelAvatar, setChannelAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeframe, setTimeframe] = useState<string>('30m');
    const { auth } = useSupabase();
    const { toast } = useToast();
    const { history } = useYoutubeViewers(videoId);

    const getFilteredHistory = () => {
        if (!history || history.length === 0) return [];
        const maxPoints = history.length;
        let points = 60;
        switch (timeframe) {
            case '1m': points = Math.min(2, maxPoints); break;
            case '3m': points = Math.min(6, maxPoints); break;
            case '5m': points = Math.min(10, maxPoints); break;
            case '15m': points = Math.min(30, maxPoints); break;
            case '30m': points = Math.min(60, maxPoints); break;
            case '1h': points = Math.min(120, maxPoints); break;
            case '2h': points = Math.min(240, maxPoints); break;
            case '3h': points = Math.min(360, maxPoints); break;
            default: points = Math.min(60, maxPoints);
        }
        return history.slice(-points);
    };

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const res = await ytService.fetchWithRetry((key) =>
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`
                );
                const data = await res.json();

                if (data.items && data.items.length > 0) {
                    const videoDetails = data.items[0];
                    setVideoData(videoDetails);

                    // Fetch Profile Avatar of the Channel
                    if (videoDetails.snippet?.channelId) {
                        try {
                            const channelRes = await ytService.fetchWithRetry((key) =>
                                `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${videoDetails.snippet.channelId}&key=${key}`
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

    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            if (!videoData?.snippet?.channelId) return;
            
            // Get fresh token from session
            const { data: sessionData } = await auth.getSession();
            const providerToken = sessionData.session?.provider_token;
            const localToken = localStorage.getItem('google_access_token');
            
            console.log('Debug - provider_token:', providerToken ? 'exists' : 'null');
            console.log('Debug - localStorage token:', localToken ? 'exists' : 'null');
            
            let accessToken = providerToken || localToken;
            
            if (!accessToken) {
                console.log('Debug: No access token available');
                return;
            }

            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${videoData.snippet.channelId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                
                // Handle 401 - token expired
                if (res.status === 401) {
                    localStorage.removeItem('google_access_token');
                    toast({
                        title: "Sesi Berakhir",
                        description: "Silakan login ulang untuk mengakses fitur YouTube.",
                        variant: "destructive"
                    });
                    return;
                }
                
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    setIsSubscribed(true);
                    setSubscriptionId(data.items[0].id);
                }
            } catch (error) {
                console.error("Error fetching subscription status:", error);
            }
        };

        fetchSubscriptionStatus();
    }, [videoData, auth]);

    const handleSubscribeToggle = async () => {
        // Get fresh token from session
        const { data: sessionData } = await auth.getSession();
        let accessToken = sessionData.session?.provider_token || localStorage.getItem('google_access_token');
        
        if (!accessToken) {
            toast({
                title: "Akses Ditolak",
                description: "Kamu harus login untuk melakukan subscribe.",
                variant: "destructive"
            });
            return;
        }

        if (!videoData?.snippet?.channelId) return;

        setIsSubmitting(true);
        try {
            if (isSubscribed && subscriptionId) {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/subscriptions?id=${subscriptionId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (res.ok || res.status === 204) {
                    setIsSubscribed(false);
                    setSubscriptionId(null);
                } else if (res.status === 401) {
                    localStorage.removeItem('google_access_token');
                    throw new Error("Sesi berakhir, silakan login ulang.");
                } else {
                    throw new Error("Gagal unsubscribe");
                }
            } else {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            snippet: {
                                resourceId: {
                                    kind: "youtube#channel",
                                    channelId: videoData.snippet.channelId
                                }
                            }
                        })
                    }
                );

                const data = await res.json();
                if (res.ok && data.id) {
                    setIsSubscribed(true);
                    setSubscriptionId(data.id);
                } else if (res.status === 401) {
                    localStorage.removeItem('google_access_token');
                    throw new Error("Sesi berakhir, silakan login ulang.");
                } else {
                    throw new Error(data.error?.message || "Gagal subscribe");
                }
            }
        } catch (error) {
            console.error("Error toggling subscription:", error);
            toast({
                title: "Terjadi Kesalahan",
                description: "Gagal memproses permintaan subscribe.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-28 animate-pulse bg-white/[0.02] rounded-3xl mt-5 w-full border border-white/[0.03]" />;
    if (!videoData) return null;

    const { snippet, statistics } = videoData;

    const formatNumber = (num: string) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(Number(num));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-4 p-5 md:p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01] backdrop-blur-sm shadow-[0_12px_40px_-10px_rgba(0,0,0,0.4)] flex flex-col gap-4"
        >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                {snippet.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                    {channelAvatar ? (
                        <img
                            src={channelAvatar}
                            alt={snippet.channelTitle}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white/[0.08] shadow-lg shadow-black/50"
                        />
                    ) : (
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-red-600/40">
                            {snippet.channelTitle.charAt(0)}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm md:text-base">{snippet.channelTitle}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">Channel</span>
                    </div>

                    <Button
                        variant={isSubscribed ? "outline" : "default"}
                        size="sm"
                        onClick={handleSubscribeToggle}
                        disabled={isSubmitting || loading}
                        className={`rounded-full px-6 h-10 font-semibold text-xs transition-all duration-300 ${
                            isSubscribed 
                                ? "bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/[0.06] hover:border-white/[0.1]" 
                                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-0 shadow-lg shadow-red-600/40 hover:shadow-red-600/60"
                        }`}
                    >
                        {isSubscribed ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Subscribed
                            </>
                        ) : (
                            <>
                                <Bell className="w-4 h-4 mr-2" />
                                Subscribe
                            </>
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-xs font-medium border border-white/[0.04]">
                        <ThumbsUp className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-200">{formatNumber(statistics.likeCount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-xs font-medium border border-white/[0.04]">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-200">{formatNumber(statistics.viewCount || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Safe Description Render */}
            {snippet.description && (
                <div className="mt-3 text-sm text-zinc-400 whitespace-pre-wrap overflow-hidden p-5 bg-white/[0.02] rounded-2xl border border-white/[0.03] max-h-44 overflow-y-auto leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(snippet.description) }} />
                </div>
            )}

            {/* Live Analytics Section */}
            {history && history.length > 0 && (
                <div className="mt-5 pt-6 border-t border-white/[0.03]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <TrendingUp className="w-5 h-5 text-red-500" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Live Analytics</h3>
                        </div>
                        <Select value={timeframe} onValueChange={setTimeframe}>
                            <SelectTrigger className="w-[130px] h-9 text-xs bg-white/[0.03] border-white/[0.06] rounded-xl text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all">
                                <SelectValue placeholder="Timeframe" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/[0.06] rounded-xl">
                                <SelectItem value="1m" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">1 Menit</SelectItem>
                                <SelectItem value="3m" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">3 Menit</SelectItem>
                                <SelectItem value="5m" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">5 Menit</SelectItem>
                                <SelectItem value="15m" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">15 Menit</SelectItem>
                                <SelectItem value="30m" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">30 Menit</SelectItem>
                                <SelectItem value="1h" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">1 Jam</SelectItem>
                                <SelectItem value="2h" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">2 Jam</SelectItem>
                                <SelectItem value="3h" className="text-zinc-300 focus:bg-white/[0.06] focus:text-white rounded-lg">3 Jam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.04] w-full h-[200px] md:h-[240px] border border-white/[0.06] rounded-2xl overflow-hidden pt-3 pl-3 relative">
                        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/[0.06]">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-zinc-400 font-medium">Live</span>
                        </div>
                        <LiveAnalyticsChart data={getFilteredHistory()} />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
